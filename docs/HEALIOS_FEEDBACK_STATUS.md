# HealiosIssuesFeedback.csv — Status for Testing

Last updated: 2026-04-22. Snapshot of local, uncommitted Batch 0 changes.

**Nothing here has been pushed to production yet.** Monique can test Batch 0 locally once the code is deployed.

---

## Summary at a glance

| # | Ticket | Status now | Fix shipped in |
|---|---|---|---|
| 1 | PDP default → Subscribe & Save | Open | Batch A (next) |
| 2 | Search ↔ Wishlist panels mutex | Open | Batch A (next) |
| 3 | Remove "Healios" prefix from product names | Open — data fix | Batch E |
| 4 | Category filter returns 0 products | Unconfirmed — needs repro | Batch E |
| 5 | Checkout form — red borders / inline errors on all fields | **Partial** — email/phone/postcode already show red borders; name/address/city/country do NOT. Still open. | Batch D |
| 6 | Stripe + card network logos on checkout | Open | Batch D |
| 7 | Cart shipping text 10px → 13px | Open | Batch A (next) |
| 8 | Currency dropdown flag + spacing | Open — flags don't currently exist in the dropdown | Batch F |
| 9 | All product cards → Magnesium PDP (CRITICAL) | **Fixed in code (Batch 0)** — pending deploy & re-test | Batch 0 (now) |
| 10 | Single add-to-cart toast anchored under cart icon | Open | Batch A (next) |
| 11 | Wishlist sign-in CTA + return flow | Open | Batch B |
| 12 | Footer trust bundle (Google Business + Trustpilot) | Open — needs final URLs + SVGs from Monique | Batch C |
| 13 | Footer social bundle (FB + IG + TikTok) | Open — needs final URLs + SVGs from Monique | Batch C |
| 14 | Both footer bundles present & grouped | Open — dependent on 12 & 13 | Batch C |
| 15 | Newsletter signup email | ✅ Already done (prior sprint) | — |
| 16 | Remove nav dropdown bullet points | ✅ Already done (prior sprint) | — |

---

## What's in Batch 0 (local, uncommitted)

**Goal:** harden routing across the whole app so CSV ticket 9 stays fixed and adjacent issues don't regress.

### Code changes (ready to deploy)

- **New helpers**
  - `src/lib/productPath.ts` — single `getProductPath(product)` helper returning `` `/product/${product.slug || product.id}` ``.
  - `src/lib/categorySlug.ts` — `categoryDisplayToSlug()` maps display-name strings like "Vitamins & Minerals" back to the URL slug ("vitamins-minerals").
- **Product-card links normalised** to use the helper in 10 places:
  - `src/components/content/ProductCarousel.tsx` (home bestsellers — fixes ticket 9)
  - `src/components/account/WishlistSection.tsx` (account wishlist grid)
  - `src/components/product/PersonalizedRecommendations.tsx`
  - `src/components/product/PairsWellWith.tsx`
  - `src/components/product/BundleContents.tsx`
  - `src/components/category/ProductGrid.tsx`
  - `src/components/category/FeaturedProductCard.tsx` (4 call sites)
  - `src/components/header/Navigation.tsx` (search results)
  - `src/components/checkout/OrderConfirmation.tsx` (post-purchase recommendations)
  - `src/components/seo/ProductSchema.tsx` (SEO JSON-LD canonical URL)
- **PDP breadcrumb category href fixed** — before: `/category/Vitamins & Minerals` (404). After: `/category/vitamins-minerals`. Fixes both visible breadcrumb and schema.org BreadcrumbList URL. Files: `src/pages/ProductDetail.tsx`, `src/components/product/ProductInfo.tsx`.
- **Worker `in.` and `not.in.` operator support** — `worker-api/src/products.ts` now correctly handles `.in('id', [...])` and `.not('id', 'in', ...)` queries. This also fixes the Latest Arrivals section (`FeaturedArrivalsSection`) which was returning zero products, and the wishlist items fetch, and post-purchase recommendation exclusion.

### Verification so far

- `npm run build` — clean.
- `npm run lint` — zero new errors in files I touched (pre-existing baseline of 356 lint errors/warnings unchanged).
- Dev server (`npm run dev`) starts clean, HTTP 200 on `/`, `/category/all`, `/product/magnesium-gummies`, `/product/halo-glow`.
- Live D1 verified via `wrangler d1 execute --remote`: 19 distinct products, each with a distinct `id` and distinct `slug`. Sort order correct (Magnesium=1, Halo Glow=2, Vitamin D3=3, Ashwagandha=4).

### Known live-data findings from the D1 audit

- **`id` ≠ `slug` for most products** (e.g. `id='halo-glow-collagen'`, `slug='halo-glow'`). Old code that linked via `product.id` would still resolve but the URL would differ from the breadcrumb/canonical — meaning a broken user bookmark experience and inconsistent analytics paths. Batch 0 normalises everything to the slug.
- **"Healios " prefix** still present on 5 product names in D1 (Magnesium, Halo Glow, Ashwagandha, Collagen Powder). Confirms ticket 3 data fix is still needed.

### What Monique should test after deploy (Batch 0)

1. Go to homepage → click every card in the "Bestsellers" carousel → confirm each lands on its own PDP, not Magnesium.
2. Go to a PDP (e.g. `/product/magnesium-gummies`) → click the category breadcrumb ("Vitamins & Minerals") → confirm it lands on `/category/vitamins-minerals` (real category page with products), not a 404.
3. Check "Latest Arrivals" / `/category/new-in` — confirm three featured products render (Vitamin D3, Ashwagandha, Magnesium).
4. Sign in → open account → wishlist panel → confirm items still load + clicking each card routes correctly.
5. On a PDP, scroll to "Pairs well with" / "Complete your routine" / "Recommended for you" sections → confirm each card routes to the correct PDP.
6. Search in the header → click a result → confirm routing.

---

## Things I'm NOT 100% sure about — please verify before I touch them

1. **Ticket 4 (category filter returns 0 products)** — the code path in `src/pages/Category.tsx` looks correct; `categoryMap` covers all known slugs. Before patching, I need to reproduce the bug against live data — which specific category URL does Monique see 0 products on? If there's a screenshot or URL in the ticket I missed, please point me at it.
2. **Ticket 1 (PDP default subscription)** — CSV says "confirm with Monique: likely 'Every 30 days'." User confirmed 30-day when I asked. I'll ship 30-day but it's worth a final confirm on the first deployed PDP.
3. **Tickets 12 + 13 (footer bundles)** — the CSV says "assets needed: brand-approved SVGs + final profile URLs." I don't have those yet. I can ship the component markup behind placeholder hrefs, but the ticket formally says "Location screenshots to be attached to this ticket by Monique before work starts" — worth asking whether we can proceed without.
4. **Ticket 8 (currency dropdown flags)** — Monique's ticket assumes flags exist and just need spacing fixed. They don't exist at all today. User confirmed "add flags for all currencies." Still worth visual review of the first pass.

---

## What's NOT in Batch 0 (i.e. the rest of the CSV)

All of Batch A / B / C / D / E / F per the approved plan. Order of work:

- **Batch A (next, cosmetic/UX):** tickets 7, 2, 1, 10.
- **Batch B:** ticket 11.
- **Batch C:** tickets 12, 13, 14 (blocked on Monique's assets).
- **Batch D:** tickets 6, 5 (checkout — extra careful, no logic changes).
- **Batch E:** tickets 3, 4 (D1 data fixes via wrangler).
- **Batch F:** ticket 8.

Each batch lands as a separate commit. Nothing touches the Stripe webhook or the checkout payment logic.

---

## Correction to prior work notes

The memory note claiming ticket 9 ("all cards → Magnesium") was fixed in a previous sprint was wrong. The fix had only been applied to `src/components/category/ProductGrid.tsx`, not to `src/components/content/ProductCarousel.tsx` (home page Bestsellers) or `src/components/account/WishlistSection.tsx`. Batch 0 fixes all of them plus the breadcrumb bug that would have caused its own 404s.
