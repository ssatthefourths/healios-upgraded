-- Generic admin-editable site settings. Key/value table; values are strings
-- (URLs, labels, phone numbers, whatever). Empty string = hidden on the
-- public site. Keys are namespaced ("social.facebook", "trust.trustpilot")
-- so we can add more categories later without schema changes.

CREATE TABLE IF NOT EXISTS site_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT
);

-- Seed the five footer keys. INSERT OR IGNORE so re-running is safe.
INSERT OR IGNORE INTO site_config (key, value) VALUES
  ('social.facebook',    ''),
  ('social.instagram',   ''),
  ('social.tiktok',      ''),
  ('trust.google_business', ''),
  ('trust.trustpilot',   '');
