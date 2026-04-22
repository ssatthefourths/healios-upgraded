-- Search Console: log → curate → save
-- Logs every search query and click. Lets admin surface top queries,
-- zero-result queries, click-through queries. Admin-authored phrases
-- (from migration 013) get grouped into named configurations so
-- campaigns can toggle sets of phrases without deploy.

-- ── search_events: per-query log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  query         TEXT NOT NULL,
  query_lower   TEXT NOT NULL,
  result_count  INTEGER NOT NULL,
  clicked_id    TEXT,
  visitor_id    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_search_events_created_at  ON search_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_query_lower ON search_events(query_lower);
CREATE INDEX IF NOT EXISTS idx_search_events_visitor     ON search_events(visitor_id);

-- ── search_configs: named phrase groups (campaigns) ──────────────────
CREATE TABLE IF NOT EXISTS search_configs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO search_configs (id, name, description, is_active) VALUES
  (1, 'Always on', 'Baseline phrase mappings — always contribute to search results.', 1);

-- ── Add config_id to search_phrases (defaults to "Always on") ────────
ALTER TABLE search_phrases ADD COLUMN config_id INTEGER DEFAULT 1;
UPDATE search_phrases SET config_id = 1 WHERE config_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_search_phrases_config ON search_phrases(config_id);

-- ── Rebuild FTS phrases column to respect is_active ──────────────────
UPDATE products_fts
   SET phrases = COALESCE(
     (SELECT GROUP_CONCAT(sp.phrase, ' ')
        FROM search_phrases sp
        JOIN search_phrase_products spp ON spp.phrase_id = sp.id
        JOIN search_configs sc          ON sc.id         = sp.config_id
       WHERE spp.product_id = products_fts.product_id
         AND sc.is_active = 1),
     ''
   );
