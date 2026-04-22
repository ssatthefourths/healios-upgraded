# Link & Route Index — The Healios

Authoritative reference of every navigational link in the app. Scan this before claiming a routing bug is fixed. Update whenever a new `<Link>`, `<a href>`, `navigate()`, `useNavigate()`, `Navigate to=`, or `window.location` is added.

Routes are defined in [src/App.tsx](../src/App.tsx) and aliased in [src/constants/routes.ts](../src/constants/routes.ts).

---

## 1. Route table (src/App.tsx)

| Path | Component | Lazy | Admin-protected |
|---|---|---|---|
| `/` | Index | no | no |
| `/shop` | → `/category/shop` (redirect) | no | no |
| `/category/:category` | Category | no | no |
| `/product/:productId` | ProductDetail | no | no |
| `/bundle/:slug` | BundleDetail | yes | no |
| `/checkout` | Checkout | no | no |
| `/auth` | Auth | no | no |
| `/account` | Account | no | no |
| `/about/our-story` | OurStory | yes | no |
| `/about/quality-sourcing` | QualitySourcing | yes | no |
| `/about/product-guide` | ProductGuide | yes | no |
| `/about/customer-care` | CustomerCare | yes | no |
| `/about/wholesale` | WholesalePartners | yes | no |
| `/reset-password` | ResetPassword | yes | no |
| `/privacy-policy` | PrivacyPolicy | yes | no |
| `/terms-of-service` | TermsOfService | yes | no |
| `/shipping-returns` | ShippingReturns | yes | no |
| `/wellness-drive` | WellnessDrive | yes | no |
| `/wellness-quiz` | WellnessQuiz | yes | no |
| `/faq` | FAQ | yes | no |
| `/blog` | Blog | yes | no |
| `/blog/:slug` | BlogPost | yes | no |
| `/subscribe` | Subscribe | yes | no |
| `/gift-cards` | GiftCards | yes | no |
| `/gift-cards/success` | GiftCardSuccess | yes | no |
| `/admin` | AdminDashboard | yes | **yes** |
| `/admin/wellness` | WellnessAdmin | yes | **yes** |
| `/admin/orders` | OrdersAdmin | yes | **yes** |
| `/admin/newsletter` | NewsletterAdmin | yes | **yes** |
| `/admin/inventory` | InventoryAdmin | yes | **yes** |
| `/admin/discounts` | DiscountsAdmin | yes | **yes** |
| `/admin/reviews` | ReviewsAdmin | yes | **yes** |
| `/admin/products` | ProductsAdmin | yes | **yes** |
| `/admin/bundles` | BundlesAdmin | yes | **yes** |
| `/admin/bundles/:id` | BundleEditor | yes | **yes** |
| `/admin/analytics` | AnalyticsAdmin | yes | **yes** |
| `/admin/cohorts` | CohortAnalysis | yes | **yes** |
| `/admin/rfm` | RFMAnalysis | yes | **yes** |
| `/admin/campaigns` | CampaignAnalytics | yes | **yes** |
| `/admin/clv` | CLVDashboard | yes | **yes** |
| `/admin/subscriptions` | SubscriptionAnalytics | yes | **yes** |
| `/admin/blog` | BlogAdmin | yes | **yes** |
| `/admin/security` | CheckoutSecurityAdmin | yes | **yes** |
| `/admin/referral-security` | ReferralSecurityAdmin | yes | **yes** |
| `/admin/users` | UsersAdmin | yes | **yes** |
| `*` | NotFound | no | no |

---

## 2. Product-card links (the critical audit surface)

The `/product/:productId` route accepts **either id or slug** — backend resolves via `WHERE id = ? OR slug = ?` ([worker-api/src/products.ts:144-148](../worker-api/src/products.ts)). But since `id` and `slug` aren't always identical in D1 (e.g. `id='halo-glow-collagen'` / `slug='halo-glow'`), every card site must use the same expression so URLs match breadcrumbs, SEO canonicals, and analytics paths.

**Canonical rule:** use `getProductPath(product)` from `src/lib/productPath.ts` — which returns `` `/product/${product.slug || product.id}` ``.

| Source component | Uses helper? | Notes |
|---|---|---|
| `src/components/content/ProductCarousel.tsx` (home bestsellers) | yes (post-Batch-0) | Was using `product.id` only. |
| `src/components/account/WishlistSection.tsx` | yes (post-Batch-0) | Was using `product.id` only. |
| `src/components/product/PersonalizedRecommendations.tsx` | yes (post-Batch-0) | Was ternary on `product.slug`. |
| `src/components/product/PairsWellWith.tsx` | yes (post-Batch-0) | Was inline `slug \|\| id`. |
| `src/components/category/ProductGrid.tsx` | yes (post-Batch-0) | Was inline `slug \|\| id`. |
| `src/components/product/BundleContents.tsx` | yes (post-Batch-0) | Was inline `slug \|\| id`. |
| `src/components/category/FeaturedProductCard.tsx` (4 call sites) | yes (post-Batch-0) | Was inline `slug \|\| id`. |
| `src/components/header/Navigation.tsx` (search results) | yes (post-Batch-0) | Was inline `slug \|\| id`. |

### Data-layer issues that look like routing bugs

1. **`src/components/category/FeaturedArrivalsSection.tsx`** — calls `.in('id', FEATURED_PRODUCT_IDS)` against the worker. The worker's products endpoint historically did not understand the `in.` operator, so the query collapsed to `id = 'a,b,c'` (literal). **Fixed in Batch 0** by adding `IN (?, ?, ?)` handling to `worker-api/src/products.ts`.
2. **Live D1 data integrity** — if bestsellers cards all land on Magnesium despite distinct `product.id` in the seed, live DB likely has duplicate or NULL id rows. Verify with: `wrangler d1 execute healios-db --remote --command "SELECT id, slug, name, sort_order FROM products ORDER BY sort_order"`.
3. **`src/pages/WellnessQuiz.tsx:98-139`** — hard-coded `productMappings` using slugs like `"vitamin-d3-4000iu-gummies"` that don't match seed (`vitamin-d3-gummies`). Latent risk.
4. **PDP breadcrumb** — was `` `/category/${product.category}` `` where `product.category` is the display name ("Vitamins & Minerals"), not a slug. **Fixed in Batch 0** via `src/lib/categorySlug.ts`.

---

## 3. Header + megamenu (src/components/header/Navigation.tsx)

| File:line | Label | Target |
|---|---|---|
| Navigation.tsx:194 | Logo | `/` |
| Navigation.tsx:86-92 | Shop megamenu | `ROUTES.CATEGORY.ALL` / `.VITAMINS` / `.ADAPTOGENS` / `.DIGESTIVE` / `.SLEEP` / `ROUTES.SUBSCRIBE` / `ROUTES.WELLNESS_QUIZ` |
| Navigation.tsx:101-105 | New In megamenu | `ROUTES.CATEGORY.NEW_IN` / `.BEST_SELLERS` / `.BUNDLES` |
| Navigation.tsx:112-117 | Wellness Drive megamenu | `ROUTES.WELLNESS_DRIVE` / submit section / `ROUTES.BLOG` |
| Navigation.tsx:122-129 | About megamenu | `ROUTES.ABOUT.STORY` / `.QUALITY` / `.GUIDE` / `.CARE` / `.WHOLESALE` |
| Navigation.tsx:330-335 | Account / sign-in icon | `user ? '/account' : '/auth'` |
| Navigation.tsx:253-320 | Admin dropdown | `/admin/*` |
| Navigation.tsx:494-513 | Search result cards | `getProductPath(product)` |
| Navigation.tsx:516-525 | "View all results" | `` `/category/all?search=${encodeURIComponent(query)}` `` |
| Navigation.tsx:566-596 | Mobile drawer | same as desktop |
| Navigation.tsx:748-755 | Favourites panel sign-in CTA | `ROUTES.AUTH` |
| Navigation.tsx:431 | Megamenu "Shop the Collection" | `/category/new-in` |
| Navigation.tsx:409 | Megamenu featured panel | `hoveredSubItem.href` |

---

## 4. Footer (src/components/footer/Footer.tsx)

| File:line | Label | Target |
|---|---|---|
| Footer.tsx:109-113 | Shop list | `ROUTES.CATEGORY.ALL/.VITAMINS/.ADAPTOGENS/.DIGESTIVE/.SLEEP` |
| Footer.tsx:121-127 | Support list | `ROUTES.SUBSCRIBE` / `GIFT_CARDS` / `FAQ` / `ABOUT.GUIDE/.QUALITY/.CARE/.WHOLESALE` |
| Footer.tsx:135-137 | About list | `ROUTES.ABOUT.STORY` / `BLOG` / `ABOUT.WHOLESALE` |
| Footer.tsx:151,154,157 | Legal | `ROUTES.SHIPPING` / `PRIVACY` / `TERMS` |
| Footer.tsx:148 | Agency credit (external) | `https://www.thefourths.com` |

**Missing per CSV tickets 12-14:** social bundle (Facebook, Instagram, TikTok) + trust bundle (Google Business, Trustpilot).

---

## 5. Hero & editorial sections

| File:line | Element | Target |
|---|---|---|
| LargeHero.tsx:57 | Primary CTA | `/category/best-sellers` |
| LargeHero.tsx:64 | Secondary CTA | `/wellness-quiz` |
| LargeHero.tsx:93 | Shop Now | `/category/all` |
| FiftyFiftySection.tsx:21 | Left block | `/category/all` |
| FiftyFiftySection.tsx:33 | Wellness Drive feature | `/wellness-drive` |
| FiftyFiftySection.tsx:62 | Beauty card | `/category/beauty` |
| FiftyFiftySection.tsx:85 | Adaptogens card | `/category/adaptogens` |
| OneThirdTwoThirdsSection.tsx:22 | Digestive card | `/category/digestive` |
| OneThirdTwoThirdsSection.tsx:49 | Sleep card | `/category/sleep` |
| OneThirdTwoThirdsSection.tsx:82 | View all | `/category/all` |
| BrandDefinition.tsx:25 | Read our story | `/about/our-story` |
| EditorialSection.tsx:15 | Wellness Drive | `/wellness-drive` |

---

## 6. Breadcrumbs

| File:line | Crumb | Target |
|---|---|---|
| ProductDetail.tsx:163 | Home | `/` |
| ProductDetail.tsx:169 | Category | `/category/${categoryDisplayToSlug(product.category)}` |
| ProductInfo.tsx:153, 159 | Home / Category | `/` / `/category/${categoryDisplayToSlug(product.category)}` |
| BundleDetail.tsx:130, 132 | Home / Bundles | `/` / `/category/bundles` |
| CategoryHeader.tsx:25 | Home | `/` |

---

## 7. Cart, checkout, account, auth

| File:line | Element | Target |
|---|---|---|
| ShoppingBag.tsx:151 | Go to checkout | `/checkout` |
| ShoppingBag.tsx:163 | Empty-bag CTA | `/category/shop` |
| Checkout.tsx:651 | Empty cart | `/` |
| Checkout.tsx:870 | Guest sign-in | `/auth?redirect=/checkout` |
| Checkout.tsx:1397, 1400 | Order complete | `/account`, `/` |
| OrderConfirmation.tsx:429, 438, 443 | View orders / sign-in / continue | `/account` / `/auth?redirect=/account` / `/` |
| Account.tsx:286 | Back to shopping | `/` |
| Auth.tsx:52, 239, 249 | Post-auth / logos | `/account`, `/`, `/` |
| CheckoutHeader.tsx:12, 20 | Back / logo | `/`, `/` |

---

## 8. Utility / page CTAs

| File:line | Element | Target |
|---|---|---|
| NotFound.tsx:63, 69, 83-95, 104 | 404 CTAs | `/`, `/category/all`, `/category/vitamins\|sleep\|beauty\|bundles\|all`, `/about/customer-care` |
| Subscribe.tsx:119, 281, 284 | Start / shop / guide | `/category/all`, `/category/all`, `/about/product-guide` |
| GiftCardSuccess.tsx:39, 158, 164 | Gift card success | `/gift-cards`, `/category/shop`, `/gift-cards` |
| BlogPost.tsx:174, 225, 348 | Back to blog | `/blog` |
| WellnessDrive.tsx:232 | Sign in CTA | `/auth` |
| WellnessQuiz.tsx:455 | Results | `/category/shop` |
| ReviewProduct.tsx:148 | Sign in to review | `/auth` |
| NotifyMeButton.tsx:83 | Sign in | `/auth` |
| LoyaltyPointsRedeem.tsx:52 | Sign in | `/auth` |
| SubscriptionSection.tsx:193, 407 | Start sub / FAQ | `/subscribe`, `/faq` |
| OrderHistory.tsx:153 / WishlistSection.tsx:91 | Browse | `/category/shop` |

---

## 9. Admin navigation

| File:line | Label | Target |
|---|---|---|
| AdminHeader.tsx:20, 26 | Logout / logo | `navigate('/auth')`, `/admin` |
| AdminLayout.tsx:20, 34 | Guard redirects | `/auth`, `/` |
| AdminDashboard.tsx:299, 306, 313, 320, 373 | Quick links | `/admin/orders`, `/admin/inventory`, `/admin/reviews`, `/admin/wellness`, `/admin/orders` |
| BundlesAdmin.tsx:82, 148 | New / edit | `/admin/bundles/new`, `/admin/bundles/${bundle.id}` |
| BundleEditor.tsx:166, 189 | Save / cancel | `/admin/bundles` |
| RFMAnalysis.tsx:465 | Send campaign | `/admin/newsletter?segment=${encodeURIComponent(segment.name)}` |
| CampaignAnalytics.tsx:225, 241 | Back | `/admin/newsletter` |

---

## 10. External links

| File:line | Where | URL |
|---|---|---|
| Footer.tsx:148 | Agency credit | `https://www.thefourths.com` |

Footer social + trust icons (CSV tickets 12/13/14) — not yet implemented.

---

## Canonical rules going forward

1. **Product URLs:** always `getProductPath(product)` from `src/lib/productPath.ts`. Never hard-code a product slug outside of URL redirects.
2. **Category URLs on PDP breadcrumbs:** always `categoryDisplayToSlug(product.category)` from `src/lib/categorySlug.ts` before pushing into `/category/…`.
3. **Route constants:** import from `src/constants/routes.ts` rather than string literals, except where a dynamic segment makes that awkward.
4. **Any PR that adds a clickable product card MUST update this doc.**
