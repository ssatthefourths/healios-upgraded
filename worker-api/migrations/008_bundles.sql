-- Migration 008: First-class Bundles
-- Creates dedicated bundles + bundle_items tables, migrates existing
-- bundle-as-product rows into the new structure.

CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    price REAL NOT NULL,
    compare_at_price REAL,
    is_published INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    seo_title TEXT,
    meta_description TEXT,
    stock_quantity INTEGER DEFAULT 100,
    track_inventory INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bundle_items (
    id TEXT PRIMARY KEY,
    bundle_id TEXT NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    UNIQUE (bundle_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON bundle_items(product_id);
CREATE INDEX IF NOT EXISTS idx_bundles_slug ON bundles(slug);
CREATE INDEX IF NOT EXISTS idx_bundles_published ON bundles(is_published);

CREATE TRIGGER IF NOT EXISTS update_bundles_updated_at AFTER UPDATE ON bundles
BEGIN
  UPDATE bundles SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;

-- Data migration: copy existing bundle-as-product rows into bundles table.
-- The `bundle_products` column is a JSON array of product IDs. SQLite's
-- json_each() lets us expand it into rows.
INSERT OR IGNORE INTO bundles (id, name, slug, description, image, price, is_published, sort_order, created_at, updated_at)
SELECT
    'bundle-' || id,
    name,
    slug,
    description,
    image,
    price,
    is_published,
    COALESCE(sort_order, 0),
    created_at,
    updated_at
FROM products
WHERE is_bundle = 1;

INSERT OR IGNORE INTO bundle_items (id, bundle_id, product_id, quantity, sort_order)
SELECT
    lower(hex(randomblob(8))),
    'bundle-' || p.id,
    json_extract(item.value, '$'),
    1,
    item.key
FROM products p, json_each(p.bundle_products) item
WHERE p.is_bundle = 1
  AND p.bundle_products IS NOT NULL
  AND p.bundle_products != '';

-- Hide the original bundle-as-product rows from the catalog.
UPDATE products SET is_published = 0 WHERE is_bundle = 1;
