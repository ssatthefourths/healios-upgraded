-- Admin-curated "intent" phrases that map to products.
-- A user typing "something for headache" hits Magnesium via the phrases,
-- even though "headache" isn't in the product description.
--
-- Two tables so phrases are shared (one phrase, many products) and admin
-- can edit them centrally without touching product rows.

CREATE TABLE IF NOT EXISTS search_phrases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phrase      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS search_phrase_products (
  phrase_id   INTEGER NOT NULL,
  product_id  TEXT NOT NULL,
  PRIMARY KEY (phrase_id, product_id),
  FOREIGN KEY (phrase_id)  REFERENCES search_phrases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)       ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_spp_product ON search_phrase_products(product_id);

-- Extend the existing FTS5 index with a new "phrases" column holding the
-- space-joined phrases for each product. Queries already run against the
-- existing products_fts virtual table — this is an additive column change.
-- SQLite FTS5 doesn't support ALTER on virtual tables, so we rebuild.

DROP TRIGGER IF EXISTS products_fts_ai;
DROP TRIGGER IF EXISTS products_fts_au;
DROP TRIGGER IF EXISTS products_fts_ad;
DROP TABLE IF EXISTS products_fts;

CREATE VIRTUAL TABLE products_fts USING fts5(
  product_id UNINDEXED,
  name,
  category,
  description,
  hero_paragraph,
  what_is_it,
  benefits,
  primary_keyword,
  secondary_keywords,
  phrases,
  tokenize = 'porter unicode61 remove_diacritics 2'
);

-- Backfill.
INSERT INTO products_fts(
  product_id, name, category, description, hero_paragraph,
  what_is_it, benefits, primary_keyword, secondary_keywords, phrases
)
SELECT
  p.id,
  COALESCE(p.name, ''),
  COALESCE(p.category, ''),
  COALESCE(p.description, ''),
  COALESCE(p.hero_paragraph, ''),
  COALESCE(p.what_is_it, ''),
  COALESCE(p.benefits, ''),
  COALESCE(p.primary_keyword, ''),
  COALESCE(p.secondary_keywords, ''),
  COALESCE(
    (SELECT GROUP_CONCAT(sp.phrase, ' ')
       FROM search_phrases sp
       JOIN search_phrase_products spp ON spp.phrase_id = sp.id
      WHERE spp.product_id = p.id),
    ''
  )
FROM products p
WHERE p.is_published = 1;

-- Keep the FTS row in sync with product edits (no phrase handling here —
-- those are re-indexed by the worker after any phrase-mutation endpoint).
CREATE TRIGGER products_fts_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(
    product_id, name, category, description, hero_paragraph,
    what_is_it, benefits, primary_keyword, secondary_keywords, phrases
  )
  VALUES (
    new.id,
    COALESCE(new.name, ''),
    COALESCE(new.category, ''),
    COALESCE(new.description, ''),
    COALESCE(new.hero_paragraph, ''),
    COALESCE(new.what_is_it, ''),
    COALESCE(new.benefits, ''),
    COALESCE(new.primary_keyword, ''),
    COALESCE(new.secondary_keywords, ''),
    ''
  );
END;

CREATE TRIGGER products_fts_ad AFTER DELETE ON products BEGIN
  DELETE FROM products_fts WHERE product_id = old.id;
END;

CREATE TRIGGER products_fts_au AFTER UPDATE ON products BEGIN
  DELETE FROM products_fts WHERE product_id = old.id;
  INSERT INTO products_fts(
    product_id, name, category, description, hero_paragraph,
    what_is_it, benefits, primary_keyword, secondary_keywords, phrases
  )
  VALUES (
    new.id,
    COALESCE(new.name, ''),
    COALESCE(new.category, ''),
    COALESCE(new.description, ''),
    COALESCE(new.hero_paragraph, ''),
    COALESCE(new.what_is_it, ''),
    COALESCE(new.benefits, ''),
    COALESCE(new.primary_keyword, ''),
    COALESCE(new.secondary_keywords, ''),
    COALESCE(
      (SELECT GROUP_CONCAT(sp.phrase, ' ')
         FROM search_phrases sp
         JOIN search_phrase_products spp ON spp.phrase_id = sp.id
        WHERE spp.product_id = new.id),
      ''
    )
  );
END;

-- Seed a starter set of symptom → product mappings. Admin can edit/extend.
-- Using INSERT OR IGNORE so re-running is safe.

INSERT OR IGNORE INTO search_phrases (phrase) VALUES
  ('headache'),
  ('migraine'),
  ('tension'),
  ('muscle cramp'),
  ('muscle pain'),
  ('nerve pain'),
  ('feeling wound up'),
  ('cant sleep'),
  ('insomnia'),
  ('restless nights'),
  ('wind down'),
  ('night time'),
  ('stress'),
  ('anxious'),
  ('overwhelmed'),
  ('cortisol'),
  ('burnout'),
  ('tired'),
  ('fatigue'),
  ('low energy'),
  ('anaemia'),
  ('pale'),
  ('immune'),
  ('immune support'),
  ('cold and flu'),
  ('winter immunity'),
  ('bones'),
  ('vitamin d'),
  ('sunshine'),
  ('focus'),
  ('concentration'),
  ('brain fog'),
  ('memory'),
  ('inflammation'),
  ('joint pain'),
  ('gut'),
  ('bloating'),
  ('digestion'),
  ('probiotic'),
  ('skin'),
  ('glowing skin'),
  ('hair'),
  ('nails'),
  ('collagen'),
  ('beauty'),
  ('pregnancy'),
  ('prenatal'),
  ('folic'),
  ('period'),
  ('kids'),
  ('children'),
  ('vegan');

-- Map each starter phrase to the relevant product IDs.
-- One INSERT per pairing keeps us well under SQLite's 500-compound-SELECT limit.
-- Each statement looks up the phrase_id by name so we don't hardcode ids.

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'headache';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'migraine';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'tension';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'muscle cramp';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'muscle pain';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'nerve pain';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'magnesium-gummies' FROM search_phrases WHERE phrase = 'feeling wound up';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'sleep-support-gummies' FROM search_phrases WHERE phrase = 'cant sleep';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'night-magnesium-gummies' FROM search_phrases WHERE phrase = 'cant sleep';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'sleep-support-gummies' FROM search_phrases WHERE phrase = 'insomnia';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'night-magnesium-gummies' FROM search_phrases WHERE phrase = 'insomnia';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'sleep-support-gummies' FROM search_phrases WHERE phrase = 'restless nights';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'night-magnesium-gummies' FROM search_phrases WHERE phrase = 'restless nights';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'sleep-support-gummies' FROM search_phrases WHERE phrase = 'wind down';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'night-magnesium-gummies' FROM search_phrases WHERE phrase = 'wind down';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'night-magnesium-gummies' FROM search_phrases WHERE phrase = 'night time';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'ashwagandha-gummies' FROM search_phrases WHERE phrase = 'stress';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'ashwagandha-gummies' FROM search_phrases WHERE phrase = 'anxious';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'ashwagandha-gummies' FROM search_phrases WHERE phrase = 'overwhelmed';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'ashwagandha-gummies' FROM search_phrases WHERE phrase = 'cortisol';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'ashwagandha-gummies' FROM search_phrases WHERE phrase = 'burnout';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'iron-vitamin-c-gummies' FROM search_phrases WHERE phrase = 'tired';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'tired';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'iron-vitamin-c-gummies' FROM search_phrases WHERE phrase = 'fatigue';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'fatigue';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'iron-vitamin-c-gummies' FROM search_phrases WHERE phrase = 'low energy';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'low energy';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'iron-vitamin-c-gummies' FROM search_phrases WHERE phrase = 'anaemia';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'iron-vitamin-c-gummies' FROM search_phrases WHERE phrase = 'pale';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'immune';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'immune support';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'cold and flu';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'winter immunity';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'bones';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'vitamin d';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'vitamin-d3-gummies' FROM search_phrases WHERE phrase = 'sunshine';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'lions-mane-gummies' FROM search_phrases WHERE phrase = 'focus';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'lions-mane-gummies' FROM search_phrases WHERE phrase = 'concentration';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'lions-mane-gummies' FROM search_phrases WHERE phrase = 'brain fog';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'lions-mane-gummies' FROM search_phrases WHERE phrase = 'memory';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'turmeric-ginger-gummies' FROM search_phrases WHERE phrase = 'inflammation';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'turmeric-ginger-gummies' FROM search_phrases WHERE phrase = 'joint pain';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'probiotics-vitamins-gummies' FROM search_phrases WHERE phrase = 'gut';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'acv-ginger-gummies' FROM search_phrases WHERE phrase = 'gut';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'acv-ginger-gummies' FROM search_phrases WHERE phrase = 'bloating';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'probiotics-vitamins-gummies' FROM search_phrases WHERE phrase = 'digestion';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'acv-ginger-gummies' FROM search_phrases WHERE phrase = 'digestion';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'probiotics-vitamins-gummies' FROM search_phrases WHERE phrase = 'probiotic';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'collagen-powder' FROM search_phrases WHERE phrase = 'skin';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'halo-glow-collagen' FROM search_phrases WHERE phrase = 'skin';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'hair-skin-nails-gummies' FROM search_phrases WHERE phrase = 'skin';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'halo-glow-collagen' FROM search_phrases WHERE phrase = 'glowing skin';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'collagen-powder' FROM search_phrases WHERE phrase = 'hair';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'hair-skin-nails-gummies' FROM search_phrases WHERE phrase = 'hair';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'collagen-powder' FROM search_phrases WHERE phrase = 'nails';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'hair-skin-nails-gummies' FROM search_phrases WHERE phrase = 'nails';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'collagen-powder' FROM search_phrases WHERE phrase = 'collagen';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'halo-glow-collagen' FROM search_phrases WHERE phrase = 'collagen';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'collagen-powder' FROM search_phrases WHERE phrase = 'beauty';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'halo-glow-collagen' FROM search_phrases WHERE phrase = 'beauty';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'hair-skin-nails-gummies' FROM search_phrases WHERE phrase = 'beauty';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'folic-acid-gummies' FROM search_phrases WHERE phrase = 'pregnancy';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'folic-acid-gummies' FROM search_phrases WHERE phrase = 'prenatal';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'folic-acid-gummies' FROM search_phrases WHERE phrase = 'folic';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'iron-vitamin-c-gummies' FROM search_phrases WHERE phrase = 'period';

INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'kids-multivitamin-gummies' FROM search_phrases WHERE phrase = 'kids';
INSERT OR IGNORE INTO search_phrase_products (phrase_id, product_id) SELECT id, 'kids-multivitamin-gummies' FROM search_phrases WHERE phrase = 'children';

-- Rebuild the phrases column for any products that just got seeded.
UPDATE products_fts
   SET phrases = COALESCE(
     (SELECT GROUP_CONCAT(sp.phrase, ' ')
        FROM search_phrases sp
        JOIN search_phrase_products spp ON spp.phrase_id = sp.id
       WHERE spp.product_id = products_fts.product_id),
     ''
   )
 WHERE product_id IN (SELECT DISTINCT product_id FROM search_phrase_products);
