/**
 * Invoice generation — replaces functions.invoke('generate-invoice').
 *
 * Renders a server-side HTML invoice for a given order. HTML rather than
 * PDF: Workers free tier doesn't support a native PDF lib (pdfkit is too
 * large, and Browser Rendering is paid). HTML is print-to-PDF friendly
 * from any browser (Cmd/Ctrl+P → Save as PDF), and emails clients render
 * it inline.
 */
import { Env } from './index';
import { requireAuth, jsonHeaders, notFound, forbidden } from './lib/auth-helpers';

const HTML_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'text/html; charset=utf-8',
  // Allow browser to print without strict CSP friction.
  'Cache-Control': 'private, max-age=300',
};

function escapeHtml(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtMoney(amount: number, currency: string): string {
  const n = Number(amount || 0);
  const sym = currency === 'GBP' ? '£' : currency === 'ZAR' ? 'R' : currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '';
  return `${sym}${n.toFixed(2)}`;
}

function renderInvoice(order: any, items: any[]): string {
  const cur = (order.currency || 'GBP').toUpperCase();
  const subtotal = items.reduce((s, it) => s + Number(it.line_total || 0), 0);
  const shipping = Number(order.shipping_cost || 0);
  const discount = Number(order.discount_amount || 0);
  const total = Number(order.total || subtotal + shipping - discount);

  const rowsHtml = items.map(it => `
    <tr>
      <td>${escapeHtml(it.product_name)}</td>
      <td style="text-align:right">${it.quantity}</td>
      <td style="text-align:right">${fmtMoney(Number(it.unit_price || 0), cur)}</td>
      <td style="text-align:right">${fmtMoney(Number(it.line_total || 0), cur)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Invoice ${escapeHtml(order.order_number || order.id)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color:#222; max-width:760px; margin:32px auto; padding:0 24px; }
  h1 { font-size:28px; margin:0 0 4px; }
  .muted { color:#666; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  th, td { padding:8px 6px; border-bottom:1px solid #eee; text-align:left; }
  th { font-weight:600; background:#fafafa; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:24px; }
  .totals td { padding:6px; }
  .totals .total td { font-weight:700; border-top:2px solid #222; }
  @media print { body { margin:0; } }
</style>
</head><body>
  <header style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1>The Healios</h1>
      <div class="muted">https://thehealios.com</div>
    </div>
    <div style="text-align:right">
      <h2 style="margin:0">Invoice</h2>
      <div class="muted">${escapeHtml(order.order_number || order.id)}</div>
      <div class="muted">${escapeHtml(order.created_at?.slice(0, 10) || '')}</div>
    </div>
  </header>

  <div class="grid">
    <div>
      <h3>Bill to</h3>
      <div>${escapeHtml(order.customer_first_name)} ${escapeHtml(order.customer_last_name)}</div>
      <div>${escapeHtml(order.customer_email)}</div>
    </div>
    <div>
      <h3>Ship to</h3>
      <div>${escapeHtml(order.shipping_address)}</div>
      ${order.shipping_address_2 ? `<div>${escapeHtml(order.shipping_address_2)}</div>` : ''}
      <div>${escapeHtml(order.shipping_city)}, ${escapeHtml(order.shipping_postal_code)}</div>
      <div>${escapeHtml(order.shipping_country)}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <table class="totals" style="margin-top:8px;width:auto;margin-left:auto;">
    <tr><td>Subtotal</td><td style="text-align:right">${fmtMoney(subtotal, cur)}</td></tr>
    ${shipping > 0 ? `<tr><td>Shipping</td><td style="text-align:right">${fmtMoney(shipping, cur)}</td></tr>` : ''}
    ${discount > 0 ? `<tr><td>Discount${order.discount_code ? ` (${escapeHtml(order.discount_code)})` : ''}</td><td style="text-align:right">-${fmtMoney(discount, cur)}</td></tr>` : ''}
    <tr class="total"><td>Total</td><td style="text-align:right">${fmtMoney(total, cur)}</td></tr>
  </table>

  <p class="muted" style="margin-top:32px">Thank you for shopping with The Healios. Questions? Reply to ${escapeHtml((order.customer_email && 'support@thehealios.com') || 'support@thehealios.com')}.</p>
</body></html>`;
}

export async function handleInvoice(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: HTML_HEADERS });
  if (request.method !== 'GET') return notFound();

  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const url = new URL(request.url);
  const m = url.pathname.match(/^\/orders\/([^/]+)\/invoice$/);
  if (!m) return notFound();
  const orderId = m[1];

  const order = await env.DB.prepare(
    `SELECT * FROM orders WHERE id = ? OR order_number = ?`,
  ).bind(orderId, orderId).first<any>();
  if (!order) return notFound();

  // Owner-or-admin check.
  if (order.user_id !== userId) {
    const role = await env.DB.prepare('SELECT role FROM user_roles WHERE user_id = ?')
      .bind(userId).first<{ role: string }>();
    if (role?.role !== 'admin') return forbidden();
  }

  const items = await env.DB.prepare(
    `SELECT product_name, quantity, unit_price, line_total
     FROM order_items WHERE order_id = ?`,
  ).bind(order.id).all<any>();

  return new Response(renderInvoice(order, items.results ?? []), { headers: HTML_HEADERS });
}
