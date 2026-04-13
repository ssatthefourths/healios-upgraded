/**
 * Admin Domain Types
 * These interfaces represent the Cloudflare D1 schema and are used throughout
 * the admin dashboard to ensure type safety without relying on Supabase.
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  role?: 'admin' | 'moderator' | 'user';
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  street_address: string;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  description: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  is_published: boolean;
  is_bundle: boolean;
  bundle_products: string[] | null; // Parsed from JSON
  bundle_discount_percent: number | null;
  pairs_well_with: string[] | null; // Parsed from JSON
  is_kids_product: boolean;
  is_adults_only: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  billing_address: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  discount_code: string | null;
  total: number;
  shipping_method: string | null;
  status: OrderStatus;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_category: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  is_subscription: boolean;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  status: 'pending' | 'approved' | 'rejected';
  image_urls: string[] | null; // Parsed from JSON
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  category_id: string | null;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  seo_title: string | null;
  meta_description: string | null;
  reading_time_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
  newsletterSubscribers: number;
  pendingReviews: number;
  pendingWellnessPosts: number;
  activeDiscounts: number;
  recentOrders: Partial<Order>[];
}
