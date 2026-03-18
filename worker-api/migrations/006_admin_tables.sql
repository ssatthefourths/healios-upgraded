-- Migration 006: Admin support tables

-- product_versions: track what changed on each product save
CREATE TABLE IF NOT EXISTS product_versions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id TEXT NOT NULL,
  changed_by TEXT,
  action TEXT NOT NULL DEFAULT 'update',
  changes TEXT,
  previous_values TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_product_versions_product ON product_versions(product_id, changed_at DESC);

-- scheduled_newsletters: newsletter campaign queue
CREATE TABLE IF NOT EXISTS scheduled_newsletters (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TEXT,
  recipients_count INTEGER,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scheduled_newsletters_status ON scheduled_newsletters(status, scheduled_at);

-- admin_audit_log: history of admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_email TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
