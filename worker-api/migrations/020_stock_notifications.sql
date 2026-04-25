-- Stock-notification subscriptions ("Notify me when back in stock").
--
-- Closes a real-functionality gap surfaced by Monique's 2026-04-25 review:
-- the NotifyMeButton on every coming-soon product card was firing failed
-- GETs to /stock_notifications because no table, no route, and no backend
-- trigger existed. Console spam + broken UX (button said yes, nothing
-- happened, customer never got an email).
--
-- Each row links a user to a product. Composite UNIQUE prevents the same
-- user subscribing twice. notified_at is stamped when the back-in-stock
-- email goes out so we can't double-send and we have an audit trail.

CREATE TABLE IF NOT EXISTS stock_notifications (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  product_id   TEXT NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  notified_at  INTEGER,
  UNIQUE(user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Hot path for the customer's "am I subscribed?" check + the per-product
-- send loop in the back-in-stock trigger.
CREATE INDEX IF NOT EXISTS idx_stock_notifications_user
  ON stock_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product_pending
  ON stock_notifications(product_id, notified_at);
