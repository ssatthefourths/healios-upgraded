-- Healios D1 Wellness Seed Data
-- Run this to populate your database with correct wellness products

-- Clear existing data (Optional, but recommended to fix the jewelry mix-up)
DELETE FROM products;
DELETE FROM users WHERE email = 'admin@thehealios.com';

-- Insert Wellness Products
INSERT INTO products (id, name, slug, price, image, category, description, sort_order, is_published) VALUES
('collagen-powder', 'Healios Collagen Powder', 'collagen-powder', 34.99, '/products/collagen-powder.png', 'Beauty', 'A daily collagen peptide blend designed to support skin appearance, hair strength, nail health, and overall wellness.', 1, 1),
('halo-glow', 'Healios Halo Glow', 'halo-glow', 29.99, '/products/halo-glow-collagen.png', 'Beauty', 'A skin-focused supplement blend formulated to support radiance, hydration, and elasticity from within.', 2, 1),
('magnesium-gummies', 'Healios Magnesium Gummies', 'magnesium-gummies', 19.99, '/products/magnesium-gummies.png', 'Sleep & Relaxation', 'Support muscle function and relaxation with our tasty magnesium gummies.', 3, 1),
('ashwagandha-gummies', 'Healios Ashwagandha Gummies', 'ashwagandha-gummies', 24.99, '/products/ashwagandha-gummies.png', 'Adaptogens', 'Natural stress relief and cognitive support in delicious gummy form.', 4, 1),
('multivitamin-gummies', 'Healios Daily Multi', 'daily-multi', 15.99, '/products/kids-multivitamin-gummies.png', 'Vitamins & Minerals', 'A complete blend of essential vitamins for daily health support.', 5, 1),
('digestive-probiotics', 'Digestive Probiotic', 'digestive-probiotics', 21.99, '/products/probiotics-vitamins-gummies.png', 'Digestive Health', 'Support your gut flora with our high-potency probiotic gummies.', 6, 1);

-- Insert Admin User for testing
INSERT INTO users (id, email, password_hash) VALUES 
('admin-user-id', 'admin@thehealios.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'); -- sha256 of 'password'

INSERT INTO user_roles (id, user_id, role) VALUES 
('admin-role-id', 'admin-user-id', 'admin');

INSERT INTO profiles (id, first_name, last_name) VALUES 
('admin-user-id', 'Healios', 'Admin');
