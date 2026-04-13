import { Env } from './index';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export async function handleNewsletter(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
  }

  let email: string;
  try {
    const body = await request.json() as { email?: string };
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400, headers: cors });
  }

  // Check if already subscribed
  const existing = await env.DB.prepare(
    'SELECT id FROM newsletter_subscriptions WHERE email = ?'
  ).bind(email).first<{ id: string }>();

  if (existing) {
    // Already subscribed — return success silently (no email leak)
    return new Response(JSON.stringify({ success: true }), { headers: cors });
  }

  // Insert subscription
  await env.DB.prepare(
    'INSERT INTO newsletter_subscriptions (email, subscribed_at, status) VALUES (?, ?, ?)'
  ).bind(email, new Date().toISOString(), 'active').run();

  // Send confirmation email via Resend
  if (env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Healios <hello@thehealios.com>',
          to: [email],
          subject: 'Welcome to The Healios — You\'re in!',
          html: `
            <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
              <img src="https://thehealios.com/healios-logo.png" alt="The Healios" style="height: 40px; margin-bottom: 32px;" />
              <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 16px;">You're on the list.</h1>
              <p style="font-size: 14px; font-weight: 300; line-height: 1.6; color: #666; margin-bottom: 24px;">
                Thank you for subscribing to The Healios newsletter. You'll be the first to know about new products, exclusive offers, and wellness tips.
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 48px; border-top: 1px solid #eee; padding-top: 16px;">
                You're receiving this email because you subscribed at thehealios.com.<br/>
                To unsubscribe, reply to this email with "unsubscribe" in the subject line.
              </p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error('Newsletter confirmation email failed:', err);
    }
  }

  return new Response(JSON.stringify({ success: true }), { headers: cors });
}
