-- Migration 010: webhook idempotency table
-- Tracks every Stripe event id the worker has processed so we don't
-- double-fulfill on Stripe retries. Without this table the webhook
-- handler crashes on its first query and Stripe marks the event pending.

CREATE TABLE IF NOT EXISTS processed_webhook_events (
    stripe_event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_created_at
    ON processed_webhook_events(created_at);
