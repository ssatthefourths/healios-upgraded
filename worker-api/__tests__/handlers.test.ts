/**
 * Worker handler tests — exercise the new endpoints against an in-memory
 * D1 mock + KV mock. We assert HTTP shape (status, JSON shape, auth gate)
 * rather than running real wrangler `unstable_dev` since that would hit
 * Cloudflare's edge and isn't free-tier friendly for CI.
 *
 * Feature: Referral codes (POST /referrals/code)
 *   Scenario: First call generates and persists a code
 *   Scenario: Subsequent calls return the same code
 *   Scenario: Missing auth → 401
 *
 * Feature: Gift card validate (POST /gift-cards/validate)
 *   Scenario: Valid code → balance returned
 *   Scenario: Inactive code → valid=false
 *
 * Feature: Admin security stats (GET /admin/checkout-security-stats)
 *   Scenario: Non-admin → 403
 *   Scenario: Admin → totals shape
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleReferrals } from '../src/referrals';
import { handleGiftCards } from '../src/gift-cards';
import { handleAdminAnalytics } from '../src/admin-analytics';

// Minimal D1 mock — supports prepare/bind/run/first/all on a tiny in-memory
// table set. Just enough for the handlers' actual queries.
class FakeStmt {
  constructor(private db: FakeD1, private sql: string, private params: unknown[] = []) {}
  bind(...p: unknown[]) { return new FakeStmt(this.db, this.sql, p); }
  async first<T = unknown>(): Promise<T | null> { return this.db.runFirst(this.sql, this.params) as T | null; }
  async all<T = unknown>(): Promise<{ results: T[] }> { return { results: this.db.runAll(this.sql, this.params) as T[] }; }
  async run() { this.db.runWrite(this.sql, this.params); return { meta: { changes: 1 } }; }
}

class FakeD1 {
  tables: Record<string, any[]> = {
    referral_codes: [],
    referrals: [],
    gift_cards: [
      { code: 'GIFT1', remaining_balance: 50, is_active: 1, expires_at: null },
      { code: 'GIFT2', remaining_balance: 50, is_active: 0, expires_at: null },
    ],
    user_roles: [{ user_id: 'admin-1', role: 'admin' }],
    orders: [],
  };
  prepare(sql: string) { return new FakeStmt(this, sql); }

  runFirst(sql: string, p: unknown[]): unknown {
    if (/SELECT code FROM referral_codes WHERE user_id = \?/.test(sql)) {
      const row = this.tables.referral_codes.find(r => r.user_id === p[0]);
      return row ? { code: row.code } : null;
    }
    if (/SELECT remaining_balance, is_active, expires_at FROM gift_cards/.test(sql)) {
      const row = this.tables.gift_cards.find(r => r.code === p[0]);
      return row ?? null;
    }
    if (/SELECT role FROM user_roles WHERE user_id = \?/.test(sql)) {
      const row = this.tables.user_roles.find(r => r.user_id === p[0]);
      return row ?? null;
    }
    if (/^\s*SELECT[\s\S]+FROM orders[\s\S]+WHERE created_at >=/i.test(sql)) {
      return { total: 0, confirmed: 0, cancelled: 0, pending: 0, with_discount: 0 };
    }
    return null;
  }
  runAll(_sql: string, _p: unknown[]): unknown[] { return []; }
  runWrite(sql: string, p: unknown[]) {
    if (/INSERT INTO referral_codes/.test(sql)) {
      this.tables.referral_codes.push({ user_id: p[0], code: p[1] });
    }
  }
  async batch(_stmts: unknown[]) { return []; }
}

class FakeKV {
  m = new Map<string, string>();
  async get(k: string) { return this.m.get(k) ?? null; }
  async delete(k: string) { this.m.delete(k); }
  set(k: string, v: string) { this.m.set(k, v); }
}

const makeEnv = () => {
  const kv = new FakeKV();
  kv.set('user-token',   'user-1');
  kv.set('admin-token',  'admin-1');
  return { DB: new FakeD1(), SESSIONS: kv } as any;
};

const req = (path: string, init: RequestInit = {}) =>
  new Request(`https://api.test${path}`, init);

describe('Referrals worker', () => {
  let env: any;
  beforeEach(() => { env = makeEnv(); });

  it('POST /referrals/code generates a fresh code on first call', async () => {
    const res = await handleReferrals(req('/referrals/code', {
      method: 'POST', headers: { Authorization: 'Bearer user-token' },
    }), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.code).toMatch(/^[A-Z2-9]{8}$/);
  });

  it('POST /referrals/code returns the same code on a second call', async () => {
    const first = await (await handleReferrals(req('/referrals/code', {
      method: 'POST', headers: { Authorization: 'Bearer user-token' },
    }), env)).json();
    const second = await (await handleReferrals(req('/referrals/code', {
      method: 'POST', headers: { Authorization: 'Bearer user-token' },
    }), env)).json();
    expect(second.code).toBe(first.code);
  });

  it('POST /referrals/code without auth → 401', async () => {
    const res = await handleReferrals(req('/referrals/code', { method: 'POST' }), env);
    expect(res.status).toBe(401);
  });
});

describe('Gift card validate', () => {
  it('valid active code returns balance', async () => {
    const env = makeEnv();
    const res = await handleGiftCards(req('/gift-cards/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'GIFT1' }),
    }), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.balance).toBe(50);
  });

  it('inactive code → valid=false', async () => {
    const env = makeEnv();
    const res = await handleGiftCards(req('/gift-cards/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'GIFT2' }),
    }), env);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toMatch(/inactive/i);
  });
});

describe('Admin checkout-security-stats', () => {
  it('non-admin caller → 403', async () => {
    const env = makeEnv();
    const res = await handleAdminAnalytics(req('/admin/checkout-security-stats', {
      headers: { Authorization: 'Bearer user-token' },
    }), env);
    expect(res.status).toBe(403);
  });

  it('admin caller → totals shape', async () => {
    const env = makeEnv();
    const res = await handleAdminAnalytics(req('/admin/checkout-security-stats', {
      headers: { Authorization: 'Bearer admin-token' },
    }), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totals');
    expect(body.totals).toHaveProperty('total');
    expect(body.totals).toHaveProperty('confirmed');
  });
});
