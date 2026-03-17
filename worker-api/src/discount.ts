/**
 * Discount Code Validation Handler
 * Validates discount codes against the D1 discount_codes table.
 * Answers: is this code valid, and how much does it save?
 */

import { Env } from './index';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

export async function handleDiscount(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { code: string; subtotal: number };
  try {
    body = await request.json() as { code: string; subtotal: number };
  } catch {
    return json({ valid: false, error: 'Invalid request body' }, 400);
  }

  const { code, subtotal } = body;
  if (!code || typeof subtotal !== 'number') {
    return json({ valid: false, error: 'code and subtotal are required' }, 400);
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const row = await env.DB.prepare(
      `SELECT * FROM discount_codes
       WHERE code = ? AND is_active = 1
       LIMIT 1`
    ).bind(normalizedCode).first() as any;

    if (!row) {
      return json({ valid: false, error: 'Invalid discount code' });
    }

    const now = new Date();

    if (row.valid_from && new Date(row.valid_from) > now) {
      return json({ valid: false, error: 'This discount code is not yet active' });
    }

    if (row.valid_until && new Date(row.valid_until) < now) {
      return json({ valid: false, error: 'This discount code has expired' });
    }

    if (row.max_uses !== null && row.max_uses !== undefined && row.current_uses >= row.max_uses) {
      return json({ valid: false, error: 'This discount code has been fully redeemed' });
    }

    if (row.min_order_amount && subtotal < row.min_order_amount) {
      return json({
        valid: false,
        error: `Minimum order amount of £${Number(row.min_order_amount).toFixed(2)} required`,
      });
    }

    let discountAmount: number;
    if (row.discount_type === 'percentage') {
      discountAmount = (subtotal * Number(row.discount_value)) / 100;
    } else {
      discountAmount = Math.min(Number(row.discount_value), subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    return json({
      valid: true,
      code: row.code,
      discount_type: row.discount_type,
      discount_value: Number(row.discount_value),
      discount_amount: discountAmount,
      message: row.discount_type === 'percentage'
        ? `${row.discount_value}% off applied!`
        : `£${Number(row.discount_value).toFixed(2)} off applied!`,
    });
  } catch (err: any) {
    console.error('Discount validation error:', err.message);
    return json({ valid: false, error: 'An error occurred' }, 500);
  }
}
