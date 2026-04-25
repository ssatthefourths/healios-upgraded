import type { Env } from './index';
import {
  renderShippingConfirmation,
  renderDeliveryConfirmation,
} from './emails/generated';

/**
 * Per-state-transition email triggers for the order state machine.
 * Closes tickets #3 (shipping) and #5 (processing) in
 * HealiosIssuesFeedback_v3.csv by wiring the existing React Email
 * templates to the actual status-change events.
 *
 * - sendShippingEmail fires when admin marks an order `shipped` and
 *   passes the courier + tracking number captured at that moment.
 * - sendDeliveryEmail fires when an order transitions to `delivered`
 *   (admin manual mark OR customer-confirm CTA — same email either way).
 *
 * No "processing" template exists yet, so we don't currently fire one
 * on the pending → processing transition. When Monique designs that
 * template she just adds it to src/lib/emails/emails/transactional/
 * and wires a sendProcessingEmail() here.
 */

type OrderRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  shipping_address: string | null;
  shipping_address_2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  currency?: string | null;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

const SITE = 'https://www.thehealios.com';

function buildShippingAddress(o: OrderRow): { name: string; lines: string[] } | undefined {
  const name = `${o.first_name ?? ''} ${o.last_name ?? ''}`.trim() || 'Customer';
  const lines = [
    o.shipping_address,
    o.shipping_address_2,
    o.shipping_city,
    o.shipping_postal_code,
    o.shipping_country,
  ].filter((s): s is string => !!s && s.trim().length > 0);
  if (lines.length === 0) return undefined;
  return { name, lines };
}

function recipientUrls(email: string): { unsubscribeUrl: string; preferencesUrl: string } {
  // Phase-8b will replace these with per-recipient signed tokens.
  // Until then we ship simple email-keyed query-string URLs so the
  // template doesn't render literal "{{unsubscribe_url}}" text.
  const e = encodeURIComponent(email);
  return {
    unsubscribeUrl: `${SITE}/unsubscribe?email=${e}`,
    preferencesUrl: `${SITE}/account?tab=preferences`,
  };
}

export async function sendShippingEmail(env: Env, orderId: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[order-emails] RESEND_API_KEY not set — shipping email skipped');
    return;
  }

  const order = await env.DB.prepare(
    `SELECT id, email, first_name, last_name,
            shipping_address, shipping_address_2, shipping_city,
            shipping_postal_code, shipping_country,
            tracking_carrier, tracking_number, tracking_url
     FROM orders WHERE id = ?`,
  ).bind(orderId).first<OrderRow>();

  if (!order || !order.email) {
    console.warn(`[order-emails] order ${orderId} not found or missing email`);
    return;
  }

  const { unsubscribeUrl, preferencesUrl } = recipientUrls(order.email);

  const html = await renderShippingConfirmation({
    customerName: order.first_name || 'there',
    orderNumber: order.id,
    carrier: order.tracking_carrier || 'Royal Mail',
    trackingNumber: order.tracking_number || undefined,
    trackingUrl: order.tracking_url || undefined,
    shippingAddress: buildShippingAddress(order),
    unsubscribeUrl,
    preferencesUrl,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Healios <orders@thehealios.com>',
      to: order.email,
      subject: `Your order is on the way — ${order.id}`,
      html,
    }),
  });
  if (!res.ok) console.error('[order-emails] shipping resend error', await res.text());
}

export async function sendDeliveryEmail(env: Env, orderId: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('[order-emails] RESEND_API_KEY not set — delivery email skipped');
    return;
  }

  const order = await env.DB.prepare(
    `SELECT id, email, first_name, last_name FROM orders WHERE id = ?`,
  ).bind(orderId).first<OrderRow>();

  if (!order || !order.email) return;

  const { unsubscribeUrl, preferencesUrl } = recipientUrls(order.email);

  const html = await renderDeliveryConfirmation({
    customerName: order.first_name || 'there',
    orderNumber: order.id,
    reviewUrl: `${SITE}/account/orders/${order.id}/review`,
    unsubscribeUrl,
    preferencesUrl,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Healios <orders@thehealios.com>',
      to: order.email,
      subject: `Your Healios order has arrived — ${order.id}`,
      html,
    }),
  });
  if (!res.ok) console.error('[order-emails] delivery resend error', await res.text());
}
