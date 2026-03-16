-- Healios Cloudflare D1 Schema (SQLite)

-- Users Table (Replaces Supabase Auth)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Profiles Table
CREATE TABLE profiles (
    id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Addresses Table
CREATE TABLE addresses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    street_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'United Kingdom',
    is_default INTEGER DEFAULT 0, -- Boolean as 0/1
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price REAL NOT NULL,
    image TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    track_inventory INTEGER NOT NULL DEFAULT 1, -- Boolean
    is_published INTEGER NOT NULL DEFAULT 1, -- Boolean
    is_bundle INTEGER NOT NULL DEFAULT 0, -- Boolean
    bundle_products TEXT, -- JSON array of IDs
    bundle_discount_percent INTEGER,
    pairs_well_with TEXT, -- JSON array of IDs
    is_kids_product INTEGER NOT NULL DEFAULT 0,
    is_adults_only INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist Table
CREATE TABLE wishlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

-- User Roles Table
CREATE TABLE user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role)
);

-- Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT NOT NULL DEFAULT 'United Kingdom',
    billing_address TEXT,
    billing_city TEXT,
    billing_postal_code TEXT,
    billing_country TEXT,
    subtotal REAL NOT NULL,
    shipping_cost REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    discount_code TEXT,
    total REAL NOT NULL,
    shipping_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    access_token TEXT,
    token_expires_at TEXT,
    invoice_url TEXT,
    review_email_sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    product_category TEXT,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    line_total REAL NOT NULL,
    is_subscription INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product Reviews Table
CREATE TABLE product_reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    image_urls TEXT, -- JSON array
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table (Recurring Orders)
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    price REAL NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'bimonthly', 'quarterly')),
    next_delivery_date TEXT NOT NULL,
    stripe_subscription_id TEXT,
    paused_at TEXT,
    cancelled_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty Points Table
CREATE TABLE loyalty_points (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points_balance INTEGER NOT NULL DEFAULT 0,
    lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Loyalty Transactions Table
CREATE TABLE loyalty_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment')),
    points INTEGER NOT NULL,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Gift Cards Table
CREATE TABLE gift_cards (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    original_amount REAL NOT NULL CHECK (original_amount > 0),
    remaining_balance REAL NOT NULL CHECK (remaining_balance >= 0),
    purchaser_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    purchaser_email TEXT NOT NULL,
    recipient_email TEXT,
    recipient_name TEXT,
    personal_message TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT,
    redeemed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    first_redeemed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Gift Card Transactions Table
CREATE TABLE gift_card_transactions (
    id TEXT PRIMARY KEY,
    gift_card_id TEXT NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    amount REAL NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Blog Categories Table
CREATE TABLE blog_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts Table
CREATE TABLE blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    category_id TEXT REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TEXT,
    seo_title TEXT,
    meta_description TEXT,
    reading_time_minutes INTEGER DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Discount Codes Table
CREATE TABLE discount_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value REAL NOT NULL CHECK (discount_value > 0),
    min_order_amount REAL DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER NOT NULL DEFAULT 0,
    valid_from TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TEXT DEFAULT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Wellness Posts Table (Community)
CREATE TABLE wellness_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    social_link TEXT NOT NULL,
    thumbnail_url TEXT,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TEXT,
    reviewed_by TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter Subscriptions
CREATE TABLE newsletter_subscriptions (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Simple triggers for updated_at (SQLite syntax)
CREATE TRIGGER update_profiles_updated_at AFTER UPDATE ON profiles
BEGIN
  UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;

CREATE TRIGGER update_products_updated_at AFTER UPDATE ON products
BEGIN
  UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;

CREATE TRIGGER update_orders_updated_at AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;

CREATE TRIGGER update_subscriptions_updated_at AFTER UPDATE ON subscriptions
BEGIN
  UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;

-- Indexes for performance
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_email ON orders(email);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
