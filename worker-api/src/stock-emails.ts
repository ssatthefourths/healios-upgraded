import type { Env } from './index';

/**
 * Back-in-stock notification trigger.
 *
 * Fires when admin restocks a product (transition from stock_quantity = 0
 * → positive). Selects every still-pending subscription on that product
 * (notified_at IS NULL), sends each subscriber a Resend email, then stamps
 * notified_at so we can't double-send. Subscribers re-subscribe by
 * un-notifying — DELETE-then-POST from the frontend.
 *
 * Wired from the admin product PUT handler in worker-api/src/products.ts.
 * Errors are logged but never throw; a stock update should never fail
 * because the email helper hit a snag.
 */

const SITE = 'https://www.thehealios.com';

type SubRow = {
  id: string;
  user_id: string;
  email: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  image: string | null;
};

export async function notifyBackInStock(productId: string, env: Env): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[stock-emails] RESEND_API_KEY not set — back-in-stock email skipped');
    return;
  }

  // Pending subscriptions joined to the user's email so we don't need a
  // second roundtrip per subscriber.
  const { results: subs } = await env.DB.prepare(
    `SELECT sn.id, sn.user_id, u.email
     FROM stock_notifications sn
     JOIN users u ON u.id = sn.user_id
     WHERE sn.product_id = ? AND sn.notified_at IS NULL`,
  ).bind(productId).all<SubRow>();

  if (!subs || subs.length === 0) return;

  const product = await env.DB.prepare(
    `SELECT id, name, slug, image FROM products WHERE id = ?`,
  ).bind(productId).first<ProductRow>();

  if (!product) {
    console.warn(`[stock-emails] product ${productId} not found — abort`);
    return;
  }

  const productUrl = `${SITE}/product/${product.slug || product.id}`;
  const productImage = product.image
    ? (product.image.startsWith('http') ? product.image : `${SITE}${product.image}`)
    : null;

  // Minimal HTML email — purposely lightweight rather than wiring a full
  // React Email template. Restock is low-frequency and the message is short.
  // When Phase 8b ships the admin-editor we can replace this with a
  // template-driven send.
  const subject = `${product.name} is back in stock`;
  const html = `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2a2a2a;">
  <h1 style="font-family: 'Playfair Display', Georgia, serif; font-weight: 400; font-size: 28px;">It's back.</h1>
  <p style="font-size: 16px; line-height: 1.6;">
    You asked us to let you know — <strong>${escapeHtml(product.name)}</strong> is back in stock and ready to ship.
  </p>
  ${productImage ? `<p style="margin: 24px 0;"><img src="${productImage}" alt="${escapeHtml(product.name)}" style="max-width: 240px; height: auto; display: block;" /></p>` : ''}
  <p style="margin: 32px 0;">
    <a href="${productUrl}" style="background: #2a2a2a; color: #fff; padding: 14px 24px; text-decoration: none; display: inline-block; font-size: 14px; letter-spacing: 0.05em;">Shop now →</a>
  </p>
  <p style="font-size: 13px; color: #888; margin-top: 40px;">
    You're receiving this because you signed up for back-in-stock alerts on thehealios.com.
  </p>
</body></html>`;

  // One Resend call per recipient. Resend doesn't support BCC for marketing-
  // style sends and we want individual delivery telemetry anyway.
  const sentIds: string[] = [];
  for (const sub of subs) {
    if (!sub.email) continue;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Healios <hello@thehealios.com>',
          to: sub.email,
          subject,
          html,
        }),
      });
      if (res.ok) sentIds.push(sub.id);
      else console.error('[stock-emails] resend error for', sub.email, await res.text());
    } catch (err: any) {
      console.error('[stock-emails] send failed for', sub.email, err?.message);
    }
  }

  if (sentIds.length > 0) {
    const placeholders = sentIds.map(() => '?').join(',');
    await env.DB.prepare(
      `UPDATE stock_notifications SET notified_at = unixepoch() WHERE id IN (${placeholders})`,
    ).bind(...sentIds).run();
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
