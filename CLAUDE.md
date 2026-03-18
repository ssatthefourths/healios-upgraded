# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**The Healios** — South African premium wellness e-commerce platform (thehealios.com).
Premium positioning: curated wellness destination, not a discount marketplace. SA market — ZAR pricing, SA delivery zones.

## Commands

```bash
npm run dev        # Dev server at http://localhost:8080
npm run build      # Production build → dist/
npm run build:dev  # Development build
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

No test runner is configured. Lint before committing.

## Architecture

**Stack:** React 18 + Vite (SWC) + TypeScript. Deployed to Cloudflare Pages (frontend) + Cloudflare Workers (API proxy). Backend via Supabase (PostgreSQL, auth, edge functions) + Stripe (payments).

**Routing:** React Router v6 in `src/App.tsx`. Core routes (Home, Category, ProductDetail, Checkout, Auth, Account) are eagerly loaded. Admin and auxiliary pages are lazy-loaded. Admin routes are protected by `<AdminRoute />`.

**State:**
- Global: React Context in `src/contexts/` (Auth, Cart, Currency)
- Server state: TanStack React Query (5min stale, 10min cache, no refetch-on-focus)
- Forms: React Hook Form + Zod validation

**API Layer:** `VITE_CF_WORKER_URL` points to the Cloudflare Worker at `worker-api/`. The worker proxies requests and holds secrets (Stripe keys, Resend API key, JWT secret). Supabase edge functions live in `supabase/functions/` (Deno runtime).

**Styling:** Tailwind CSS with CSS variable design tokens (`--fs-*` for fluid typography via `clamp()`, `--space-*`, `--radius`). Dark mode via `class` strategy. shadcn/ui (Radix-based) for UI primitives in `src/components/ui/`. Fonts: DM Sans (sans), Playfair Display (serif).

**Animations:** GSAP via `useGsapReveal` hook — always use `gsap.context()` in `useEffect` and revert on cleanup. Respect `prefers-reduced-motion`. Lenis for smooth scrolling.

**Path alias:** `@` resolves to `src/`.

## Key Directories

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level page components |
| `src/components/` | Feature-organized components (by domain: product, checkout, admin, etc.) |
| `src/components/ui/` | shadcn/ui primitives — don't modify these directly |
| `src/contexts/` | Auth, Cart, Currency global state |
| `src/hooks/` | Custom React hooks |
| `src/services/` | API service layer (products, orders, reviews, users, wishlist) |
| `src/integrations/supabase/` | Supabase client + generated types |
| `src/lib/` | Utilities, analytics, feature flags, logger |
| `supabase/functions/` | Deno edge functions (23+) |
| `worker-api/src/index.ts` | Cloudflare Worker API proxy |
| `supabase/migrations/` | Database schema and RLS policies |
| `handoffs/` | Session handoff notes and plans — check here for recent context |

## Critical Rules

**Order state machine (strict):** `pending` → `payment_confirmed` → `processing` → `shipped` → `delivered` / `returned`
- Decrement inventory on `payment_confirmed`, not on cart add
- Check stock at checkout, not just at cart add

**Payments (Stripe):**
- Always verify webhook signatures before processing order confirmation (`supabase/functions/stripe-webhook`)
- Use idempotency keys for server-side payment creation
- Never store raw payment details in the database

**Supabase:** RLS is enabled on user data tables. Never expose `service_role` key to the client.

**Data compliance:** SA customers — POPIA-compliant, SA data residency preferred.

## Do Not Touch

- `supabase/functions/stripe-webhook` — payment verification logic is critical; any change must preserve signature validation
- Order records once `payment_confirmed` — financial records are immutable
- `src/pages/Checkout.tsx` — high-complexity (57KB); preserve existing checkout/payment flow unless explicitly justified in `/handoffs/REFACTOR_JUSTIFICATION.md`

## Design System Constraints

- Border radii: `1rem` small, `1.5rem` cards, `2rem` sections — no sharp rectangles on primary surfaces
- Button microinteractions: hover `scale(1.02)`, active `scale(0.98)`, easing `cubic-bezier(0.34,1.56,0.64,1)`
- Fluid tokens via `clamp()` — use `--fs-xxl`, `--fs-xl`, `--fs-base`, `--space-lg` variables

## Feature Flags

Conditional features are gated via `src/lib/featureFlags.ts` and the `<FeatureGate>` component.

## Performance Targets

LCP < 2.5s, CLS < 0.1, INP < 100ms. Total JS < 200KB gzip (target). Lighthouse: Performance 90+, Accessibility 100, SEO 100.

## Cookie Consent System

Consent is managed in `src/lib/consentMode.ts`. Key points:
- Stores a `healios-consent` browser cookie (URL-encoded JSON, 365-day expiry) — visible in DevTools → Application → Cookies
- Three categories: **Essential** (always on), **Analytics** (GA4 + Clarity), **Marketing** (Meta Pixel)
- `hasAnalyticsConsent()` and `hasMarketingConsent()` are the authoritative predicates — import from `consentMode`, not from `analytics.ts` or `metaPixel.ts`
- Google Consent Mode v2 signals split: `analytics_storage` ↔ Analytics; `ad_storage`/`ad_user_data`/`ad_personalization` ↔ Marketing
- `CONSENT_VERSION = 1` in `consentMode.ts` — bump to force re-consent on policy changes
- Banner UI + preferences modal in `src/components/CookieConsent.tsx`; footer "Cookie Settings" button fires `open-cookie-preferences` DOM event

## Working Rules (Claude)

**Always run `npm run build` before committing.** The build catches TypeScript module errors that lint misses (e.g. re-exports that don't bring symbols into local scope). Never commit without a clean build.

**Make changes incrementally.** One logical change per commit. Verify each step before moving to the next.

---

## Session Log — 2026-03-18

### Completed
1. **Committed 5 UI phases** (Atelier design system): Playfair Display serif, DM Sans, fluid CSS tokens, GSAP `useGsapReveal` scroll reveals on FiftyFiftySection / ProductCarousel / PersonalizedRecommendations, Navigation megamenu blank-box fix
2. **Cookie consent rewrite** (UK PECR + GDPR compliant):
   - First-party `healios-consent` browser cookie now written on accept/decline
   - Granular categories: Analytics (GA4 + Clarity) vs Marketing (Meta Pixel)
   - Banner: Accept All / Manage Preferences / Decline All
   - Preferences modal with Switch toggles (shadcn Dialog)
   - Footer "Cookie Settings" re-entry link
3. **Hotfix**: `hasAnalyticsConsent` was not in scope for internal calls inside `analytics.ts` — fixed by adding explicit `import` alongside re-export

### Still To Do (pick up here next session)

- [ ] **Stripe Worker secrets** — configure in Cloudflare Worker via `wrangler secret put`:
  - `STRIPE_KEY` (live secret key)
  - `STRIPE_WEBHOOK_SECRET` (from Stripe dashboard after registering endpoint)
  - `JWT_SECRET`
  - `RESEND_API_KEY`
- [ ] **Register Stripe webhook** — add endpoint `https://healios-api.ss-f01.workers.dev/stripe-webhook` in Stripe dashboard, get the signing secret
- [ ] **Verify ZAR currency** on Stripe — confirm the Stripe account supports ZAR payments
- [ ] **Analytics env vars** — confirm these are set in Cloudflare Pages environment variables (without them analytics scripts never load):
  - `VITE_GA_ID` (Google Analytics 4 measurement ID)
  - `VITE_META_PIXEL_ID`
  - `VITE_CLARITY_ID` (currently hardcoded fallback `vsma9av1yg` in clarity.ts)
- [ ] **Privacy Policy page** (`/privacy-policy`) — should list all cookies set: `healios-consent`, `_ga`, `_gid`, `_fbp`, `_clck` with retention periods (UK PECR requires this)
- [ ] **Commit `CLAUDE.md`** to the repo so it persists across sessions
