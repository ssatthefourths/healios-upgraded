# Healios — launch-readiness checklist

**Last reviewed:** 2026-04-25 (production audit pass after v3 quick-wins shipped).
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

---

## 2026-04-25 production audit — verified-from-the-outside

A live probe of `https://thehealios.com/` and `https://healios-api.ss-f01.workers.dev/` to confirm what's actually deployed and rule out drift. None of these tests need dashboard access.

### ✅ Verified working in production

- Homepage `/` returns HTTP 200, 3.5KB SPA shell. SEO meta tags present (Open Graph, Twitter card, theme-color, manifest).
- Sitemap.xml served, valid, contains 18 product URLs.
- Robots.txt served with Cloudflare Managed Content + admin-path blocking.
- Worker `/products` returns full live product catalogue.
- Worker `/products/magnesium-gummies` returns the synced Phase 2 data: `is_vegan=0` ✅, capsule-correct description ✅, ingredients with active line first ✅, `product_cautions` populated ✅, `contains_allergens` populated ✅. Same shape verified for the four other live products.
- Worker `/public/product/ashwagandha-gummies/certifications` returns the seeded KSM-66 row. Other products return `[]`.
- Worker `/public/product/<id>/certifications` cache header `s-maxage=3600` confirmed.
- Worker `/dsr/request` responds with proper validation errors (`invalid_email`, `invalid_request_type`).
- Worker `/stripe-webhook` responds 400 + `Missing stripe-signature` on signatureless POST (signature verification is alive).
- All 14 new product images from Monique are served at correct paths with correct file sizes (`/products/<slug>.png`).
- Email logo URL `/healios-logo.png` returns 200 (used by Phase 8a email templates).
- Worker security headers applied per-response (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security on Worker only).
- D1 schema audit confirms: `orders.currency` column ✅, `addresses.street_address_2` ✅, `orders.shipping_address_2` ✅, `certifications` + `product_certifications` tables ✅, `dsr_requests` table ✅. All migrations 015–018 applied.
- Live D1 product-state distribution: 5–6 live products (see new finding below), 10 coming-soon, 5 unpublished, 4 bundles flagged but unpublished — matches expected state.
- All 4 historical orders have `currency` populated (defaulted to GBP via migration 018).

### ❌ Verified blockers / drift

- **`VITE_META_PIXEL_ID` still missing** on Cloudflare Pages — live HTML contains zero `fbq` / `connect.facebook` references. Meta Pixel not firing.
- **`VITE_CLARITY_ID` still missing** on Cloudflare Pages — zero `clarity.ms` references in live HTML.
- **`collagen-powder` is live but not in Monique's `products.json` spec.** The product row exists in D1 with `is_published=1, is_coming_soon=0`, image points at `/products/halo-glow-collagen.png` (re-using the Halo Glow image — a different SKU). Either a stale row from a prior catalogue, or a real launch product Monique forgot to spec. Customer-confusing as-is. **Flag for Monique:** confirm whether to (a) add it to products.json properly, (b) flip to coming-soon, or (c) unpublish entirely. Until decided this is a launch blocker because clicking it shows a Halo Glow image with Collagen Powder copy.
- **Sitemap.xml exposes 18 product URLs**, but only 5–6 are actually live. Coming-soon and unpublished products appear in the sitemap. Search engines may index them and customers landing from search results may hit a dead-end "Coming Soon" page. Worth checking if `is_coming_soon=1` rows are getting `is_published=1` treatment by the sitemap generator.
- **HTML response (Cloudflare Pages) doesn't carry our security headers.** The `withSecurityHeaders` middleware in `worker-api/src/index.ts` only protects Worker API responses. Static HTML served by Pages has minimal headers. To add HSTS/X-Frame-Options on Pages HTML, configure Cloudflare Pages → Settings → Headers (or use `_headers` file in `public/`). Not a launch-blocker (HTTPS still enforced) but worth doing.
- **Cookie consent banner can't be verified via curl** because the SPA renders it client-side. Spot-check needed in a real private-browsing tab.

### ⚠️ Couldn't verify from this environment

- **Lighthouse** — no headless Chrome available locally. Run via Cloudflare Pages dashboard "Web Analytics" or `npx lighthouse https://thehealios.com/` from a Mac/Linux box. CLAUDE.md targets Performance 90+, Accessibility 100, SEO 100.
- **Cookie banner UX flow** — needs a real browser session to test the accept/reject paths.
- **Stripe end-to-end test order** — needs a real card-form interaction. Recommended: place a £1 test order with `4242 4242 4242 4242` and verify the order confirmation page + email + admin all show the correct prices in correct currencies.
- **Live Meta / Clarity firing** — even if env vars are set later, only a real browser visit confirms scripts execute and consent gates them correctly.

---

## Rollback plan

If a post-launch issue emerges:

1. **Frontend regression** — revert the offending commit on `main`, push. Cloudflare Pages auto-deploys within ~60 seconds.
2. **Worker regression** — `wrangler deploy` the prior Worker version. Every deploy has a Current Version ID captured in the deploy output; keep the last-3 in a scratchpad.
3. **D1 data corruption** — Cloudflare D1 has daily backups. Dashboard → D1 → healios-db → Backups.
4. **Stripe webhook misfires** — deactivate the endpoint in Stripe Dashboard → Developers → Webhooks; orders fall back to manual processing until the Worker is fixed. Critical orders visible in Stripe dashboard regardless.
5. **Email outage** — Resend dashboard shows recent sends; can re-send manually from there in an emergency.
