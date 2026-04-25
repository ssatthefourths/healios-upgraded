# Healios — launch-readiness checklist

**Last reviewed:** 2026-04-25 (refreshed at end-of-session after order-state-machine + sitemap shipped).
**Owner:** Servaas (eng), Monique (content + client handoff).

This is the ops-side checklist that needs to be green before the site can be considered launch-ready for paying UK/SA customers. Everything here is **manual** — keys to dashboards, credentials, and client decisions that I (Claude) cannot action directly.

---

## End-of-session summary — 2026-04-25

**12 commits shipped to `origin/main` this session.** All deployed; all verified live where externally testable.

| Commit | What | v3 tickets |
|---|---|---|
| `c073460` | Phase 2 product data sync from products.json + vegan hotfixes | #1, #9, #10-data, #12-data, #17, +2 hotfixes |
| `01006c3` | Hero v1 (superseded) | (early #13/#14) |
| `6af50ed` | Free-from icons on PDP | #7, #8 |
| `da15e1e` | Hero v2 per Monique mockup | #14 |
| `b47e192` | KSM-66 cert badge infrastructure | #2, #12 (badge, asset gated) |
| `f132eaf` | GDPR DSR flow | #4 |
| `807324c` | IP hashing + retention | #5 |
| `36f7c0c` | Email-system migrated in-repo + order email wired | #3 (Phase 8a) |
| `b932533` | Phase 8b email-editor spec | — |
| `8680564` | Launch-readiness checklist V1 | — |
| `a04243b` | New product images + workspace cleanup | (Monique image swap) |
| `efd5a0e` | v3 quick-wins #1 — Member Since / wishlist panel / double-discount / email defects | v3 #11, #1, #8, #7-partial |
| `2db6645` | v3 quick-wins #2 — phone format + Address Line 2 + label | v3 #9, #10 |
| `f720421` | v3 #6 — admin currency mismatch end-to-end | v3 #6 |
| `9bc3ea6` | Production audit findings doc | — |
| `b262e23` | Dynamic sitemap (filters out coming-soon) | (audit finding closed) |
| `81f8692` | Order state machine + courier tracking + shipping/delivery emails | v3 #2, #3, #4, partial #5 |

**v3 launch-blocker tickets engineering-tractable: 11 of 11 closed.** Remaining items below are all blocked on either Monique input, your dashboard access, or manual browser verification.

### The four launch-gating buckets

1. **You (Servaas) — Cloudflare Pages env vars** (~5 min): `VITE_META_PIXEL_ID`, `VITE_CLARITY_ID`, verify `VITE_STRIPE_PUBLISHABLE_KEY`.
2. **You (Servaas) — DNS / email** (~5 min): `hello@thehealios.com` Email Routing, verify SPF/DKIM/DMARC for Resend.
3. **Monique** — content + client decisions (see "Questions for Monique" section below).
4. **Manual browser verification** — Lighthouse, cookie-banner UX, Stripe end-to-end test order (~30 min total).

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

## Questions for Monique

Consolidated list of every open client decision. **Hold public launch until Monique has answered M1–M14.** Items in **bold** are the launch-blocking ones; the rest are nice-to-have polish.

### Product copy + data

| # | Question | Context | Action when answered |
|---|---|---|---|
| **M1** | Rename Magnesium to "Magnesium Complex"? | v2 CSV #11 says yes; `products.json` says "Magnesium Gummies". Phase 2 kept the JSON name. | Wrangler UPDATE `products.name` if yes |
| **M2** | Is Magnesium actually vegan? | `products.json` said "verification pending"; flipped `is_vegan=0` as safe default. | Flip back to 1 if confirmed vegan |
| **M3** | Approve capsule-copy rewrites on Ashwagandha + Magnesium descriptions | Replaced "delicious gummy form" → "easy-to-swallow capsules" and "tasty magnesium gummies" → "premium magnesium capsules". Placeholder pending her editorial touch. | Update `products.description` with her wording |
| **M10** | What to do with `collagen-powder`? | Live in D1 (`is_published=1, is_coming_soon=0`) but NOT in `products.json` spec. Image points at `/products/halo-glow-collagen.png` — that's a different SKU's image. Customer-confusing. | (a) Properly spec it in `products.json` + supply image, (b) flip to coming-soon, or (c) unpublish |

### Assets pending

| # | Question | Context | Action when answered |
|---|---|---|---|
| M4 | Confirm KSM-66 text-badge fallback is acceptable on live until SVG lands | Phase 4 ships a text chip (`<Award> KSM-66® Ashwagandha`) on Ashwagandha PDP. | Yes/no on temporary fallback |
| **M5** | Supply final KSM-66 PNG (transparent bg) or SVG | Currently using text fallback. | Upload to R2 → `UPDATE certifications SET asset_url='<r2-url>' WHERE key='ksm-66'` |
| **M8** | Lifestyle category images (5 needed) | Bug report CLIENT ACTION 3 — currently using product shots on white. | Replace `/images/categories/*.png` |
| M9 | Product image spot-check on every live PDP | Bug report CLIENT ACTION 4 — confirm DB image matches product. | Note any mismatches; we update D1 |
| **M11** | Order state machine: confirm "manual mark + customer-confirm CTA" UX | Shipped speculatively in commit `81f8692`. Admin has "Ready for Shipment…" dialog (capture courier + tracking number); customer has "I have received my order" button on guest order page. | Yes / change desired |
| **M12** | "Order Processing" email template (v3 #5 partial) | `processing_at` timestamp captured; no email fires because no template exists. | Design template at `src/lib/emails/emails/transactional/05-processing.tsx` (or similar); we wire one helper call |

### Bundles + retail decisions

| # | Question | Context | Action when answered |
|---|---|---|---|
| **M6** | Bundle contents + pricing + discount % for the 4 stacks | Phase 5 set `is_bundle=1` on Morning Energy / Evening Wind-Down / Beauty Glow / Immunity Boost. `is_published=0` until she signs off contents + RRP + bundle discount. | Update D1 rows + flip is_published=1 |
| **M7** | Social profile URLs for footer | Facebook / Instagram / TikTok / Google Business / Trustpilot. | Enter at `/admin/site-config` |
| **M13** | "B15 ticket" — checkout, signup incentive, post-purchase account flow | v3 CSV #12 — title only, no detail. Needs scope from Monique. | Scope it together; size + plan |

### Optional courier upgrade (post-launch)

| # | Question | Context | Action when answered |
|---|---|---|---|
| M14 | Want to integrate a courier webhook later for auto-mark-delivered? | Schema supports it (`tracking_carrier/number/url` columns); current flow is manual + customer self-confirm. | If yes, post-launch sprint to add courier-webhook routes |

### Admin currency display

| # | Question | Context | Action when answered |
|---|---|---|---|
| **M15** | Admin dashboard KPI cards (Today / Week / Month / All-Time / AOV) currently show **GBP-aggregated** revenue. Per-order rows on `/admin/orders` show each order's actual paid currency (v3 #6 fix). Three options. | D1 stores GBP as base; live FX is fetched per-customer at checkout. Mixing currencies into a single aggregate sum without FX conversion is meaningless — that's why we kept the aggregates GBP-shaped. | (a) Keep GBP-aggregated (current — footer note explains); (b) FX-convert mixed orders to ZAR using the rate at order time; (c) show side-by-side GBP + ZAR. |

## Engineering-side nice-to-haves (not launch blockers)

- Lighthouse audit on home + PDP + checkout — target Perf 90+, A11y 100, SEO 100 per CLAUDE.md.
- Bundle size review — `dist/index-*.js` is ~1MB minified. Code-split opportunities documented in Vite warnings.
- Security headers CSP — deferred in commit `c81c960` (needs per-page tuning against Stripe / fonts / analytics).
- Admin UI smoke-test as a real admin user — confirm `/admin/orders` (Ready-for-Shipment dialog), `/admin/dsr`, `/admin/emails` all render and work end-to-end.
- Pages-side `_headers` file for HSTS / X-Frame-Options on the static HTML (worker headers don't cascade to Pages).
- Phase 8b email-editor (full visual editor + admin-managed template content) — spec at `docs/PLAN-PHASE-8B-EMAIL-SYSTEM.md`. Post-launch sprint.
- SharePoint / DART ticket-automation — parked early in this session per user direction. Pick up post-launch when feedback velocity ramps up.

## End-to-end launch smoke test (run before flipping to public)

### Customer journey

1. Open a private-browsing tab, visit `https://thehealios.com/`.
2. Cookie banner appears. Accept Analytics only. Confirm `healios-consent` cookie exists in DevTools.
3. Navigate: Home → any Category → any PDP. PDP shows free-from icons if any apply; Ashwagandha shows the KSM-66 badge.
4. Add to cart → cart popover appears under the cart icon. Add another product, toast doesn't duplicate.
5. Open the favourites side panel (heart icon top-right). Confirm wishlist items render with thumbnails (was a stub; v3 #1).
6. Go to checkout. Country field is blank by default. Phone field is split country-code + local number (v3 #9). Fill in with SA address including Address Line 2 + a label (v3 #10). Enter Stripe test card `4242 4242 4242 4242`.
7. Place order. Redirect to success page. Order number is `HLS-YYYYMMDD-NNNN`. Subscription items show the correct discounted price (v3 #8 — was double-discounted).
8. Check inbox. Order-confirmation email should be Monique's React Email design (bone & charcoal palette, Playfair serif, "Wellness, *Elevated*." styling). **Not** the old plain-HTML template. ZAR/USD/etc orders should show the right currency symbol throughout (v3 #6 + #7).

### Order state-machine (v3 #2/#3/#4)

9. Sign in as admin → `/admin/orders`. Currency badge shown next to non-GBP totals.
10. Open the test order. From the dropdown: "Ready for Shipment…". Capture `Royal Mail / AB123456789GB / https://...`. Submit.
11. Customer inbox: shipping-confirmation email arrives with carrier + tracking link.
12. Open the guest-order URL from the original confirmation email. Should show "On its way" panel + tracking + "I have received my order" button.
13. Click "I have received my order". Status flips to delivered. Delivery-confirmation email arrives with review CTA.

### Account + compliance

14. Sign out, sign back in. Visit `/account` — "Member Since" shows a real date, not N/A (v3 #11).
15. Visit `/privacy/request`. Submit an access request with a real email. Confirmation email arrives. Click verify. Admin sees the request at `/admin/dsr` as "Verified — Action Needed".

### Analytics

16. Return to home. Open DevTools → Network. Confirm GA4 and Meta Pixel scripts load (both env vars set).

If every step passes, the site is launch-ready on the engineering side. Remaining blockers are the M1-M14 client items above.

---

## 2026-04-25 production audit — verified-from-the-outside

A live probe of `https://thehealios.com/` and `https://healios-api.ss-f01.workers.dev/` to confirm what's actually deployed and rule out drift. None of these tests need dashboard access.

### ✅ Verified working in production

- Homepage `/` returns HTTP 200, 3.5KB SPA shell. SEO meta tags present (Open Graph, Twitter card, theme-color, manifest).
- **Sitemap.xml is now dynamic** — served by the worker, filters out coming-soon products, returns 6 live URLs (was 18 mixed-state). Pages `_redirects` proxies `/sitemap.xml` → worker URL with status 200 (URL stays on thehealios.com).
- Robots.txt served with Cloudflare Managed Content + admin-path blocking.
- Worker `/products` returns full live product catalogue.
- Worker `/products/magnesium-gummies` returns the synced Phase 2 data: `is_vegan=0` ✅, capsule-correct description ✅, ingredients with active line first ✅, `product_cautions` populated ✅, `contains_allergens` populated ✅. Same shape verified for the four other live products.
- Worker `/public/product/ashwagandha-gummies/certifications` returns the seeded KSM-66 row. Other products return `[]`.
- Worker `/public/product/<id>/certifications` cache header `s-maxage=3600` confirmed.
- Worker `/dsr/request` responds with proper validation errors (`invalid_email`, `invalid_request_type`).
- Worker `/stripe-webhook` responds 400 + `Missing stripe-signature` on signatureless POST (signature verification is alive).
- **Worker `/orders/by-token/:token/confirm-delivered`** (NEW v3 #2) responds 400 on short tokens, 404 on unknown tokens. Idempotent on already-delivered orders. Refuses transitions from non-shipped state (409).
- All 14 new product images from Monique are served at correct paths with correct file sizes (`/products/<slug>.png`).
- Email logo URL `/healios-logo.png` returns 200 (used by Phase 8a email templates).
- Worker security headers applied per-response (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security on Worker only).
- D1 schema audit confirms: `orders.currency` ✅, `addresses.street_address_2` ✅, `orders.shipping_address_2` ✅, **`orders.tracking_carrier/number/url`** ✅, **`orders.processing_at/shipped_at/delivered_at/delivered_by`** ✅, `certifications` + `product_certifications` tables ✅, `dsr_requests` table ✅. **All migrations 015–019 applied.**
- Live D1 product-state distribution: 6 live products, 10 coming-soon, 5 unpublished, 4 bundles flagged but unpublished.
- All 4 historical orders have `currency` populated (defaulted to GBP via migration 018).
- Frontend admin `/admin/orders` has a "Ready for Shipment…" dialog (capture courier + tracking) replacing the old "Mark as Shipped" dropdown item. Tracking displayed in the expanded order detail with a Track-package external link.
- Frontend customer `/order/:accessToken` (guest-order page) shows tracking + "I have received my order" CTA when status=shipped, "Delivered on …" panel when status=delivered.

### ❌ Verified blockers / drift (open)

- **`VITE_META_PIXEL_ID` still missing** on Cloudflare Pages — live HTML contains zero `fbq` / `connect.facebook` references. Meta Pixel not firing.
- **`VITE_CLARITY_ID` still missing** on Cloudflare Pages — zero `clarity.ms` references in live HTML.
- **`collagen-powder` is live but not in Monique's `products.json` spec** (M10 below). The row exists in D1 with `is_published=1, is_coming_soon=0`, image points at `/products/halo-glow-collagen.png` — re-using the Halo Glow image which is a different SKU. Customer-confusing as-is.
- **Cloudflare Pages HTML doesn't carry our security headers.** `withSecurityHeaders` middleware in `worker-api/src/index.ts` only protects Worker API responses. Pages HTML has minimal headers. To add HSTS/X-Frame-Options on Pages HTML, add a `_headers` file at `public/_headers` (Pages-native syntax). Not a launch-blocker (HTTPS still enforced) but worth doing pre-launch.
- **Cookie consent banner can't be verified via curl** because the SPA renders it client-side. Spot-check needed in a real private-browsing tab.

### ✅ Audit findings closed since the previous pass

- **Sitemap.xml leaks coming-soon products** — closed in commit `b262e23`. Sitemap is now generated dynamically from D1, filtered to `is_published=1 AND is_coming_soon=0`. Output went from 18 product URLs (mixed states) to 6 live products only. Pages routes `/sitemap.xml` to the worker via `_redirects`.
- **Order state machine missing for shipping/delivery transitions** — closed in commit `81f8692`. Admin can now mark "Ready for Shipment" with courier + tracking, customer gets a tracking email automatically. Customer can self-confirm delivery from the guest order page. Three v3 tickets (#2, #3, #4) closed; #5 is partial pending Monique's processing-email template design.

### ⚠️ Couldn't verify from this environment

These need manual browser interaction. Run before launch.

- **Lighthouse** — no headless Chrome available locally. Run `npx lighthouse https://thehealios.com/ --view` from a Mac/Linux box. Targets per CLAUDE.md: Performance 90+, Accessibility 100, SEO 100.
- **Cookie banner UX flow** — needs a real private-browsing session. Confirm: banner appears on first visit, "Accept All" sets `healios-consent` cookie with `analytics=true,marketing=true`, "Reject All" sets `analytics=false,marketing=false`, "Cookie Settings" footer link reopens the banner.
- **Order state-machine end-to-end** (NEW — needs verification): Place a Stripe test-card order. As admin, click "Ready for Shipment…" with `Royal Mail / AB123456789GB / https://www.royalmail.com/track-your-item`. Verify (a) shipping email arrives with carrier + tracking link, (b) guest-order page (`/order/:accessToken` from the order email) shows the "On its way" panel + tracking, (c) clicking "I have received my order" flips status to delivered and triggers the delivery email with review CTA.
- **Stripe end-to-end test order** — place a £1 test with `4242 4242 4242 4242` and verify: (a) order-confirmation page shows correct prices in correct currency, (b) order-confirmation email uses Monique's React Email design (not the legacy plain-HTML template), (c) admin `/admin/orders` shows the order with the right currency symbol + currency code badge for non-GBP, (d) D1 `orders.currency` is populated.
- **Live Meta / Clarity firing** — even after env vars are set, only a real browser visit confirms scripts execute and consent gates them correctly.
- **DSR flow end-to-end** — submit a request at `/privacy/request`, click the verify link in the email, sign in as admin, see the request at `/admin/dsr` as "Verified — Action Needed", action it (test with a throwaway user; erasure is irreversible).

---

## Rollback plan

If a post-launch issue emerges:

1. **Frontend regression** — revert the offending commit on `main`, push. Cloudflare Pages auto-deploys within ~60 seconds.
2. **Worker regression** — `wrangler deploy` the prior Worker version. Every deploy has a Current Version ID captured in the deploy output; keep the last-3 in a scratchpad.
3. **D1 data corruption** — Cloudflare D1 has daily backups. Dashboard → D1 → healios-db → Backups.
4. **Stripe webhook misfires** — deactivate the endpoint in Stripe Dashboard → Developers → Webhooks; orders fall back to manual processing until the Worker is fixed. Critical orders visible in Stripe dashboard regardless.
5. **Email outage** — Resend dashboard shows recent sends; can re-send manually from there in an emergency.
