-- Order state-machine support: tracking + delivery confirmation columns.
-- Closes tickets #2, #3, #4, #5 in HealiosIssuesFeedback_v3.csv.
--
-- Each transition (processing → shipped → delivered) is captured by a
-- nullable timestamp column so we can audit when an order moved through
-- each stage. Tracking carrier + number are populated by the admin when
-- they mark an order shipped (the "Ready for Shipment" action in #4).
-- delivered_by tells us whether admin or customer marked it.
--
-- All columns are nullable / default-NULL so historical orders keep
-- working without a backfill.

ALTER TABLE orders ADD COLUMN tracking_carrier  TEXT;
ALTER TABLE orders ADD COLUMN tracking_number   TEXT;
ALTER TABLE orders ADD COLUMN tracking_url      TEXT;
ALTER TABLE orders ADD COLUMN processing_at     TEXT;
ALTER TABLE orders ADD COLUMN shipped_at        TEXT;
ALTER TABLE orders ADD COLUMN delivered_at      TEXT;
ALTER TABLE orders ADD COLUMN delivered_by      TEXT;  -- 'admin' | 'customer' | NULL
