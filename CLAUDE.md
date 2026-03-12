# CLAUDE.md — The Healios

## Project
**The Healios** — SA wellness e-commerce platform (active build).
**Type:** Venture
**Status:** Active
**Local path:** `~/Projects/ventures/thehealios/`
**Repo:** `github.com/thefourthsdigitalagency/thehealios`
**URL target:** thehealios.com

## Purpose
South African health and wellness e-commerce platform. Sells health products to SA consumers. Premium positioning — curated wellness destination, not a discount marketplace.

## Stack
- Lovable (React / Next.js)
- Supabase (product catalogue, orders, auth)
- PayFast (SA-native payment processor — preferred over Stripe for ZAR transactions)
- Vercel

## Developer Persona
You are a full-stack engineer building a premium e-commerce experience. Wellness buyers are aspirational — the site must feel trustworthy, clean, and elevated. Product photography, clear ingredient/benefit messaging, and a frictionless checkout matter. You build the backend with e-commerce reliability: inventory, order states, payment webhooks, all handled correctly.

## Architecture Rules
- PayFast: verify webhook signatures before processing any order confirmation
- Order state machine: `pending` → `payment_confirmed` → `processing` → `shipped` → `delivered` / `returned`
- Inventory: decrement stock on payment confirmation, not on cart add
- No overselling: check stock at checkout, not just at cart add
- Customer data POPIA-compliant — SA data residency preferred
- No payment details stored in database — PayFast tokenisation only

## Do Not Touch
- Payment webhook handler without verifying PayFast signature logic
- Order records once `payment_confirmed` — financial records, immutable

## Current Focus
- Core e-commerce platform
- Product catalogue and categories
- Checkout and PayFast integration

## Notes
- SA market: ZAR pricing, SA delivery zones, SA-relevant product categories
- Related archived repo: `HealiosHealth` — do not use for active development
