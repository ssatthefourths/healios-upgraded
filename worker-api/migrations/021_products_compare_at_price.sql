-- Compare-at price for products — original / RRP price shown struck-through
-- next to the current price on PDP and on every card renderer.
--
-- Per the PDP rework (2026-04-25). Bundles already had a compare_at_price
-- column (BundleGrid.tsx:49). Regular products did not — the only
-- strikethrough on a product was the per-mode subscription discount.
-- Monique wants a permanent compare-at-RRP for promotional pricing.
--
-- Rendering rules: when product.compare_at_price > current price AND the
-- shopper is on one_time mode, render struck-through. Subscription mode
-- keeps its own line-through (subscriptionPrice vs basePrice) — never
-- both at once.
--
-- Idempotent fail-fast: ADD COLUMN errors if re-run; that's fine, the
-- migration is one-shot.

ALTER TABLE products ADD COLUMN compare_at_price REAL;
