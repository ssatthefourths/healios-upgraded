# CLAUDE.md — The Healios (Architecture Reference)

## Project
**The Healios** — SA wellness e-commerce platform (active build).
**Type:** Venture
**Status:** Active
**Repo:** `github.com/ssatthefourths/healios-upgraded`
**URL target:** thehealios.com
**Worker URL:** `https://healios-api.ss-f01.workers.dev`

## Purpose
South African health and wellness e-commerce platform. Sells health products to SA consumers. Premium positioning — curated wellness destination, not a discount marketplace.

## Stack
- React 18 + Vite (SWC) + TypeScript
- Cloudflare Pages (frontend hosting, auto-deploy on push to main)
- Cloudflare Workers (REST API backend at `worker-api/`)
- Cloudflare D1 (SQLite database, binding `DB`, database `healios-db`)
- Stripe (payments — Checkout hosted page, HMAC webhook verification)
- Resend (transactional email — order confirmations)

## Architecture Rules
- Stripe: verify webhook HMAC signature before processing any order confirmation (`worker-api/src/stripe-webhook.ts`)
- Order state machine: `pending` → `payment_confirmed` → `processing` → `shipped` → `delivered` / `returned`
- Inventory: decrement stock on payment confirmation, not on cart add
- No overselling: check stock at checkout, not just at cart add
- Customer data POPIA-compliant — SA data residency preferred
- No payment details stored in database — Stripe Checkout handles PCI compliance

## Supabase Bridge
`src/integrations/supabase/client.ts` re-exports the Cloudflare D1 client as `supabase` to keep all 75+ import paths unchanged across the codebase. Do not modify this bridge file or import from Supabase directly.

## Worker Secrets (must be set via `wrangler secret put` before going live)
- `JWT_SECRET` — signs auth tokens
- `STRIPE_KEY` — live Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard after registering webhook endpoint
- `RESEND_API_KEY` — Resend transactional email
- `LOVABLE_API_KEY` — wellness chatbot

## Do Not Touch
- `worker-api/src/stripe-webhook.ts` — payment verification logic is critical; any change must preserve HMAC signature validation
- Order records once `payment_confirmed` — financial records, immutable

## Notes
- SA market: ZAR pricing, SA delivery zones
- Base currency in D1 is GBP; converted to display currency (ZAR, USD, EUR, CAD, AUD) on read via `/currency` worker endpoint
- Archived repos (`HealiosHealth`, original Supabase/PayFast/Vercel version) — do not use for active development
