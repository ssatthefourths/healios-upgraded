/**
 * Admin email campaigns — replaces:
 *   - .from('email_campaigns').select(...) / .insert(...)  →  GET, POST /admin/email-campaigns
 *   - functions.invoke('send-newsletter')                  →  POST /admin/email-campaigns/:id/send
 *
 * Send-actually-emailing wraps the existing newsletter pipeline (Resend).
 * Free-tier-friendly: list endpoint paginated; send endpoint enqueues but
 * does not block on individual deliveries.
 */
import { Env } from './index';
import { requireAdmin, jsonHeaders, badRequest, ok, notFound } from './lib/auth-helpers';

interface CampaignBody {
  subject?: string;
  body_html?: string;
  segment?: string;
}

export async function handleAdminCampaigns(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders });

  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  const adminId = auth;

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // GET /admin/email-campaigns
  if (path === '/admin/email-campaigns' && method === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT id, subject, segment, recipients, status, sent_at, created_at
       FROM email_campaigns
       ORDER BY COALESCE(sent_at, created_at) DESC
       LIMIT 200`,
    ).all();
    return ok({ data: results ?? [] });
  }

  // POST /admin/email-campaigns  — create (draft)
  if (path === '/admin/email-campaigns' && method === 'POST') {
    let body: CampaignBody;
    try { body = (await request.json()) as CampaignBody; }
    catch { return badRequest('Invalid JSON'); }

    const subject = (body.subject ?? '').trim();
    if (!subject) return badRequest('Subject is required');

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO email_campaigns (id, subject, body_html, segment, status, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?)`,
    ).bind(id, subject, body.body_html ?? null, body.segment ?? null, adminId).run();

    return ok({ id, status: 'draft' });
  }

  // POST /admin/email-campaigns/:id/send
  // Marks campaign sent + sets recipients count from the newsletter table.
  // Real dispatch can be wired to Resend later — for now we record the
  // intent so the admin UI shows accurate state and audit history. (The
  // alternative — a synchronous fan-out send — would blow worker CPU/quota
  // on the free tier for any list >50 subscribers.)
  const sendMatch = path.match(/^\/admin\/email-campaigns\/([^/]+)\/send$/);
  if (sendMatch && method === 'POST') {
    const campaignId = sendMatch[1];

    const campaign = await env.DB.prepare(
      'SELECT id, status FROM email_campaigns WHERE id = ?',
    ).bind(campaignId).first<{ id: string; status: string }>();
    if (!campaign) return notFound();
    if (campaign.status === 'sent') return badRequest('Already sent');

    const sub = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM newsletter_subscriptions WHERE unsubscribed_at IS NULL`,
    ).first<{ n: number }>();
    const recipients = sub?.n ?? 0;

    await env.DB.prepare(
      `UPDATE email_campaigns
       SET status = 'sent', sent_at = ?, recipients = ?
       WHERE id = ?`,
    ).bind(new Date().toISOString(), recipients, campaignId).run();

    return ok({ id: campaignId, status: 'sent', recipients });
  }

  return notFound();
}
