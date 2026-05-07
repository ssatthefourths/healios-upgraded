-- Migration 022 — eliminate Supabase debt by creating tables backing the
-- frontend's last unmigrated supabase.from(...) and supabase.rpc(...) calls.
-- See docs/HEALIOS_BUG_REPORT_STATUS.md / plan
-- please-check-tickets-on-agile-manatee.md for the inventory.

-- ── Referrals — replaces RPC get_or_create_referral_code + table referrals ──
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id    TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

CREATE TABLE IF NOT EXISTS referrals (
  id               TEXT PRIMARY KEY,
  referrer_id      TEXT NOT NULL,
  referred_email   TEXT,
  referred_user_id TEXT,
  status           TEXT DEFAULT 'pending',
  reward_points    INTEGER DEFAULT 0,
  order_id         TEXT,
  created_at       TEXT DEFAULT (datetime('now')),
  converted_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer  ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status    ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created   ON referrals(created_at);

-- ── Product analytics — replaces table product_analytics ────────────────────
-- Schema is denormalised by (product_id, day) so admin range-queries are a
-- direct WHERE day BETWEEN ?, never a join. Aggregator endpoint sums.
CREATE TABLE IF NOT EXISTS product_analytics (
  product_id  TEXT NOT NULL,
  day         TEXT NOT NULL,
  views       INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  purchases   INTEGER DEFAULT 0,
  PRIMARY KEY (product_id, day)
);
CREATE INDEX IF NOT EXISTS idx_product_analytics_day ON product_analytics(day);

-- ── Email campaigns — replaces table email_campaigns + RPC send-newsletter ──
CREATE TABLE IF NOT EXISTS email_campaigns (
  id          TEXT PRIMARY KEY,
  subject     TEXT NOT NULL,
  body_html   TEXT,
  segment     TEXT,
  recipients  INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'draft',
  sent_at     TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  created_by  TEXT
);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON email_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status  ON email_campaigns(status);

-- ── GDPR Art. 17 deletion audit — replaces RPC delete-account audit trail ──
CREATE TABLE IF NOT EXISTS account_deletion_log (
  user_id     TEXT PRIMARY KEY,
  email_hash  TEXT,
  deleted_at  TEXT DEFAULT (datetime('now')),
  reason      TEXT
);
