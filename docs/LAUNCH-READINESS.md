# Healios — launch-readiness checklist

**Last reviewed:** 2026-04-24 (Phase 9 of the v2 CSV triage).
**Owner:** Servaas (eng), Monique (content + client handoff).

This is the ops-side checklist that needs to be green before the site can be considered launch-ready for paying UK/SA customers. Everything here is **manual** — keys to dashboards, credentials, and client decisions that I (Claude) cannot action directly.

## Status legend

- ✅ Confirmed green
- ⚠️ Needs verification or action
- ❌ Blocker — must fix before launch
- ⏳ Waiting on Monique or a client

## Worker secrets (Cloudflare)

Run `wrangler secret list` in `worker-api/` to confirm at any time.

| Secret | Status | Purpose |
|---|---|---|
| `JWT_SECRET` | ✅ set | Session token signing |
| `STRIPE_KEY` | ✅ set | Stripe secret key (sk_live_… or sk_test_…) |
| `STRIPE_WEBHOOK_SECRET` | ✅ set | Webhook signature verification |
| `RESEND_API_KEY` | ✅ set | Transactional email sends via Resend |
| `IP_HASH_SECRET` | ✅ set (rotate yearly) | IP hashing per `docs/SECURITY-IP.md` |

**Smoke test:** `curl -X POST https://healios-api.ss-f01.workers.dev/stripe-webhook -H "Stripe-Signature: invalid" -d '{}'` → expect `400 malformed-signature-header`. Currently ✅ passing.

## Cloudflare Pages environment variables

Set via **Cloudflare Dashboard → Workers & Pages → healios-upgraded → Settings → Environment variables → Production**. After setting, trigger a new Pages deploy (push any commit, or use the Retry deploy button).

| Variable | Status | Purpose |
|---|---|---|
| `VITE_CF_WORKER_URL` | ✅ set (`https://healios-api.ss-f01.workers.dev`) | Frontend → Worker API base URL |
| `VITE_GA_ID` | ✅ set (3 gtag matches in live HTML) | Google Analytics 4 measurement ID |
| `VITE_META_PIXEL_ID` | ❌ **NOT set** — zero fb-pixel code in live HTML | Meta Pixel tracking. Needs to be set to unblock Monique's paid-Meta campaigns. |
| `VITE_CLARITY_ID` | ❌ **NOT set** — zero clarity.ms code in live HTML | Microsoft Clarity session replay. Fallback hardcoded in `src/lib/clarity.ts` may be present but not firing. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ⚠️ Verify | Stripe Elements rendering. If missing, checkout card fields won't render. |

**Action:** Servaas to log into Cloudflare Dashboard and set the missing three. Estimated: 5 minutes.

## Stripe (dashboard actions — Monique or whoever has Stripe owner access)

| Item | Status | Action |
|---|---|---|
| Business display name on checkout | ⚠️ Not verified — CLAUDE.md flagged as placeholder | Log into https://dashboard.stripe.com → Settings → Business settings → Account details → Public details. Confirm it reads "The Healios" not a placeholder. |
| Webhook endpoint registered | ⚠️ Verify | Dashboard → Developers → Webhooks. Endpoint should be `https://healios-api.ss-f01.workers.dev/stripe-webhook`. If missing, add it, listen for `checkout.session.completed` + `payment_intent.succeeded` + `payment_intent.payment_failed`. Copy the signing secret → `wrangler secret put STRIPE_WEBHOOK_SECRET`. |
| ZAR currency enabled | ⚠️ Verify | Dashboard → Settings → Payments → Payment methods. ZAR must be in the list of accepted presentment currencies. If not, SA customers will fail at checkout. |
| Live mode vs test mode | ⚠️ Verify | Dashboard top-right toggle. Confirm `STRIPE_KEY` starts with `sk_live_` (live) not `sk_test_` (test) when launch-ready. |
| Fraud detection rules | Nice-to-have | Dashboard → Radar → Rules. Review default rules for appropriateness to SA/UK context. |

## Cloudflare — DNS + Email Routing (Servaas)

| Item | Status | Action |
|---|---|---|
| `hello@thehealios.com` forwarding | ❌ Flagged in bug report CLIENT ACTION 1 | Dashboard → `thehealios.com` → Email → Email Routing → add rule: `hello@thehealios.com` → `dn@thefourths.com`. Verify destination. |
| DMARC / DKIM / SPF | ⚠️ Verify | Dashboard → DNS → confirm Resend's SPF include + DKIM CNAME records are present. If Resend sends are landing in spam, this is the first thing to check. |
| Page Rules / Cache | Nice-to-have | No action required for launch. |

## Content + client sign-off (Monique)

These are the open questions accumulated across this session. Hold launch until Monique has answered.

| # | Question | Context |
|---|---|---|
| M1 | Should Magnesium be renamed to "Magnesium Complex"? | `healios_tasks_v2.csv` ticket #11 says yes; `products.json` says "Magnesium Gummies". Phase 2 kept the JSON name. |
| M2 | Verify Magnesium is vegan | `products.json` said "verification pending"; I flipped `is_vegan=0` as the safe default. |
| M3 | Approve capsule-copy rewrites on Ashwagandha + Magnesium | Phase 2 replaced "delicious gummy form" → "easy-to-swallow capsules" and "tasty magnesium gummies" → "premium magnesium capsules". Placeholder wording pending her editorial touch. |
| M4 | Confirm KSM-66 text-badge fallback is acceptable on live | Phase 4 ships a text chip (`<Award> KSM-66® Ashwagandha`) until her transparent PNG/SVG lands. |
| M5 | Supply final KSM-66 PNG or SVG | When she drops it, upload to R2 and run `UPDATE certifications SET asset_url = '<r2-url>' WHERE key = 'ksm-66'`. |
| M6 | Bundle contents + pricing + discount % for the 4 stacks | Phase 5 set `is_bundle=1` on the 4 bundles but left `is_published=0` until she signs off. |
| M7 | Social profile URLs for footer | Facebook / Instagram / TikTok / Google Business / Trustpilot URLs. Enter at `/admin/site-config`. |
| M8 | Lifestyle category images | Bug report CLIENT ACTION 3 — 5 images for the category cards on the home page. |
| M9 | Product image spot-check | Bug report CLIENT ACTION 4 — walk every live product PDP, confirm image matches product. |

## Engineering-side nice-to-haves (not launch blockers)

- Lighthouse audit on home + PDP + checkout — target Perf 90+, A11y 100, SEO 100 per CLAUDE.md.
- Bundle size review — `dist/index-*.js` is ~1MB minified. Code-split opportunities documented in Vite warnings.
- Security headers CSP — deferred in commit `c81c960` (needs per-page tuning against Stripe / fonts / analytics).
- Admin UI smoke-test as a real admin user — confirm new `/admin/dsr` and `/admin/emails` pages render and work end-to-end.

## End-to-end launch smoke test (run before flipping to public)

1. Open a private-browsing tab, visit `https://thehealios.com/`.
2. Cookie banner appears. Accept Analytics only. Confirm `healios-consent` cookie exists in DevTools.
3. Navigate: Home → any Category → any PDP. PDP shows free-from icons if any apply; Ashwagandha shows the KSM-66 badge.
4. Add to cart → cart popover appears under the cart icon. Add another product, toast doesn't duplicate.
5. Go to checkout. Country field is blank by default. Fill in with SA address. Enter Stripe test card `4242 4242 4242 4242`, any future date, any CVC.
6. Place order. Redirect to success page. Order number is `HLS-YYYYMMDD-NNNN`.
7. Check inbox. Order-confirmation email should be Monique's React Email design (bone & charcoal palette, Playfair serif, "Wellness, *Elevated*." styling). **Not** the old plain-HTML template.
8. Visit `/privacy/request`. Submit an access request with a real email. Confirmation email arrives. Click verify. Admin sees the request at `/admin/dsr` as "Verified — Action Needed".
9. Return to home. Open DevTools → Network. Confirm GA4 and Meta Pixel scripts load (both env vars set).

If every step passes, the site is launch-ready on the engineering side. Remaining blockers are the M1-M9 client items above.

## Rollback plan

If a post-launch issue emerges:

1. **Frontend regression** — revert the offending commit on `main`, push. Cloudflare Pages auto-deploys within ~60 seconds.
2. **Worker regression** — `wrangler deploy` the prior Worker version. Every deploy has a Current Version ID captured in the deploy output; keep the last-3 in a scratchpad.
3. **D1 data corruption** — Cloudflare D1 has daily backups. Dashboard → D1 → healios-db → Backups.
4. **Stripe webhook misfires** — deactivate the endpoint in Stripe Dashboard → Developers → Webhooks; orders fall back to manual processing until the Worker is fixed. Critical orders visible in Stripe dashboard regardless.
5. **Email outage** — Resend dashboard shows recent sends; can re-send manually from there in an emergency.
