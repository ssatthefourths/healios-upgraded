# Cloudflare Deployment Guide — The Healios

Complete guide for deploying the Healios platform to Cloudflare Pages (frontend) and Cloudflare Workers (API).

---

## Architecture

```
GitHub (main branch)
  │
  ├─ Cloudflare Pages  ← auto-deploys on every push to main
  │   URL: https://healios-upgraded.pages.dev
  │   Build: npm run build → dist/
  │
  └─ Cloudflare Worker ← deploy manually: cd worker-api && npx wrangler deploy
      URL: https://healios-api.ss-f01.workers.dev
      DB:  D1 (healios-db)
```

---

## Part 1 — Cloudflare Pages (Frontend)

### Does it auto-deploy?
**Yes.** Once connected, every push to the `main` branch triggers a new build automatically. You can see the build status and live URL in:

> Cloudflare Dashboard → Workers & Pages → `healios-upgraded`

### First-time setup (Pages)

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select the `healios-upgraded` repository
4. Configure build settings:
   - **Production branch**: `main`
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Add environment variables (**Settings → Environment variables**, for both Production and Preview):
   | Variable | Value |
   |----------|-------|
   | `VITE_CF_WORKER_URL` | `https://healios-api.ss-f01.workers.dev` |
   | `VITE_CLARITY_ID` | `vsma9av1yg` |
6. Click **Save and Deploy**

### Where is the published site?
Cloudflare Dashboard → **Workers & Pages** → click `healios-upgraded` → the URL appears at the top.

Default URL: `https://healios-upgraded.pages.dev`

To add a custom domain (thehealios.com):
1. Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `thehealios.com` and follow the DNS instructions

---

## Part 2 — Cloudflare Worker (API)

The worker does **not** auto-deploy from GitHub — deploy manually:

```bash
cd worker-api
npm install       # first time only
npx wrangler deploy
```

### First-time worker setup

**1. Authenticate wrangler:**
```bash
npx wrangler login
```

**2. Create the D1 database** (if not already created):
```bash
npx wrangler d1 create healios-db
# Copy the database_id into wrangler.toml
```

**3. Set required secrets:**
```bash
npx wrangler secret put JWT_SECRET          # any long random string
npx wrangler secret put STRIPE_KEY          # sk_live_... or sk_test_...
npx wrangler secret put STRIPE_WEBHOOK_SECRET  # whsec_... from Stripe dashboard
npx wrangler secret put RESEND_API_KEY      # re_... from resend.com
npx wrangler secret put LOVABLE_API_KEY     # AI chatbot key
```

**4. Deploy:**
```bash
npx wrangler deploy
```

See `docs/stripe-setup.md` for the full Stripe webhook configuration.

---

## Local Development

```bash
# Clone and run the frontend
git clone https://github.com/ssatthefourths/healios-upgraded.git
cd healios-upgraded
npm install
npm run dev
# → http://localhost:5173
# Talks to the production worker by default — no extra setup needed
```

**To run the worker locally (optional):**
```bash
cd worker-api
npm install
npx wrangler dev
# → http://localhost:8787
```
Then create a `.env` file in the project root:
```
VITE_CF_WORKER_URL=http://localhost:8787
```

---

## Troubleshooting

### "Not Found" on page refresh
The `public/_redirects` file handles this — it's already committed:
```
/* /index.html 200
```
If you're still getting 404s, check that the file is in `dist/` after build.

### Build failure on Cloudflare Pages
- Check that `NODE_VERSION=20` is set as a Pages environment variable if you hit node version errors
- Review the build log: Pages project → **Deployments** → click the failed deployment

### Worker not updating
The worker is NOT auto-deployed from GitHub. After any change to `worker-api/`, run:
```bash
cd worker-api && npx wrangler deploy
```

### Secrets missing
Check which secrets are set (without revealing values):
```bash
cd worker-api && npx wrangler secret list
```

---

*Last updated: 2026-03-17*
