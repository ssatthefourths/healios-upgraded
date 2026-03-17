# Environment Variables Setup — The Healios

Complete reference for every environment variable and secret the platform needs.
Follow this top to bottom when setting up a fresh deployment.

**Live URLs:**
- Frontend: `https://thehealios.com` (Cloudflare Pages → project: `healios-upgraded`)
- Worker API: `https://healios-api.ss-f01.workers.dev` (Cloudflare Workers → worker: `healios-api`)

---

## Status Checklist

| Variable | Location | Status |
|----------|----------|--------|
| `JWT_SECRET` | Worker secret | ✅ Set |
| `STRIPE_KEY` | Worker secret | ⚠️ **Needs setting** |
| `STRIPE_WEBHOOK_SECRET` | Worker secret | ⚠️ **Needs setting** |
| `RESEND_API_KEY` | Worker secret | ⚠️ **Needs setting** |
| `LOVABLE_API_KEY` | Worker secret | ⚠️ Needs setting (AI chatbot) |
| `CLOUDFLARE_API_TOKEN` | GitHub secret | ⚠️ **Needs setting** (auto-deploy) |
| `VITE_CF_WORKER_URL` | Pages env var | ✅ Set |
| `VITE_CLARITY_ID` | Pages env var | ✅ Set |

---

## Part 1 — Worker Secrets

Worker secrets are set via the `wrangler` CLI from the `worker-api/` directory.
They are encrypted at rest and never visible after being set — not even to you.

```bash
cd worker-api
```

---

### 1. JWT_SECRET ✅ Already set
Used to sign and verify user session tokens.
Generated automatically — no action needed.

---

### 2. STRIPE_KEY ⚠️ Action required

Used to create Stripe Checkout sessions and charge customers.

**Where to get it:**
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** first (toggle top-left) — use test mode until you're ready to go live
3. Go to **Developers → API keys**
4. Copy the **Secret key** — starts with `sk_test_...` (test) or `sk_live_...` (live)

**Set it:**
```bash
cd worker-api
npx wrangler secret put STRIPE_KEY
# Paste your sk_test_... or sk_live_... key and press Enter
```

> ⚠️ Use `sk_test_...` for development. Switch to `sk_live_...` only when going live.
> Never use the Publishable key here — only the Secret key.

---

### 3. STRIPE_WEBHOOK_SECRET ⚠️ Action required

Used to verify that webhook events actually come from Stripe (security — prevents fake orders).
You must create the webhook endpoint in Stripe first to get this secret.

**Where to get it:**
1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://healios-api.ss-f01.workers.dev/stripe-webhook`
3. **Select events** (click "Select events" and add all of these):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `charge.refunded`
   - `payment_intent.payment_failed`
4. Click **Add endpoint**
5. On the webhook detail page → click **Reveal** under **Signing secret**
6. Copy the value — starts with `whsec_...`

**Set it:**
```bash
cd worker-api
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your whsec_... value and press Enter
```

> ⚠️ Test mode and Live mode have **separate** webhook endpoints and signing secrets.
> You will need to repeat this step when switching to live mode.

---

### 4. RESEND_API_KEY ⚠️ Action required

Used to send order confirmation emails to customers after successful payment.

**Where to get it:**
1. Go to [resend.com](https://resend.com) — create a free account if you don't have one
2. In the Resend dashboard → **Domains** → verify `thehealios.com` is listed and verified
   - The `resend._domainkey` DNS record is already in your Cloudflare DNS ✅
   - Status should show **Verified** — if not, click **Verify** in Resend
3. Go to **API Keys → Create API Key**
4. Name it `healios-production`, give it **Full access**
5. Copy the key — starts with `re_...`

**Set it:**
```bash
cd worker-api
npx wrangler secret put RESEND_API_KEY
# Paste your re_... key and press Enter
```

---

### 5. LOVABLE_API_KEY (optional — AI chatbot)

Used by the wellness chatbot on the site. The chatbot will silently fail if this is not set — it won't break anything else.

**Where to get it:**
- This was the API key from the original Lovable platform
- If you have a key: `npx wrangler secret put LOVABLE_API_KEY`
- If not: skip for now — the chatbot just won't work

---

### Verify all worker secrets are set

```bash
cd worker-api
npx wrangler secret list
```

Expected output when complete:
```
JWT_SECRET          secret_text
STRIPE_KEY          secret_text
STRIPE_WEBHOOK_SECRET  secret_text
RESEND_API_KEY      secret_text
```

---

### Redeploy the worker after setting secrets

After setting all secrets, redeploy so the worker picks them up:

```bash
cd worker-api
npx wrangler deploy
```

---

## Part 2 — Cloudflare Pages Environment Variables

These are already set. For reference:

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_CF_WORKER_URL` | `https://healios-api.ss-f01.workers.dev` | Worker API URL used by the frontend |
| `VITE_CLARITY_ID` | `vsma9av1yg` | Microsoft Clarity analytics |

**To view or change them:**
Cloudflare Dashboard → Workers & Pages → `healios-upgraded` → Settings → Environment variables

**To set via CLI:**
```bash
echo "your-value" | npx wrangler pages secret put VARIABLE_NAME --project-name=healios-upgraded
```

> ⚠️ After changing Pages env vars, trigger a new deployment so they take effect:
> Either push a commit to GitHub (triggers auto-deploy) or manually deploy:
> `npx wrangler pages deploy dist --project-name=healios-upgraded --commit-dirty=true`

---

## Part 3 — GitHub Secret (Auto-Deploy)

This allows GitHub Actions to deploy to Cloudflare automatically on every push to `main`.

**Where to get it:**
1. Cloudflare Dashboard → **My Profile** (top right avatar) → **API Tokens**
2. Click **Create Token**
3. Use the **"Edit Cloudflare Workers"** template
4. Under **Account Resources** — select your account (`Ss@thefourths.com's Account`)
5. Under **Zone Resources** — select `thehealios.com`
6. Click **Continue to summary** → **Create Token**
7. Copy the token — you only see it once

**Where to set it:**
1. Go to `github.com/ssatthefourths/healios-upgraded`
2. **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: paste the token
6. Click **Add secret**

**Test it:** Push any commit to `main` — the Actions tab on GitHub should show the deploy workflow running.

---

## Part 4 — Switching to Live (Production) Stripe

When you're ready to take real payments:

1. In Stripe Dashboard, toggle to **Live mode** (top-left)
2. Get your **live Secret key** (`sk_live_...`) from Developers → API keys
3. Create a **new webhook endpoint** in live mode (same URL, same events as test)
4. Get the live **Signing secret** (`whsec_...`)

Then update the worker:
```bash
cd worker-api
npx wrangler secret put STRIPE_KEY         # paste sk_live_...
npx wrangler secret put STRIPE_WEBHOOK_SECRET  # paste whsec_... (live webhook)
npx wrangler deploy
```

---

## Local Development

For local development the frontend uses the **production worker** by default (no setup needed).
If you want to run the worker locally too:

```bash
# Terminal 1 — worker
cd worker-api
npx wrangler dev
# runs at http://localhost:8787

# Terminal 2 — frontend
# create .env in project root (gitignored):
echo "VITE_CF_WORKER_URL=http://localhost:8787" > .env
npm run dev
# runs at http://localhost:5173
```

Note: The local worker won't have your secrets — you'll need to add them to a `worker-api/.dev.vars` file (gitignored):
```
JWT_SECRET=any-local-test-value
STRIPE_KEY=sk_test_...
RESEND_API_KEY=re_...
```

---

*Last updated: 2026-03-17*
