# Stripe Setup Guide — The Healios

Complete guide for connecting Stripe to the Healios Cloudflare Worker.

---

## Overview

Payments flow like this:

```
Browser → Cloudflare Worker (/checkout-session)
        → Stripe Checkout (hosted page, user pays)
        → Stripe Webhook → Cloudflare Worker (/stripe-webhook)
        → D1 Database (order created, stock decremented)
        → Resend (confirmation email sent)
```

---

## Step 1 — Get Your Stripe Keys

1. Log in to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Top-left toggle: switch between **Test mode** (for dev) and **Live mode** (for production)
3. Go to **Developers → API keys**
4. Copy your **Secret key** (`sk_test_...` or `sk_live_...`)

> Never use the Publishable key in the worker — only the Secret key.

---

## Step 2 — Set Secrets in the Cloudflare Worker

Run these commands from the `worker-api/` directory:

```bash
cd worker-api

# Stripe secret key
npx wrangler secret put STRIPE_KEY
# Paste: sk_live_... (or sk_test_... for testing)

# JWT secret for session auth (generate a random 64-char string)
npx wrangler secret put JWT_SECRET
# Paste any long random string, e.g.: openssl rand -hex 32

# Redeploy the worker to pick up the new secrets
npx wrangler deploy
```

> Secrets are stored encrypted in Cloudflare — never committed to the repo.

---

## Step 3 — Set Up the Stripe Webhook

After deploying the worker:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL**: `https://healios-api.ss-f01.workers.dev/stripe-webhook`
3. Select events to listen for:
   - `checkout.session.completed` ← **critical — creates the order**
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `charge.refunded`
   - `payment_intent.payment_failed`
4. Click **Add endpoint**
5. On the webhook detail page, click **Reveal** under **Signing secret** — copy the `whsec_...` value
6. Set it in the worker:

```bash
cd worker-api
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_...

npx wrangler deploy
```

---

## Step 4 — Order Confirmation Emails (Resend)

Confirmation emails are sent via [Resend](https://resend.com) after successful payment.

1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your domain (`thehealios.com`) under **Domains**
3. Go to **API Keys → Create API Key** — copy the `re_...` key
4. Set it in the worker:

```bash
cd worker-api
npx wrangler secret put RESEND_API_KEY
# Paste: re_...

npx wrangler deploy
```

Emails are sent from `orders@thehealios.com` — make sure this address is verified in Resend.

---

## Step 5 — Enable Currencies on Stripe

The site charges in the user's detected currency (ZAR, GBP, EUR, USD, CAD, AUD).

1. Stripe Dashboard → **Settings → Business settings → Bank accounts & scheduling**
2. Check that your payout currency matches your bank account
3. For ZAR: Stripe supports ZAR payments if your account is registered in South Africa or has a ZAR bank account. If you only have a GBP account, ZAR payouts may not be available — contact Stripe support to confirm.
4. To check which currencies are presentable: **Settings → Payments → Currencies**

> If ZAR is not available on your Stripe account, update `worker-api/src/checkout.ts` to default to `GBP` for all transactions regardless of the user's currency. Display prices will still show in local currency; Stripe will just charge in GBP.

---

## Step 6 — Add Discount Codes

Discount codes are stored in your D1 database. Add them via the Cloudflare dashboard or wrangler:

**Via Cloudflare Dashboard:**
1. Workers & Pages → healios-api → D1 → healios-db → Console

```sql
INSERT INTO discount_codes (
  id, code, discount_type, discount_value,
  is_active, min_order_amount, max_uses, current_uses, valid_from
) VALUES (
  lower(hex(randomblob(16))),
  'WELCOME10',      -- the code customers enter
  'percentage',     -- 'percentage' or 'fixed'
  10,               -- 10% off (or £10 off for 'fixed')
  1,                -- is_active = true
  0,                -- min order amount (0 = no minimum)
  null,             -- max_uses (null = unlimited)
  0,                -- current_uses
  date('now')
);
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `code` | TEXT | What the customer types (auto-uppercased) |
| `discount_type` | TEXT | `'percentage'` or `'fixed'` |
| `discount_value` | NUMBER | Percentage (10 = 10%) or fixed amount in GBP |
| `is_active` | INTEGER | 1 = active, 0 = disabled |
| `min_order_amount` | NUMBER | Minimum basket value in GBP |
| `max_uses` | INTEGER | NULL = unlimited |
| `valid_from` | TEXT | ISO date when code becomes active |
| `valid_until` | TEXT | ISO date when code expires (NULL = no expiry) |

---

## Step 7 — Test the Payment Flow

**Using Stripe test mode:**

1. Set `STRIPE_KEY` to your `sk_test_...` key (see Step 2)
2. Use Stripe test card: `4242 4242 4242 4242` — any expiry, any CVC
3. Add an item to cart → proceed to checkout → complete payment
4. Check D1 Console: a new row should appear in the `orders` table
5. Check Stripe Dashboard → **Payments** — the test payment should show up
6. Check your email for the confirmation (if Resend is configured)

**Test cards:**
| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | 3D Secure required |

**Test the webhook locally:**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:8787/stripe-webhook
# In another terminal: make a test purchase
```

---

## Environment Variables Summary

| Variable | Where set | Description |
|----------|-----------|-------------|
| `VITE_CF_WORKER_URL` | `.env` / Cloudflare Pages env vars | Worker API base URL |
| `STRIPE_KEY` | `wrangler secret put` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `wrangler secret put` | Stripe webhook signing secret |
| `RESEND_API_KEY` | `wrangler secret put` | Resend email API key |
| `JWT_SECRET` | `wrangler secret put` | Session token signing secret |
| `LOVABLE_API_KEY` | `wrangler secret put` | AI chat (wellness chatbot) |

---

## Switching from Test to Live

1. Get live keys from Stripe Dashboard (toggle **Live mode** top-left)
2. Re-run: `npx wrangler secret put STRIPE_KEY` with the `sk_live_...` key
3. Create a new webhook endpoint for the live Stripe environment (separate from test)
4. Re-run: `npx wrangler secret put STRIPE_WEBHOOK_SECRET` with the live `whsec_...`
5. Deploy: `npx wrangler deploy`

---

*Last updated: 2026-03-17*
