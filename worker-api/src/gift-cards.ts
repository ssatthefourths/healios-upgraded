import { Env } from './index';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 ambiguity
  const segments = [4, 4, 4];
  return segments
    .map(() => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
    .join('-');
}

export async function handleGiftCards(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  // POST /gift-cards/purchase
  if (path === '/gift-cards/purchase' && request.method === 'POST') {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors });
    }

    const { amount, senderEmail, recipientEmail, recipientName, personalMessage, userId } = body;

    if (!amount || amount <= 0 || !senderEmail) {
      return new Response(JSON.stringify({ error: 'Amount and sender email are required' }), { status: 400, headers: cors });
    }

    // Generate a unique code (retry up to 5 times if collision)
    let code = '';
    for (let i = 0; i < 5; i++) {
      code = generateGiftCardCode();
      const existing = await env.DB.prepare('SELECT id FROM gift_cards WHERE code = ?').bind(code).first();
      if (!existing) break;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO gift_cards (id, code, original_amount, remaining_balance, purchaser_id, purchaser_email, recipient_email, recipient_name, personal_message, is_active, purchased_at, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).bind(
      id, code, amount, amount,
      userId || null, senderEmail,
      recipientEmail || null, recipientName || null, personalMessage || null,
      now, expiresAt, now, now
    ).run();

    const txId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO gift_card_transactions (id, gift_card_id, amount, transaction_type, created_at)
      VALUES (?, ?, ?, 'purchase', ?)
    `).bind(txId, id, amount, now).run();

    return new Response(JSON.stringify({ success: true, code, id }), { headers: cors });
  }

  // POST /gift-cards/validate  — replaces RPC validate_gift_card.
  // { code } → { valid, balance, currency, error? }
  // Read-only; deliberately does not return the gift_card row to avoid
  // leaking purchaser/recipient PII.
  if (path === '/gift-cards/validate' && request.method === 'POST') {
    let body: any;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors }); }

    const code = (body?.code ?? '').toString().trim().toUpperCase();
    if (!code) return new Response(JSON.stringify({ valid: false, error: 'Code required' }), { status: 400, headers: cors });

    const card = await env.DB.prepare(
      'SELECT remaining_balance, is_active, expires_at FROM gift_cards WHERE code = ?'
    ).bind(code).first<{ remaining_balance: number; is_active: number; expires_at: string }>();

    if (!card) return new Response(JSON.stringify({ valid: false, error: 'Not found' }), { headers: cors });
    if (!card.is_active) return new Response(JSON.stringify({ valid: false, error: 'Inactive' }), { headers: cors });
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, error: 'Expired' }), { headers: cors });
    }
    if ((card.remaining_balance ?? 0) <= 0) {
      return new Response(JSON.stringify({ valid: false, error: 'No balance remaining' }), { headers: cors });
    }
    return new Response(JSON.stringify({ valid: true, balance: card.remaining_balance }), { headers: cors });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: cors });
}
