# Spec: Shipped → Delivered transition (no courier integration)

**Status:** open spec, awaiting Monique's call.
**Source ticket:** SharePoint Issue tracker list, "Define the Shipped → Delivered
transition when Healios is not integrated with a courier — options for manual
mark, customer-confirm CTA, and future webhook integration" (added 2026‑04‑24).
**Owner of decision:** Monique Sacks (PM) → Mike & Lauren (client).

## Context

The Healios order state machine (per [CLAUDE.md](../CLAUDE.md)) is:

```
pending → payment_confirmed → processing → shipped → delivered / returned
```

Stripe webhook handles `pending → payment_confirmed`. Admin actions handle
`payment_confirmed → processing → shipped`. **The `shipped → delivered`
transition has no automated source today** — Healios is not yet integrated
with a courier (Aramex / Courier Guy / DHL etc.). Until that integration
exists, orders sit in `shipped` indefinitely. This affects:

- Customer trust ("am I getting my parcel?")
- Returns window timing (the 30-day clock starts at delivered, not shipped)
- POPIA retention triggers (some retention rules key off the terminal state)
- Admin reporting (shipped revenue ≠ realised revenue until delivered)

## Three options

### Option A — Admin manual mark (lowest cost)

Admin clicks "Mark delivered" in `/admin/orders` after the customer
acknowledges receipt by phone, email, or assumed (e.g. 7 days after shipped
with no complaint).

| Dimension | Detail |
|---|---|
| Engineering cost | **S** — 1 endpoint + 1 admin button. Pattern matches existing transitions. |
| UX impact | None for the customer. Admin overhead. |
| Audit trail | `order_events.mark_delivered` row stamped with admin user_id. |
| POPIA / retention | Clean — admin user is the documented data subject of the action. |
| Failure mode | Admin forgets → orders stuck in `shipped`. Mitigation: cron job that auto-flips after N days. |

### Option B — Customer-confirm CTA (best UX)

Order shipping email contains a "Confirm received" button → tokenised URL →
public endpoint that flips `shipped → delivered` and records the customer
acknowledgement.

| Dimension | Detail |
|---|---|
| Engineering cost | **M** — 1 worker route, 1 React page, signed token (HMAC like the existing magic-link flow), 1 email template tweak. |
| UX impact | Customer feels in control; reminder email reinforces brand. |
| Audit trail | `order_events.customer_confirmed_delivered` with token signature recorded. |
| POPIA / retention | Customer is the data subject; explicit action; clean. |
| Failure mode | Customer ignores email → still need a fallback. Combine with Option A as fallback or auto-flip cron. |

### Option C — Courier webhook (future-proof, blocked)

When Healios signs a courier (likely Courier Guy or Aramex for SA), wire
their tracking webhook into a worker route that updates the order on
`delivered` events.

| Dimension | Detail |
|---|---|
| Engineering cost | **L** — courier-specific (each vendor has different webhook formats and signatures). Need vendor selection + HMAC verification per vendor. |
| UX impact | Best — automatic, accurate, real-time tracking. |
| Audit trail | Courier event ID + signature + payload hash. |
| POPIA / retention | Courier is a data processor — requires DPA addendum. |
| Failure mode | Courier outage; signature drift on vendor changes. |
| Dependency | Blocked on client signing a courier contract. |

## Recommendation

**Implement A now → add B in next sprint → adopt C when a courier is signed.**

A is a one-day spike that closes the gap immediately. B layers cleanly on
top of A (the admin button still works as a fallback). C only happens when
the client signs a courier; at that point, A and B remain as fallbacks for
manual-handled orders or courier-API outages.

## Concrete next actions (when approved)

1. **A.** Add `markDelivered(orderId)` to [worker-api/src/orders.ts](../worker-api/src/orders.ts).
   New admin row + button in [src/pages/admin/OrdersAdmin.tsx](../src/pages/admin/OrdersAdmin.tsx). Test:
   `POST /admin/orders/:id/deliver` with admin JWT → state transitions and
   `order_events` row inserted.
2. **A safety-net.** Cron worker (daily) that flips orders stuck in
   `shipped` for ≥ 14 days. Configurable via site_config key
   `orders.shipped_to_delivered_grace_days`.
3. **B.** Reusable signed-token utility (mirror existing magic-link signer
   in `worker-api/src/auth.ts`). Public route
   `GET /orders/:id/confirm-delivered?t=<token>` that verifies + transitions
   + redirects to a "Thanks!" page.

## Decision needed from Monique

- Approve A as the immediate fix? (yes / no)
- Acceptable grace period before auto-flip? (default 14 days)
- Approve B for the next sprint, or defer until C is on the roadmap?

This spec lands here so the team has a single source. No code change until
approval.
