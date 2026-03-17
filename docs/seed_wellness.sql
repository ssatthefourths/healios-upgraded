-- Healios D1 Wellness Seed Data (Full Catalog)
-- Run this to populate your database with all wellness products

-- Clear existing data
DELETE FROM products;
DELETE FROM users WHERE email = 'admin@thehealios.com';

-- Insert All 18 Wellness Products
INSERT INTO products (id, name, slug, price, image, category, description, sort_order, is_published) VALUES
-- Beauty
('collagen-powder', 'Healios Collagen Powder', 'collagen-powder', 34.99, '/products/halo-glow-collagen.png', 'Beauty', 'A daily collagen peptide blend designed to support skin appearance, hair strength, nail health, and overall wellness.', 1, 1),
('halo-glow-collagen', 'Healios Halo Glow', 'halo-glow', 29.99, '/products/halo-glow-collagen.png', 'Beauty', 'A skin-focused supplement blend formulated to support radiance, hydration, and elasticity from within.', 2, 1),
('hair-skin-nails-gummies', 'Hair, Skin & Nails Gummies', 'hair-skin-nails', 18.99, '/products/hair-skin-nails-gummies.png', 'Beauty', 'Essential nutrients to support your natural beauty from the inside out.', 3, 1),

-- Vitamins & Minerals
('vitamin-d3-gummies', 'Vitamin D3 4000 IU Gummies', 'vitamin-d3', 14.99, '/products/vitamin-d3-gummies.png', 'Vitamins & Minerals', 'High-strength Vitamin D3 to support immune health and bone strength.', 4, 1),
('magnesium-gummies', 'Healios Magnesium Gummies', 'magnesium-gummies', 19.99, '/products/magnesium-gummies.png', 'Vitamins & Minerals', 'Support muscle function and relaxation with our tasty magnesium gummies.', 5, 1),
('iron-vitamin-c-gummies', 'Iron & Vitamin C Gummies', 'iron-vit-c', 15.99, '/products/iron-vitamin-c-gummies.png', 'Vitamins & Minerals', 'A powerful duo for energy support and cognitive function.', 6, 1),
('folic-acid-gummies', 'Folic Acid Gummies', 'folic-acid', 12.99, '/products/folic-acid-gummies.png', 'Vitamins & Minerals', 'Support maternal health and cellular energy with our prenatal-friendly gummies.', 7, 1),
('kids-multivitamin-gummies', 'Kids Daily Multi Gummies', 'kids-multi', 14.99, '/products/kids-multivitamin-gummies.png', 'Vitamins & Minerals', 'Essential vitamins for growing bodies in a kid-approved gummy format.', 8, 1),

-- Adaptogens
('ashwagandha-gummies', 'Healios Ashwagandha Gummies', 'ashwagandha-gummies', 24.99, '/products/ashwagandha-gummies.png', 'Adaptogens', 'Natural stress relief and cognitive support in delicious gummy form.', 9, 1),
('lions-mane-gummies', 'Lion''s Mane Gummies', 'lions-mane', 21.99, '/products/lions-mane-gummies.png', 'Adaptogens', 'Support focus, memory, and cognitive performance naturally.', 10, 1),
('turmeric-ginger-gummies', 'Turmeric & Ginger Gummies', 'turmeric-ginger', 17.99, '/products/turmeric-ginger-gummies.png', 'Adaptogens', 'Natural anti-inflammatory support for joint health and recovery.', 11, 1),

-- Sleep & Relaxation
('sleep-support-gummies', 'Sleep Support Gummies', 'sleep-support', 16.99, '/products/sleep-support-gummies.png', 'Sleep & Relaxation', 'Fall asleep faster and wake up refreshed with our soothing herb blend.', 12, 1),
('night-magnesium-gummies', 'Night-Time Magnesium', 'night-magnesium', 20.99, '/products/night-magnesium-gummies.png', 'Sleep & Relaxation', 'Deep relaxation Magnesium formulated specifically for evening routines.', 13, 1),

-- Digestive Health
('acv-ginger-gummies', 'ACV & Ginger Gummies', 'acv-ginger', 15.99, '/products/acv-ginger-gummies.png', 'Digestive Health', 'Support gut health and metabolism with the power of Apple Cider Vinegar.', 14, 1),
('probiotics-vitamins-gummies', 'Probiotic + Vitamin Mix', 'probiotic-multi', 22.99, '/products/probiotics-vitamins-gummies.png', 'Digestive Health', 'A multi-strain probiotic blend to balance your gut microbiome.', 15, 1),

-- Bundles & Stacks
('morning-energy-stack', 'Morning Energy Stack', 'energy-stack', 49.99, '/products/morning-energy-stack.png', 'Bundles', 'The ultimate morning routine: Vitamin D3, Ashwagandha, and Lion''s Mane.', 16, 1),
('evening-wind-down-stack', 'Evening Wind-Down Stack', 'calm-stack', 44.99, '/products/evening-wind-down-stack.png', 'Bundles', 'Relax and reset: Sleep Support, Magnesium, and Turmeric.', 17, 1),
('immunity-boost-stack', 'Immunity Boost Stack', 'immune-stack', 39.99, '/products/immunity-boost-stack.png', 'Bundles', 'Shield your health: Probiotics, Vitamin D3, and Iron.', 18, 1),
('beauty-glow-stack', 'Beauty Glow Stack', 'beauty-stack', 54.99, '/products/beauty-glow-stack.png', 'Bundles', 'Radiance from within: Collagen, Halo Glow, and Hair & Nails.', 19, 1);

-- Insert Admin User
INSERT INTO users (id, email, password_hash) VALUES 
('admin-user-id', 'admin@thehealios.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');

INSERT INTO user_roles (id, user_id, role) VALUES 
('admin-role-id', 'admin-user-id', 'admin');

INSERT INTO profiles (id, first_name, last_name) VALUES 
('admin-user-id', 'Healios', 'Admin');
