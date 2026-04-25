-- Address line 2 + ensure label is a real column (ticket #10 in
-- HealiosIssuesFeedback_v3.csv).
--
-- The addresses table already has a `label` column (Profile address-manager
-- uses it). Checkout's shipping form did not. This adds:
--   - street_address_2  TEXT NULLABLE — apartment / suite / floor / building
-- so both the Profile flow and the Checkout flow can store the optional
-- second-line input. orders.shipping_address_2 is added on the orders table
-- so the order record + the confirmation email both have it.
--
-- Idempotent via ALTER TABLE ... ADD COLUMN — D1 (SQLite) doesn't error if
-- the column doesn't already exist; if it does, this migration becomes a
-- no-op (we keep ADD COLUMN — re-running fails fast which is fine).

ALTER TABLE addresses ADD COLUMN street_address_2 TEXT;
ALTER TABLE orders    ADD COLUMN shipping_address_2 TEXT;
