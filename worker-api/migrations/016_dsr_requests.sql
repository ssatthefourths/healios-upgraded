-- GDPR / UK-DPA Data-Subject Request tracking.
--
-- Stores user requests for access (Art. 15), erasure (Art. 17), and portability
-- (Art. 20) alongside the admin workflow state. Does NOT store the actual
-- response data (exports are generated on demand and emailed, not persisted
-- here) — this table is the case log.

CREATE TABLE IF NOT EXISTS dsr_requests (
  id             TEXT PRIMARY KEY,        -- UUID
  email          TEXT NOT NULL,           -- requester email (lowercased)
  user_id        TEXT,                    -- populated if the email matches a known user at submit
  request_type   TEXT NOT NULL,           -- 'access' | 'erasure' | 'portability'
  status         TEXT NOT NULL DEFAULT 'pending_verification',
                                          -- 'pending_verification' | 'verified' | 'in_progress' | 'completed' | 'rejected'
  reason         TEXT,                    -- optional free-text context from requester
  verify_token   TEXT,                    -- single-use email-confirmation token (hashed at rest)
  verified_at    INTEGER,                 -- unixepoch when user clicked the confirm link
  submitted_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  completed_at   INTEGER,                 -- when admin marked closed
  completed_by   TEXT,                    -- admin user_id who actioned it
  admin_notes    TEXT,                    -- free-text admin log
  ip_hash        TEXT                     -- hashed client IP at submit (Phase 7 populates; plain NULL until then)
);

CREATE INDEX IF NOT EXISTS idx_dsr_email         ON dsr_requests(email);
CREATE INDEX IF NOT EXISTS idx_dsr_status        ON dsr_requests(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_dsr_verify_token  ON dsr_requests(verify_token);
