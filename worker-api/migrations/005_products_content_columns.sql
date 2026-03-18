-- Migration 005: Add missing product content, SEO, dietary, and feature columns to D1
-- Existing: id, name, slug, price, image, category, description, stock_quantity,
--           low_stock_threshold, track_inventory, is_published, is_bundle, bundle_products,
--           bundle_discount_percent, pairs_well_with, is_kids_product, is_adults_only,
--           sort_order, created_at, updated_at

-- Long-form content fields
ALTER TABLE products ADD COLUMN hero_paragraph TEXT;
ALTER TABLE products ADD COLUMN what_is_it TEXT;
ALTER TABLE products ADD COLUMN why_gummy TEXT;
ALTER TABLE products ADD COLUMN who_is_it_for TEXT;
ALTER TABLE products ADD COLUMN how_it_works TEXT;
ALTER TABLE products ADD COLUMN how_to_take TEXT;
ALTER TABLE products ADD COLUMN routine_30_day TEXT;
ALTER TABLE products ADD COLUMN what_makes_different TEXT;
ALTER TABLE products ADD COLUMN subscription_info TEXT;
ALTER TABLE products ADD COLUMN safety_info TEXT;
ALTER TABLE products ADD COLUMN product_cautions TEXT;

-- SEO
ALTER TABLE products ADD COLUMN seo_title TEXT;
ALTER TABLE products ADD COLUMN meta_description TEXT;
ALTER TABLE products ADD COLUMN primary_keyword TEXT;
ALTER TABLE products ADD COLUMN secondary_keywords TEXT; -- JSON array

-- JSON array fields
ALTER TABLE products ADD COLUMN benefits TEXT;     -- JSON array
ALTER TABLE products ADD COLUMN ingredients TEXT;  -- JSON array
ALTER TABLE products ADD COLUMN faqs TEXT;         -- JSON array

-- Dietary / lifestyle traits
ALTER TABLE products ADD COLUMN is_vegan INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN is_gluten_free INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN is_sugar_free INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN is_keto_friendly INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN contains_allergens TEXT; -- JSON array

-- Coming soon flag
ALTER TABLE products ADD COLUMN is_coming_soon INTEGER NOT NULL DEFAULT 0;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, is_published);
