/**
 * Feature: Referral hook calls REST endpoints, not Supabase
 *
 *   Scenario: code is fetched from /referrals/code on mount
 *     Given the user is authenticated
 *     When useReferral mounts
 *     Then it POSTs to /referrals/code with the auth token
 *     And exposes the returned code
 *
 *   Scenario: referrals list is fetched from /referrals
 *     Given the user is authenticated
 *     When useReferral mounts
 *     Then it GETs /referrals with the auth token
 *     And exposes the masked list with stats
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReferral } from '../useReferral';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 't@example.com' } }),
}));

beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cf_session', 'test-session-token');
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  if (typeof localStorage !== 'undefined') localStorage.removeItem('cf_session');
});

describe('useReferral — REST migration (no supabase.rpc / .from)', () => {
  it('POSTs /referrals/code with auth header and exposes the code', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url, init) => {
      const u = String(url);
      if (u.endsWith('/referrals/code')) {
        const auth = (init?.headers as Record<string, string>)?.Authorization;
        expect(auth).toBe('Bearer test-session-token');
        expect(init?.method).toBe('POST');
        return new Response(JSON.stringify({ code: 'ABC123XY' }), { status: 200 });
      }
      if (u.endsWith('/referrals')) {
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }
      throw new Error(`unexpected url ${u}`);
    });

    const { result } = renderHook(() => useReferral());
    await waitFor(() => expect(result.current.referralCode).toBe('ABC123XY'));
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('GETs /referrals and computes stats from the response', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const u = String(url);
      if (u.endsWith('/referrals/code')) {
        return new Response(JSON.stringify({ code: 'ABC' }), { status: 200 });
      }
      if (u.endsWith('/referrals')) {
        return new Response(JSON.stringify({
          data: [
            { id: '1', referrer_id: 'user-1', referred_email: 'a@b.co',  status: 'pending',   reward_points: 0,   order_id: null, created_at: '2026-05-01', converted_at: null },
            { id: '2', referrer_id: 'user-1', referred_email: 'c@d.co',  status: 'converted', reward_points: 500, order_id: 'o1', created_at: '2026-05-02', converted_at: '2026-05-02' },
            { id: '3', referrer_id: 'user-1', referred_email: null,      status: 'pending',   reward_points: 0,   order_id: null, created_at: '2026-05-03', converted_at: null },
          ],
        }), { status: 200 });
      }
      throw new Error(`unexpected url ${u}`);
    });

    const { result } = renderHook(() => useReferral());
    await waitFor(() => expect(result.current.stats.totalReferrals).toBe(2));
    expect(result.current.stats.convertedReferrals).toBe(1);
    expect(result.current.stats.totalPointsEarned).toBe(500);
    // Email masking is applied
    expect(result.current.referrals[0].referred_email).toContain('***');
  });
});
