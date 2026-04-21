-- Migration 009: Move existing Bundles-category products into the new bundles table.
-- These were created as regular products in the "Bundles" category with no
-- is_bundle flag set. We map each one to a bundle and attach its constituent
-- products based on the description.

INSERT OR IGNORE INTO bundles (id, name, slug, description, image, price, compare_at_price, is_published, sort_order)
SELECT
    'bundle-' || id,
    name,
    slug,
    description,
    image,
    price,
    NULL,
    1,
    COALESCE(sort_order, 0)
FROM products
WHERE category = 'Bundles';

-- Morning Energy Stack: Vitamin D3, Ashwagandha, Lion's Mane
INSERT OR IGNORE INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES
('bi-energy-1', 'bundle-morning-energy-stack', 'vitamin-d3-gummies', 1, 0),
('bi-energy-2', 'bundle-morning-energy-stack', 'ashwagandha-gummies', 1, 1),
('bi-energy-3', 'bundle-morning-energy-stack', 'lions-mane-gummies', 1, 2);

-- Evening Wind-Down Stack: Sleep Support, Magnesium, Turmeric
INSERT OR IGNORE INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES
('bi-calm-1', 'bundle-evening-wind-down-stack', 'sleep-support-gummies', 1, 0),
('bi-calm-2', 'bundle-evening-wind-down-stack', 'night-magnesium-gummies', 1, 1),
('bi-calm-3', 'bundle-evening-wind-down-stack', 'turmeric-ginger-gummies', 1, 2);

-- Immunity Boost Stack: Probiotics, Vitamin D3, Iron
INSERT OR IGNORE INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES
('bi-immune-1', 'bundle-immunity-boost-stack', 'probiotics-vitamins-gummies', 1, 0),
('bi-immune-2', 'bundle-immunity-boost-stack', 'vitamin-d3-gummies', 1, 1),
('bi-immune-3', 'bundle-immunity-boost-stack', 'iron-vitamin-c-gummies', 1, 2);

-- Beauty Glow Stack: Collagen, Halo Glow, Hair Skin & Nails
INSERT OR IGNORE INTO bundle_items (id, bundle_id, product_id, quantity, sort_order) VALUES
('bi-beauty-1', 'bundle-beauty-glow-stack', 'collagen-powder', 1, 0),
('bi-beauty-2', 'bundle-beauty-glow-stack', 'halo-glow-collagen', 1, 1),
('bi-beauty-3', 'bundle-beauty-glow-stack', 'hair-skin-nails-gummies', 1, 2);

-- Now set compare_at_price on each bundle = sum of constituent product prices
UPDATE bundles
SET compare_at_price = (
    SELECT SUM(p.price * bi.quantity)
    FROM bundle_items bi
    JOIN products p ON p.id = bi.product_id
    WHERE bi.bundle_id = bundles.id
)
WHERE id LIKE 'bundle-%';

-- Hide the original bundle-as-product rows so they no longer appear in /category/bundles
UPDATE products SET is_published = 0 WHERE category = 'Bundles';
