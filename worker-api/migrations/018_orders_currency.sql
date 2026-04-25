-- Add currency column to orders so the admin can show ZAR / USD / etc.
-- amounts in their original currency instead of falsely formatting them
-- as GBP (ticket #6 in HealiosIssuesFeedback_v3.csv).
--
-- Stripe metadata already carries `currency` (set by checkout.ts:206).
-- This migration adds the column; the next worker deploy populates it on
-- every new order INSERT.
--
-- Historical orders default to GBP since the existing live data was GBP-only
-- before ZAR shipping went live. If/when we identify older ZAR orders, fix
-- them up with a one-off UPDATE statement.

ALTER TABLE orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'GBP';
