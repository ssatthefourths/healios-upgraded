-- FTS5 full-text search index over product content.
-- Indexes 9 semantically-rich fields for BM25 ranking + prefix matching.
-- Kept in sync with `products` via AFTER INSERT/UPDATE/DELETE triggers.

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
  tokenize = 'porter unicode61 remove_diacritics 2'
);

-- Initial backfill from existing rows.
INSERT INTO products_fts(
  product_id, name, category, description, hero_paragraph,
  what_is_it, benefits, primary_keyword, secondary_keywords
)
SELECT
  id,
  COALESCE(name, ''),
  COALESCE(category, ''),
  COALESCE(description, ''),
  COALESCE(hero_paragraph, ''),
  COALESCE(what_is_it, ''),
  COALESCE(benefits, ''),
  COALESCE(primary_keyword, ''),
  COALESCE(secondary_keywords, '')
FROM products
WHERE is_published = 1;

-- Keep FTS in lock-step with products.
CREATE TRIGGER products_fts_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(
    product_id, name, category, description, hero_paragraph,
    what_is_it, benefits, primary_keyword, secondary_keywords
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
    COALESCE(new.secondary_keywords, '')
  );
END;

CREATE TRIGGER products_fts_ad AFTER DELETE ON products BEGIN
  DELETE FROM products_fts WHERE product_id = old.id;
END;

CREATE TRIGGER products_fts_au AFTER UPDATE ON products BEGIN
  DELETE FROM products_fts WHERE product_id = old.id;
  INSERT INTO products_fts(
    product_id, name, category, description, hero_paragraph,
    what_is_it, benefits, primary_keyword, secondary_keywords
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
    COALESCE(new.secondary_keywords, '')
  );
END;
