-- Healios D1 Seed Data

INSERT INTO products (id, name, slug, price, image, category, description, sort_order) VALUES
('arcus-bracelet', 'Arcus Bracelet', 'arcus-bracelet', 2450.00, '/arcus-bracelet.png', 'bracelets', 'A sculptural bracelet featuring our signature curved silhouette in polished gold.', 1),
('span-bracelet', 'Span Bracelet', 'span-bracelet', 1850.00, '/span-bracelet.png', 'bracelets', 'Minimalist cuff bracelet with a bold architectural presence.', 2),
('eclipse-ring', 'Eclipse Ring', 'eclipse-ring', 3200.00, '/rings-collection.png', 'rings', 'A statement ring inspired by celestial geometry.', 3),
('halo-pendant', 'Halo Pendant', 'halo-pendant', 2800.00, '/earrings-collection.png', 'necklaces', 'Delicate pendant necklace with a luminous circular motif.', 4),
('lintel-earrings', 'Lintel Earrings', 'lintel-earrings', 1650.00, '/earrings-collection.png', 'earrings', 'Architectural drop earrings with clean geometric lines.', 5),
('oblique-ring', 'Oblique Ring', 'oblique-ring', 2100.00, '/rings-collection.png', 'rings', 'Angular band ring with an asymmetric silhouette.', 6);

-- Add sample categories if needed (though categories are just strings in the products table)

-- Add an admin user (placeholder password hash for 'admin123' or similar)
-- In a real scenario, the user would sign up normally
INSERT INTO users (id, email, password_hash) VALUES 
('admin-user-id', 'admin@thehealios.com', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'); -- sha256 of 'password'

INSERT INTO user_roles (id, user_id, role) VALUES 
('admin-role-id', 'admin-user-id', 'admin');

INSERT INTO profiles (id, first_name, last_name) VALUES 
('admin-user-id', 'Healios', 'Admin');
