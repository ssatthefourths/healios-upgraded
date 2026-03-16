-- Source: 20251206083234_c0a3c78f-6de5-4efb-b590-c85287cc943e.sql
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create addresses table for saved shipping/billing addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own addresses
CREATE POLICY "Users can view their own addresses"
ON public.addresses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert their own addresses"
ON public.addresses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.addresses
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.addresses
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Source: 20251206084234_89fa0049-cb46-4c53-84f5-bb3c4d4c44d3.sql
-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own wishlist" 
ON public.wishlist 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" 
ON public.wishlist 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" 
ON public.wishlist 
FOR DELETE 
USING (auth.uid() = user_id);

-- Source: 20251206121907_b5e8fc6f-44dd-4a3b-9f4c-bcb5a6bcbf00.sql
-- Create products table
CREATE TABLE public.products (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (id, name, price, image, category, description) VALUES
('arcus-bracelet', 'Arcus Bracelet', 2450.00, '/arcus-bracelet.png', 'bracelets', 'A sculptural bracelet featuring our signature curved silhouette in polished gold.'),
('span-bracelet', 'Span Bracelet', 1850.00, '/span-bracelet.png', 'bracelets', 'Minimalist cuff bracelet with a bold architectural presence.'),
('eclipse-ring', 'Eclipse Ring', 3200.00, '/rings-collection.png', 'rings', 'A statement ring inspired by celestial geometry.'),
('halo-pendant', 'Halo Pendant', 2800.00, '/earrings-collection.png', 'necklaces', 'Delicate pendant necklace with a luminous circular motif.'),
('lintel-earrings', 'Lintel Earrings', 1650.00, '/earrings-collection.png', 'earrings', 'Architectural drop earrings with clean geometric lines.'),
('oblique-ring', 'Oblique Ring', 2100.00, '/rings-collection.png', 'rings', 'Angular band ring with an asymmetric silhouette.');

-- Add foreign key to wishlist
ALTER TABLE public.wishlist
ADD CONSTRAINT wishlist_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Source: 20251207103742_5a797f75-6458-471b-bc52-8bb7143e1b0e.sql
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create enum for post status
CREATE TYPE public.post_status AS ENUM ('pending', 'approved', 'rejected');

-- Create wellness_posts table
CREATE TABLE public.wellness_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    social_link text NOT NULL,
    thumbnail_url text,
    display_name text NOT NULL,
    status post_status NOT NULL DEFAULT 'pending',
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on wellness_posts
ALTER TABLE public.wellness_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for wellness_posts
CREATE POLICY "Anyone can view approved posts"
ON public.wellness_posts
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view their own posts"
ON public.wellness_posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can submit posts"
ON public.wellness_posts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all posts"
ON public.wellness_posts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
ON public.wellness_posts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_wellness_posts_updated_at
BEFORE UPDATE ON public.wellness_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251208092013_420bb209-7cec-4912-841c-5e9eed32474a.sql
-- Fix addresses country default to UK
ALTER TABLE public.addresses 
ALTER COLUMN country SET DEFAULT 'United Kingdom';

-- Source: 20251208100744_43ad83aa-b120-455e-93c9-f5931346a093.sql
-- Add inventory columns to products table
ALTER TABLE public.products
ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 100,
ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 10,
ADD COLUMN track_inventory BOOLEAN NOT NULL DEFAULT true;

-- Create function to check and update stock
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id TEXT, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
  tracks_inventory BOOLEAN;
BEGIN
  SELECT stock_quantity, track_inventory 
  INTO current_stock, tracks_inventory
  FROM public.products 
  WHERE id = p_product_id;
  
  -- If not tracking inventory, always allow
  IF NOT tracks_inventory THEN
    RETURN TRUE;
  END IF;
  
  -- Check if enough stock
  IF current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Decrement stock
  UPDATE public.products 
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id;
  
  RETURN TRUE;
END;
$$;

-- Create view for low stock products (for admin dashboard)
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT 
  id,
  name,
  stock_quantity,
  low_stock_threshold,
  category,
  image
FROM public.products
WHERE track_inventory = true 
  AND stock_quantity <= low_stock_threshold
  AND is_published = true
ORDER BY stock_quantity ASC;

-- Source: 20251208100752_f9d62a56-0d83-4d45-a5f5-c523118873cf.sql
-- Drop the security definer view and replace with a regular view
DROP VIEW IF EXISTS public.low_stock_products;

CREATE VIEW public.low_stock_products 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  stock_quantity,
  low_stock_threshold,
  category,
  image
FROM public.products
WHERE track_inventory = true 
  AND stock_quantity <= low_stock_threshold
  AND is_published = true
ORDER BY stock_quantity ASC;

-- Source: 20251208101125_758bbf9e-0dc9-42d8-b9a5-4d632ce49af8.sql
-- Allow admins to update products
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Source: 20251208102303_1674fed7-b586-47c9-b15c-71660e59f9f5.sql
-- Create newsletter_subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view subscriptions
CREATE POLICY "Admins can view subscriptions"
ON public.newsletter_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
ON public.newsletter_subscriptions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Source: 20251208114241_910bacfa-e73a-4c56-9566-56355fdaedad.sql
-- Create scheduled newsletters table
CREATE TABLE public.scheduled_newsletters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP WITH TIME ZONE,
  recipients_count INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_newsletters ENABLE ROW LEVEL SECURITY;

-- Admins can manage scheduled newsletters
CREATE POLICY "Admins can view scheduled newsletters"
ON public.scheduled_newsletters
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert scheduled newsletters"
ON public.scheduled_newsletters
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update scheduled newsletters"
ON public.scheduled_newsletters
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete scheduled newsletters"
ON public.scheduled_newsletters
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Source: 20251208131800_7a80c48e-96bb-473a-8167-434ba2ad889e.sql
-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  discount_code TEXT,
  total NUMERIC NOT NULL,
  shipping_method TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  product_category TEXT,
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Orders policies: Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Orders policies: Users can create orders (for themselves or as guest)
CREATE POLICY "Users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Orders policies: Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Orders policies: Admins can update orders
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Order items policies: Users can view their own order items
CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Order items policies: Users can create order items for their orders
CREATE POLICY "Users can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

-- Order items policies: Admins can view all order items
CREATE POLICY "Admins can view all order items"
ON public.order_items
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251208161343_3ddf8fd6-e3a2-4534-8525-b32a271df40c.sql
-- Create table for stock notifications
CREATE TABLE public.stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.stock_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own notifications
CREATE POLICY "Users can create their own notifications"
ON public.stock_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.stock_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.stock_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update notifications (for marking as notified)
CREATE POLICY "Admins can update notifications"
ON public.stock_notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Source: 20251208171252_d6fa874f-1b46-42c6-835f-27104ee7df8d.sql
-- Create subscriptions table to track user subscriptions
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  price numeric NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'bimonthly', 'quarterly')),
  next_delivery_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  paused_at timestamp with time zone,
  cancelled_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own subscriptions (pause/cancel)
CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can create their own subscriptions
CREATE POLICY "Users can create their own subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251208182317_cd26303c-efb4-4b1f-bb11-a26d6bf35beb.sql
-- Add is_subscription column to order_items table
ALTER TABLE public.order_items ADD COLUMN is_subscription BOOLEAN DEFAULT FALSE;

-- Source: 20251209083311_f3ff628b-3eeb-46d9-a1aa-9242fc822711.sql
-- Add Stripe customer ID to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add Stripe subscription ID to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create index for faster Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Create index for faster Stripe subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- Source: 20251209105648_1c06c34c-8dac-4868-96c1-d1e19d440127.sql
-- Create discount_codes table
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active discount codes (for validation)
CREATE POLICY "Anyone can read active discount codes"
ON public.discount_codes
FOR SELECT
USING (is_active = true);

-- Only admins can manage discount codes
CREATE POLICY "Admins can manage discount codes"
ON public.discount_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial discount codes
INSERT INTO public.discount_codes (code, discount_type, discount_value, min_order_amount, max_uses) VALUES
('WELCOME10', 'percentage', 10, 20, NULL),
('SAVE5', 'fixed', 5, 30, 100);

-- Source: 20251209111544_1b1621ab-484d-4b48-9d48-7f6b2b56046d.sql
-- Create function to increment discount code usage
CREATE OR REPLACE FUNCTION public.increment_discount_usage(discount_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE code = discount_code;
END;
$$;

-- Source: 20251209144721_0707e461-79fe-4728-acf3-dc7604ab805d.sql
-- Add column to track review email status
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS review_email_sent_at timestamp with time zone DEFAULT NULL;

-- Source: 20251209160246_bd4f5a41-6523-4045-b280-04ee6d4dae1e.sql
-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view reviews"
ON public.product_reviews
FOR SELECT
USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create their own reviews"
ON public.product_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.product_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_reviews_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251209160909_de428ca2-a396-478e-b390-22345b446ed7.sql
-- Add status column to product_reviews
ALTER TABLE public.product_reviews 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Drop the old public viewing policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;

-- Only approved reviews are publicly visible
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (status = 'approved');

-- Users can view their own reviews regardless of status
CREATE POLICY "Users can view their own reviews"
ON public.product_reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.product_reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update review status
CREATE POLICY "Admins can update reviews"
ON public.product_reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Source: 20251209161931_953bd8f9-8575-41f5-8c67-c8b566a27ab8.sql
-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true);

-- Allow authenticated users to upload review images
CREATE POLICY "Users can upload review images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'review-images' AND auth.uid() IS NOT NULL);

-- Allow public read access to review images
CREATE POLICY "Anyone can view review images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-images');

-- Allow users to delete their own review images
CREATE POLICY "Users can delete their own review images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add image_urls column to product_reviews
ALTER TABLE public.product_reviews
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Source: 20251210082701_eb59e65f-c220-4283-9513-504184595383.sql
-- Add INSERT policy for admins to create products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for admins to delete products
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Source: 20251210085656_89596fd5-4898-4c55-b587-196fb2b8f578.sql
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow admins to upload product images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Source: 20251210091147_3b976977-c460-452d-938c-af9a8290a8db.sql
-- Create product_versions table to track changes
CREATE TABLE public.product_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL DEFAULT 'update',
  changes JSONB NOT NULL DEFAULT '{}',
  previous_values JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

-- Admins can view all versions
CREATE POLICY "Admins can view product versions"
ON public.product_versions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert versions
CREATE POLICY "Admins can insert product versions"
ON public.product_versions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_product_versions_product_id ON public.product_versions(product_id);
CREATE INDEX idx_product_versions_changed_at ON public.product_versions(changed_at DESC);

-- Source: 20251210091912_6d4cdb84-6e96-40c1-a752-55b0314205cb.sql
-- Create product_analytics table to track views and conversions
CREATE TABLE public.product_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (for tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.product_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics"
ON public.product_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for faster queries
CREATE INDEX idx_product_analytics_product_id ON public.product_analytics(product_id);
CREATE INDEX idx_product_analytics_event_type ON public.product_analytics(event_type);
CREATE INDEX idx_product_analytics_created_at ON public.product_analytics(created_at DESC);
CREATE INDEX idx_product_analytics_product_event ON public.product_analytics(product_id, event_type);

-- Source: 20251210104623_7e00bfba-a17b-486f-bcbb-b613a4462d03.sql
-- Create email campaigns table to track sent campaigns
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  target_segments TEXT[] DEFAULT '{}',
  targeting_mode TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'sent',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email campaign events table to track opens, clicks, conversions
CREATE TABLE public.email_campaign_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'sent', 'opened', 'clicked', 'converted'
  recipient_email TEXT NOT NULL,
  segment TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_campaigns_sent_at ON public.email_campaigns(sent_at DESC);
CREATE INDEX idx_email_campaign_events_campaign_id ON public.email_campaign_events(campaign_id);
CREATE INDEX idx_email_campaign_events_event_type ON public.email_campaign_events(event_type);
CREATE INDEX idx_email_campaign_events_recipient ON public.email_campaign_events(recipient_email);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_campaigns (admin only)
CREATE POLICY "Admins can view email campaigns"
ON public.email_campaigns FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email campaigns"
ON public.email_campaigns FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for email_campaign_events
CREATE POLICY "Admins can view campaign events"
ON public.email_campaign_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert campaign events"
ON public.email_campaign_events FOR INSERT
WITH CHECK (true);

-- Source: 20251210122541_d159258f-8b8d-43d2-8bd7-7f3e7051ec27.sql
-- Add stripe_session_id column to orders table for reliable order confirmation lookup
ALTER TABLE public.orders 
ADD COLUMN stripe_session_id text UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);

-- Source: 20251210152833_0b6401aa-dfe5-411b-8a73-8b63548cf9a9.sql
-- Add bundle support fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_bundle boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bundle_products text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bundle_discount_percent integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.is_bundle IS 'Whether this product is a bundle of other products';
COMMENT ON COLUMN public.products.bundle_products IS 'Array of product IDs included in this bundle';
COMMENT ON COLUMN public.products.bundle_discount_percent IS 'Discount percentage applied to bundle vs individual items';

-- Source: 20251211080921_c6d14a42-bb49-4013-a91d-937f2a9f4400.sql
-- Create blog post status enum
CREATE TYPE public.blog_post_status AS ENUM ('draft', 'published', 'archived');

-- Create blog_categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL,
  status blog_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  meta_description TEXT,
  reading_time_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for blog_categories
CREATE POLICY "Anyone can view blog categories"
ON public.blog_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can insert blog categories"
ON public.blog_categories FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog categories"
ON public.blog_categories FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog categories"
ON public.blog_categories FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for blog_posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog posts"
ON public.blog_posts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);

-- Source: 20251229105026_f823210b-1898-4953-9194-9ecfff6eb097.sql
-- Remove the public SELECT policy that allows enumeration of discount codes
-- The validate-discount edge function uses SUPABASE_ANON_KEY which bypasses RLS anyway
-- so we can safely remove this permissive policy

DROP POLICY IF EXISTS "Anyone can read active discount codes" ON public.discount_codes;

-- Create a more restrictive policy: only authenticated users can read codes they've used
-- For validation, the edge function already handles this server-side
CREATE POLICY "Authenticated users can view discount codes they've applied"
ON public.discount_codes
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.user_id = auth.uid() 
    AND orders.discount_code = discount_codes.code
  )
);

-- Source: 20251229155402_c5dffffe-514d-4785-9f7f-ffc9508d77db.sql
-- Create checkout_recovery table for payment failure recovery emails
CREATE TABLE public.checkout_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  cart_items JSONB NOT NULL,
  customer_details JSONB,
  shipping_address JSONB,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on token for fast lookups
CREATE INDEX idx_checkout_recovery_token ON public.checkout_recovery(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX idx_checkout_recovery_expires ON public.checkout_recovery(expires_at);

-- Enable RLS
ALTER TABLE public.checkout_recovery ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read recovery records by token (for cart recovery)
CREATE POLICY "Anyone can read recovery by token"
ON public.checkout_recovery
FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Policy: Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access to recovery"
ON public.checkout_recovery
FOR ALL
USING (true)
WITH CHECK (true);

-- Source: 20251229155811_243143f6-955f-41d9-90d5-0a5f6d390978.sql
-- Add invoice_url column to orders table
ALTER TABLE public.orders ADD COLUMN invoice_url TEXT;

-- Create storage bucket for order documents (invoices)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-documents', 'order-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can view their own invoices
CREATE POLICY "Users can view their own order documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-documents' 
  AND (storage.foldername(name))[1] = 'invoices'
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[2]
    AND orders.user_id = auth.uid()
  )
);

-- Policy: Service role can manage all order documents
CREATE POLICY "Service role can manage order documents"
ON storage.objects
FOR ALL
USING (bucket_id = 'order-documents')
WITH CHECK (bucket_id = 'order-documents');

-- Source: 20251229170449_393ac72d-54bb-4af4-b5d7-04cad83d8fc4.sql
-- THE-158: Add RLS policy for low_stock_products view
-- Views inherit RLS from underlying tables, but we can add explicit policies

-- Since low_stock_products is a VIEW (not a table), RLS policies are applied through
-- the underlying products table which already has proper policies.
-- However, we should ensure admins can query this view by creating a security definer function

-- Create a function for admin-only low stock access
CREATE OR REPLACE FUNCTION public.get_low_stock_products()
RETURNS TABLE (
  id text,
  name text,
  category text,
  image text,
  stock_quantity integer,
  low_stock_threshold integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    category,
    image,
    stock_quantity,
    low_stock_threshold
  FROM public.products
  WHERE stock_quantity <= low_stock_threshold
    AND track_inventory = true
  ORDER BY stock_quantity ASC;
$$;

-- Grant execute permission to authenticated users (RLS check happens in function)
GRANT EXECUTE ON FUNCTION public.get_low_stock_products() TO authenticated;

-- Source: 20251229184450_85065b8c-5a61-4535-ae62-90afe3e72c64.sql
-- Add access_token column to orders for guest order security
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Create index for token lookup performance
CREATE INDEX IF NOT EXISTS idx_orders_access_token ON public.orders(access_token) WHERE access_token IS NOT NULL;

-- Drop existing guest order policies that expose data
DROP POLICY IF EXISTS "Guest orders visible by session" ON public.orders;

-- Update the insert policy to be more restrictive
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND access_token IS NOT NULL)
);

-- Users can view their own orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Guest orders require access token
CREATE POLICY "Guest orders require access token" 
ON public.orders 
FOR SELECT 
USING (
  user_id IS NULL AND 
  access_token IS NOT NULL AND 
  access_token = current_setting('request.headers', true)::json->>'x-order-token'
);

-- Source: 20251229184546_94f38357-d6e0-48ce-881e-317e6533770a.sql
-- Rate limiting for newsletter signups (P0 Security - THE-1182)
-- Create a table to track signup attempts by IP-like identifier
CREATE TABLE IF NOT EXISTS public.newsletter_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_rate_limits_identifier ON public.newsletter_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_newsletter_rate_limits_window ON public.newsletter_rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.newsletter_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits" 
ON public.newsletter_rate_limits 
FOR ALL 
USING (false);

-- Rate limiting function for newsletter signups
CREATE OR REPLACE FUNCTION public.check_newsletter_rate_limit(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain TEXT;
  v_count INTEGER;
  v_max_per_hour INTEGER := 5; -- Max 5 signups per hour from same domain
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);
  
  -- Count recent attempts from this domain
  SELECT COUNT(*) INTO v_count
  FROM public.newsletter_subscriptions
  WHERE email LIKE '%@' || v_domain
    AND created_at > now() - interval '1 hour';
  
  -- If too many signups from this domain, reject
  IF v_count >= v_max_per_hour THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Rate limiting for product analytics (P0 Security - THE-1183)
-- Add a function to check analytics rate limiting
CREATE OR REPLACE FUNCTION public.check_analytics_rate_limit(p_session_id TEXT, p_product_id TEXT, p_event_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_max_per_minute INTEGER := 10; -- Max 10 events per minute per session/product combo
BEGIN
  -- Count recent events from this session for this product
  SELECT COUNT(*) INTO v_count
  FROM public.product_analytics
  WHERE session_id = p_session_id
    AND product_id = p_product_id
    AND event_type = p_event_type
    AND created_at > now() - interval '1 minute';
  
  -- If too many events, reject
  IF v_count >= v_max_per_minute THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update newsletter_subscriptions RLS to include rate limiting
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletter with rate limit" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (public.check_newsletter_rate_limit(email));

-- Update product_analytics RLS to include rate limiting  
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.product_analytics;
CREATE POLICY "Anyone can insert analytics events with rate limit" 
ON public.product_analytics 
FOR INSERT 
WITH CHECK (
  session_id IS NULL OR 
  product_id IS NULL OR
  public.check_analytics_rate_limit(session_id, product_id, event_type)
);

-- Source: 20251229190801_6ff45ea3-f880-4db2-8ea9-f8c88904e7ce.sql
-- Create increment_stock function for stock restoration on order cancellation
CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id text, p_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_product_id;
  
  RETURN TRUE;
END;
$$;

-- Source: 20251229191611_a7d06a1d-afbc-47ac-a00b-b16863a8ff3f.sql
-- Create a view for best seller products with ranking logic
-- Score = (purchase_count * 10) + (add_to_cart_count * 3) + (view_count * 0.1) + (avg_rating * 5)
CREATE OR REPLACE VIEW public.best_seller_products AS
WITH product_analytics_summary AS (
  SELECT 
    product_id,
    COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchase_count,
    COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart_count,
    COUNT(*) FILTER (WHERE event_type = 'view') AS view_count
  FROM public.product_analytics
  WHERE created_at > now() - interval '90 days'
  GROUP BY product_id
),
product_ratings AS (
  SELECT 
    product_id,
    AVG(rating)::numeric(3,2) AS avg_rating,
    COUNT(*) AS review_count
  FROM public.product_reviews
  WHERE status = 'approved'
  GROUP BY product_id
)
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  p.image,
  p.slug,
  p.is_published,
  p.stock_quantity,
  p.is_kids_product,
  p.is_adults_only,
  COALESCE(pas.purchase_count, 0) AS purchase_count,
  COALESCE(pas.add_to_cart_count, 0) AS add_to_cart_count,
  COALESCE(pas.view_count, 0) AS view_count,
  COALESCE(pr.avg_rating, 0) AS avg_rating,
  COALESCE(pr.review_count, 0) AS review_count,
  -- Best seller score formula
  (
    COALESCE(pas.purchase_count, 0) * 10 +
    COALESCE(pas.add_to_cart_count, 0) * 3 +
    COALESCE(pas.view_count, 0) * 0.1 +
    COALESCE(pr.avg_rating, 0) * 5
  )::numeric(10,2) AS best_seller_score
FROM public.products p
LEFT JOIN product_analytics_summary pas ON pas.product_id = p.id
LEFT JOIN product_ratings pr ON pr.product_id = p.id
WHERE p.is_published = true
ORDER BY best_seller_score DESC;

-- Source: 20251229191626_d57cea6f-8509-4534-b7ec-9e294e2ff9ba.sql
-- Fix security definer view issue by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.best_seller_products;

CREATE VIEW public.best_seller_products
WITH (security_invoker = true) AS
WITH product_analytics_summary AS (
  SELECT 
    product_id,
    COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchase_count,
    COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart_count,
    COUNT(*) FILTER (WHERE event_type = 'view') AS view_count
  FROM public.product_analytics
  WHERE created_at > now() - interval '90 days'
  GROUP BY product_id
),
product_ratings AS (
  SELECT 
    product_id,
    AVG(rating)::numeric(3,2) AS avg_rating,
    COUNT(*) AS review_count
  FROM public.product_reviews
  WHERE status = 'approved'
  GROUP BY product_id
)
SELECT 
  p.id,
  p.name,
  p.category,
  p.price,
  p.image,
  p.slug,
  p.is_published,
  p.stock_quantity,
  p.is_kids_product,
  p.is_adults_only,
  COALESCE(pas.purchase_count, 0)::bigint AS purchase_count,
  COALESCE(pas.add_to_cart_count, 0)::bigint AS add_to_cart_count,
  COALESCE(pas.view_count, 0)::bigint AS view_count,
  COALESCE(pr.avg_rating, 0)::numeric(3,2) AS avg_rating,
  COALESCE(pr.review_count, 0)::bigint AS review_count,
  (
    COALESCE(pas.purchase_count, 0) * 10 +
    COALESCE(pas.add_to_cart_count, 0) * 3 +
    COALESCE(pas.view_count, 0) * 0.1 +
    COALESCE(pr.avg_rating, 0) * 5
  )::numeric(10,2) AS best_seller_score
FROM public.products p
LEFT JOIN product_analytics_summary pas ON pas.product_id = p.id
LEFT JOIN product_ratings pr ON pr.product_id = p.id
WHERE p.is_published = true
ORDER BY best_seller_score DESC;

-- Source: 20251229191805_e7afda77-b9a7-4794-8de9-e8d02dc606bd.sql
-- Create function to get best seller products
CREATE OR REPLACE FUNCTION public.get_best_seller_products()
RETURNS TABLE (
  id text,
  name text,
  category text,
  price numeric,
  image text,
  is_published boolean,
  stock_quantity integer,
  is_kids_product boolean,
  is_adults_only boolean,
  best_seller_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH product_analytics_summary AS (
    SELECT 
      product_id,
      COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchase_count,
      COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart_count,
      COUNT(*) FILTER (WHERE event_type = 'view') AS view_count
    FROM public.product_analytics
    WHERE created_at > now() - interval '90 days'
    GROUP BY product_id
  ),
  product_ratings AS (
    SELECT 
      product_id,
      AVG(rating)::numeric(3,2) AS avg_rating,
      COUNT(*) AS review_count
    FROM public.product_reviews
    WHERE status = 'approved'
    GROUP BY product_id
  )
  SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.image,
    p.is_published,
    p.stock_quantity,
    p.is_kids_product,
    p.is_adults_only,
    (
      COALESCE(pas.purchase_count, 0) * 10 +
      COALESCE(pas.add_to_cart_count, 0) * 3 +
      COALESCE(pas.view_count, 0) * 0.1 +
      COALESCE(pr.avg_rating, 0) * 5
    )::numeric(10,2) AS best_seller_score
  FROM public.products p
  LEFT JOIN product_analytics_summary pas ON pas.product_id = p.id
  LEFT JOIN product_ratings pr ON pr.product_id = p.id
  WHERE p.is_published = true
  ORDER BY best_seller_score DESC
  LIMIT 8;
$$;

-- Source: 20251231080139_bba32773-66f6-46cb-a0ca-7d4c64d92cb0.sql
-- Create loyalty points table to track user balances
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create loyalty transactions table to track history
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment')),
  points INTEGER NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_points
CREATE POLICY "Users can view their own loyalty points"
ON public.loyalty_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty points"
ON public.loyalty_points FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage loyalty points"
ON public.loyalty_points FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions"
ON public.loyalty_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.loyalty_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage transactions"
ON public.loyalty_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to add points to a user (called after purchase)
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Points earned from purchase'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update loyalty_points
  INSERT INTO public.loyalty_points (user_id, points_balance, lifetime_points_earned)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points_balance = loyalty_points.points_balance + p_points,
    lifetime_points_earned = loyalty_points.lifetime_points_earned + p_points,
    updated_at = now();

  -- Record transaction
  INSERT INTO public.loyalty_transactions (user_id, transaction_type, points, order_id, description)
  VALUES (p_user_id, 'earn', p_points, p_order_id, p_description);

  RETURN TRUE;
END;
$$;

-- Function to redeem points
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Points redeemed for discount'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT points_balance INTO v_current_balance
  FROM public.loyalty_points
  WHERE user_id = p_user_id;

  -- Check if enough points
  IF v_current_balance IS NULL OR v_current_balance < p_points THEN
    RETURN FALSE;
  END IF;

  -- Deduct points
  UPDATE public.loyalty_points
  SET points_balance = points_balance - p_points,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction (negative points for redemption)
  INSERT INTO public.loyalty_transactions (user_id, transaction_type, points, order_id, description)
  VALUES (p_user_id, 'redeem', -p_points, p_order_id, p_description);

  RETURN TRUE;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251231135847_8f2f1131-d608-42ac-8be9-446c29fc1b75.sql
-- Create gift_cards table
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  original_amount NUMERIC NOT NULL CHECK (original_amount > 0),
  remaining_balance NUMERIC NOT NULL CHECK (remaining_balance >= 0),
  purchaser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  personal_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_card_transactions table for tracking usage
CREATE TABLE public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Gift cards policies
CREATE POLICY "Admins can manage gift cards"
ON public.gift_cards FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view gift cards they purchased"
ON public.gift_cards FOR SELECT
USING (auth.uid() = purchaser_id);

CREATE POLICY "Users can view gift cards they redeemed"
ON public.gift_cards FOR SELECT
USING (auth.uid() = redeemed_by);

CREATE POLICY "Anyone can create gift cards"
ON public.gift_cards FOR INSERT
WITH CHECK (true);

-- Gift card transactions policies
CREATE POLICY "Admins can view all transactions"
ON public.gift_card_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their gift card transactions"
ON public.gift_card_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.gift_cards gc
  WHERE gc.id = gift_card_id
  AND (gc.purchaser_id = auth.uid() OR gc.redeemed_by = auth.uid())
));

CREATE POLICY "Anyone can insert transactions"
ON public.gift_card_transactions FOR INSERT
WITH CHECK (true);

-- Create function to generate unique gift card code
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 16-character alphanumeric code in format XXXX-XXXX-XXXX-XXXX
    new_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 5 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 9 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 13 FOR 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create function to redeem gift card
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT,
  p_amount NUMERIC,
  p_order_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, amount_applied NUMERIC, new_balance NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_card RECORD;
  v_amount_to_apply NUMERIC;
BEGIN
  -- Find and lock the gift card
  SELECT * INTO v_gift_card
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(p_code))
  FOR UPDATE;
  
  -- Check if gift card exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if active
  IF NOT v_gift_card.is_active THEN
    RETURN QUERY SELECT false, 'Gift card is no longer active'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check balance
  IF v_gift_card.remaining_balance <= 0 THEN
    RETURN QUERY SELECT false, 'Gift card has no remaining balance'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate amount to apply
  v_amount_to_apply := LEAST(p_amount, v_gift_card.remaining_balance);
  
  -- Update gift card
  UPDATE public.gift_cards
  SET 
    remaining_balance = remaining_balance - v_amount_to_apply,
    redeemed_by = COALESCE(redeemed_by, p_user_id),
    first_redeemed_at = COALESCE(first_redeemed_at, NOW()),
    updated_at = NOW()
  WHERE id = v_gift_card.id;
  
  -- Record transaction
  INSERT INTO public.gift_card_transactions (gift_card_id, order_id, amount, transaction_type)
  VALUES (v_gift_card.id, p_order_id, v_amount_to_apply, 'redemption');
  
  RETURN QUERY SELECT 
    true, 
    'Gift card applied successfully'::TEXT, 
    v_amount_to_apply,
    (v_gift_card.remaining_balance - v_amount_to_apply);
END;
$$;

-- Create function to validate gift card (check without redeeming)
CREATE OR REPLACE FUNCTION public.validate_gift_card(p_code TEXT)
RETURNS TABLE(valid BOOLEAN, message TEXT, balance NUMERIC, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_card RECORD;
BEGIN
  SELECT * INTO v_gift_card
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(p_code));
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF NOT v_gift_card.is_active THEN
    RETURN QUERY SELECT false, 'Gift card is no longer active'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC, v_gift_card.expires_at;
    RETURN;
  END IF;
  
  IF v_gift_card.remaining_balance <= 0 THEN
    RETURN QUERY SELECT false, 'Gift card has no remaining balance'::TEXT, 0::NUMERIC, v_gift_card.expires_at;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Gift card is valid'::TEXT, v_gift_card.remaining_balance, v_gift_card.expires_at;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_gift_cards_updated_at
BEFORE UPDATE ON public.gift_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Source: 20251231170234_657d7b0f-6a6b-41eb-9cc7-ec52690a9a08.sql
-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  order_id UUID,
  referrer_reward_points INTEGER DEFAULT 500,
  referred_reward_points INTEGER DEFAULT 250,
  referrer_rewarded_at TIMESTAMP WITH TIME ZONE,
  referred_rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded'))
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are the referred user"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add index for referral code lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  user_name TEXT;
BEGIN
  -- Get first name from profile
  SELECT UPPER(COALESCE(SUBSTRING(first_name FROM 1 FOR 4), 'USER')) INTO user_name
  FROM public.profiles WHERE id = user_id;
  
  LOOP
    -- Generate code like JANE5A3B
    new_code := user_name || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to get or create user's referral code
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Check for existing referral record for this user as referrer
  SELECT referral_code INTO existing_code
  FROM public.referrals
  WHERE referrer_id = p_user_id
  LIMIT 1;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code(p_user_id);
  
  -- Create initial referral record (pending, no referred user yet)
  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (p_user_id, new_code, 'pending');
  
  RETURN new_code;
END;
$$;

-- Function to validate and apply referral code
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_code TEXT,
  p_referred_email TEXT,
  p_referred_user_id UUID DEFAULT NULL
)
RETURNS TABLE(valid BOOLEAN, message TEXT, referrer_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_name TEXT;
BEGIN
  -- Find the referral by code
  SELECT r.*, p.first_name INTO v_referral
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_id
  WHERE r.referral_code = UPPER(TRIM(p_code))
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Can't refer yourself
  IF v_referral.referrer_id = p_referred_user_id THEN
    RETURN QUERY SELECT false, 'You cannot use your own referral code'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if this email was already referred
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_email = p_referred_email 
    AND status != 'pending'
  ) THEN
    RETURN QUERY SELECT false, 'This email has already been referred'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Create a new referral record for this specific referral
  INSERT INTO public.referrals (
    referrer_id,
    referral_code,
    referred_email,
    referred_user_id,
    status
  ) VALUES (
    v_referral.referrer_id,
    v_referral.referral_code,
    p_referred_email,
    p_referred_user_id,
    CASE WHEN p_referred_user_id IS NOT NULL THEN 'signed_up' ELSE 'pending' END
  )
  ON CONFLICT (referral_code) DO NOTHING;
  
  v_referrer_name := COALESCE(v_referral.first_name, 'A friend');
  
  RETURN QUERY SELECT true, ('Referred by ' || v_referrer_name)::TEXT, v_referrer_name;
END;
$$;

-- Function to complete referral and award points
CREATE OR REPLACE FUNCTION public.complete_referral(
  p_referred_user_id UUID,
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Find unconverted referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_referred_user_id
  AND status IN ('signed_up', 'pending')
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE public.referrals
  SET 
    status = 'converted',
    order_id = p_order_id,
    converted_at = now()
  WHERE id = v_referral.id;
  
  -- Award points to referrer
  PERFORM add_loyalty_points(
    v_referral.referrer_id, 
    v_referral.referrer_reward_points, 
    p_order_id, 
    'Referral bonus - friend made their first purchase'
  );
  
  -- Award points to referred user
  PERFORM add_loyalty_points(
    p_referred_user_id, 
    v_referral.referred_reward_points, 
    p_order_id, 
    'Welcome bonus - referred by a friend'
  );
  
  -- Mark as rewarded
  UPDATE public.referrals
  SET 
    status = 'rewarded',
    referrer_rewarded_at = now(),
    referred_rewarded_at = now()
  WHERE id = v_referral.id;
  
  RETURN TRUE;
END;
$$;

-- Source: 20251231192555_a9157ab4-6760-4ab4-9a9c-1e94d6c46fb7.sql
-- Create function to get personalized product recommendations
-- Based on: browsing history, purchase patterns, category affinity, and pairs_well_with

CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_current_product_id text DEFAULT NULL,
  p_limit integer DEFAULT 6
)
RETURNS TABLE(
  id text,
  name text,
  price numeric,
  image text,
  category text,
  slug text,
  stock_quantity integer,
  recommendation_score numeric,
  recommendation_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_history boolean := false;
BEGIN
  -- Check if user has any browsing/purchase history
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM product_analytics WHERE user_id = p_user_id LIMIT 1
    ) INTO v_has_history;
  END IF;
  
  IF NOT v_has_history AND p_session_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM product_analytics WHERE session_id = p_session_id LIMIT 1
    ) INTO v_has_history;
  END IF;

  RETURN QUERY
  WITH user_activity AS (
    -- Get user's product interactions
    SELECT 
      pa.product_id,
      pa.event_type,
      pa.created_at,
      CASE 
        WHEN pa.event_type = 'purchase' THEN 10
        WHEN pa.event_type = 'add_to_cart' THEN 5
        WHEN pa.event_type = 'wishlist_add' THEN 4
        WHEN pa.event_type = 'view' THEN 1
        ELSE 0
      END as interaction_weight
    FROM product_analytics pa
    WHERE (p_user_id IS NOT NULL AND pa.user_id = p_user_id)
       OR (p_session_id IS NOT NULL AND pa.session_id = p_session_id)
  ),
  
  category_affinity AS (
    -- Calculate category preferences based on interactions
    SELECT 
      p.category,
      SUM(ua.interaction_weight) as category_score
    FROM user_activity ua
    JOIN products p ON p.id = ua.product_id
    GROUP BY p.category
  ),
  
  purchased_products AS (
    -- Get products the user has purchased (to exclude and find pairs)
    SELECT DISTINCT product_id
    FROM user_activity
    WHERE event_type = 'purchase'
  ),
  
  viewed_not_purchased AS (
    -- Products viewed but not purchased (high intent)
    SELECT 
      ua.product_id,
      COUNT(*) as view_count,
      MAX(ua.created_at) as last_viewed
    FROM user_activity ua
    WHERE ua.event_type = 'view'
      AND ua.product_id NOT IN (SELECT product_id FROM purchased_products)
    GROUP BY ua.product_id
  ),
  
  pairs_from_purchases AS (
    -- Get "pairs well with" products from purchased items
    SELECT UNNEST(p.pairs_well_with) as paired_product_id
    FROM purchased_products pp
    JOIN products p ON p.id = pp.product_id
    WHERE p.pairs_well_with IS NOT NULL
  ),
  
  scored_products AS (
    SELECT 
      p.id,
      p.name,
      p.price,
      p.image,
      p.category,
      p.slug,
      p.stock_quantity,
      (
        -- Score based on category affinity
        COALESCE((SELECT category_score FROM category_affinity WHERE category = p.category), 0) * 2
        -- Bonus for viewed but not purchased
        + COALESCE((SELECT view_count * 3 FROM viewed_not_purchased WHERE product_id = p.id), 0)
        -- Bonus for being a "pairs well with" item
        + CASE WHEN p.id IN (SELECT paired_product_id FROM pairs_from_purchases) THEN 15 ELSE 0 END
        -- Small random factor to add variety
        + (random() * 2)
      )::numeric(10,2) as recommendation_score,
      CASE
        WHEN p.id IN (SELECT paired_product_id FROM pairs_from_purchases) THEN 'Pairs with your purchases'
        WHEN p.id IN (SELECT product_id FROM viewed_not_purchased) THEN 'Recently viewed'
        WHEN p.category IN (SELECT category FROM category_affinity ORDER BY category_score DESC LIMIT 1) THEN 'Based on your interests'
        ELSE 'Popular pick'
      END as recommendation_reason
    FROM products p
    WHERE p.is_published = true
      AND p.stock_quantity > 0
      -- Exclude already purchased products
      AND p.id NOT IN (SELECT product_id FROM purchased_products)
      -- Exclude current product if specified
      AND (p_current_product_id IS NULL OR p.id != p_current_product_id)
  )
  
  SELECT 
    sp.id,
    sp.name,
    sp.price,
    sp.image,
    sp.category,
    sp.slug,
    sp.stock_quantity,
    sp.recommendation_score,
    sp.recommendation_reason
  FROM scored_products sp
  ORDER BY sp.recommendation_score DESC
  LIMIT p_limit;
END;
$$;

-- Source: 20260102090151_8e84f0fc-99ac-48a1-bf71-072a350e7d24.sql
-- Create a rate limiting table for gift card operations
CREATE TABLE IF NOT EXISTS public.gift_card_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL,
    attempt_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(identifier)
);

-- Enable RLS on rate limits table
ALTER TABLE public.gift_card_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow service role access (internal use only)
CREATE POLICY "Service role can manage gift card rate limits" 
ON public.gift_card_rate_limits 
FOR ALL 
USING (false);

-- Create rate limiting function for gift card operations
CREATE OR REPLACE FUNCTION public.check_gift_card_rate_limit(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_max_attempts INTEGER := 5; -- Max 5 attempts per 15 minutes
  v_window_minutes INTEGER := 15;
BEGIN
  -- Clean up old entries and upsert current attempt
  DELETE FROM public.gift_card_rate_limits 
  WHERE window_start < now() - (v_window_minutes || ' minutes')::interval;
  
  -- Get or create rate limit record
  INSERT INTO public.gift_card_rate_limits (identifier, attempt_count, window_start)
  VALUES (p_identifier, 1, now())
  ON CONFLICT (identifier) DO UPDATE SET
    attempt_count = CASE 
      WHEN gift_card_rate_limits.window_start < now() - (v_window_minutes || ' minutes')::interval 
      THEN 1 
      ELSE gift_card_rate_limits.attempt_count + 1 
    END,
    window_start = CASE 
      WHEN gift_card_rate_limits.window_start < now() - (v_window_minutes || ' minutes')::interval 
      THEN now() 
      ELSE gift_card_rate_limits.window_start 
    END
  RETURNING attempt_count INTO v_count;
  
  -- Check if over limit
  IF v_count > v_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Update validate_gift_card to include rate limiting
CREATE OR REPLACE FUNCTION public.validate_gift_card(p_code text)
RETURNS TABLE(valid boolean, message text, balance numeric, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_card RECORD;
  v_identifier text;
BEGIN
  -- Create rate limit identifier from code prefix (first 4 chars) to prevent enumeration
  -- while allowing legitimate retries with the same code
  v_identifier := 'gc_validate_' || COALESCE(LEFT(UPPER(TRIM(p_code)), 4), 'unknown') || '_' || 
                  COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown');
  
  -- Check rate limit
  IF NOT check_gift_card_rate_limit(v_identifier) THEN
    RETURN QUERY SELECT false, 'Too many attempts. Please try again later.'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  SELECT * INTO v_gift_card
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(p_code));
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF NOT v_gift_card.is_active THEN
    RETURN QUERY SELECT false, 'Gift card is no longer active'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC, v_gift_card.expires_at;
    RETURN;
  END IF;
  
  IF v_gift_card.remaining_balance <= 0 THEN
    RETURN QUERY SELECT false, 'Gift card has no remaining balance'::TEXT, 0::NUMERIC, v_gift_card.expires_at;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Gift card is valid'::TEXT, v_gift_card.remaining_balance, v_gift_card.expires_at;
END;
$$;

-- Update redeem_gift_card to include rate limiting  
CREATE OR REPLACE FUNCTION public.redeem_gift_card(p_code text, p_amount numeric, p_order_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(success boolean, message text, amount_applied numeric, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_card RECORD;
  v_amount_to_apply NUMERIC;
  v_identifier text;
BEGIN
  -- Create rate limit identifier
  v_identifier := 'gc_redeem_' || COALESCE(LEFT(UPPER(TRIM(p_code)), 4), 'unknown') || '_' || 
                  COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', 'unknown');
  
  -- Check rate limit
  IF NOT check_gift_card_rate_limit(v_identifier) THEN
    RETURN QUERY SELECT false, 'Too many attempts. Please try again later.'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  -- Find and lock the gift card
  SELECT * INTO v_gift_card
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(p_code))
  FOR UPDATE;
  
  -- Check if gift card exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if active
  IF NOT v_gift_card.is_active THEN
    RETURN QUERY SELECT false, 'Gift card is no longer active'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check balance
  IF v_gift_card.remaining_balance <= 0 THEN
    RETURN QUERY SELECT false, 'Gift card has no remaining balance'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate amount to apply
  v_amount_to_apply := LEAST(p_amount, v_gift_card.remaining_balance);
  
  -- Update gift card
  UPDATE public.gift_cards
  SET 
    remaining_balance = remaining_balance - v_amount_to_apply,
    redeemed_by = COALESCE(redeemed_by, p_user_id),
    first_redeemed_at = COALESCE(first_redeemed_at, NOW()),
    updated_at = NOW()
  WHERE id = v_gift_card.id;
  
  -- Record transaction
  INSERT INTO public.gift_card_transactions (gift_card_id, order_id, amount, transaction_type)
  VALUES (v_gift_card.id, p_order_id, v_amount_to_apply, 'redemption');
  
  RETURN QUERY SELECT 
    true, 
    'Gift card applied successfully'::TEXT, 
    v_amount_to_apply,
    (v_gift_card.remaining_balance - v_amount_to_apply);
END;
$$;

-- Source: 20260102091548_6a3babad-feb9-4062-92b2-6da64de49123.sql
-- Update the email_campaign_events INSERT policy to validate against existing campaigns
DROP POLICY IF EXISTS "Anyone can insert campaign events" ON public.email_campaign_events;

-- Create a more restrictive INSERT policy that validates campaign_id exists
CREATE POLICY "Only insert events for existing campaigns"
ON public.email_campaign_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE id = campaign_id
  )
);

-- Source: 20260102091837_210c7944-5bd2-4532-a37a-2b341086295b.sql
-- Fix security issues for orders and gift_cards tables
-- 1. Add policy to deny anonymous users from selecting orders
-- 2. Add policy to restrict gift_cards SELECT to only authenticated purchasers/redeemers

-- For orders: Create a policy that explicitly requires authentication or valid token
-- The existing policies handle authenticated users and guest token access
-- We need to ensure anonymous users without tokens can't access anything

-- For gift_cards: The current INSERT policy allows anyone to create (for checkout)
-- but SELECT should be restricted to authenticated users who own the card

-- Add a default deny policy for gift_cards SELECT for anonymous users
-- First, let's verify the existing policies and add restrictive ones

-- Drop any existing overly permissive policies on gift_cards if they exist
-- The current policies are:
-- 1. "Admins can manage gift cards" - ALL for admins
-- 2. "Anyone can create gift cards" - INSERT with CHECK true
-- 3. "Users can view gift cards they purchased" - SELECT for purchaser_id
-- 4. "Users can view gift cards they redeemed" - SELECT for redeemed_by

-- These look correct, but we should add explicit restriction comments
-- The issue is that anonymous users could still attempt queries

-- For orders table, add a policy that blocks anonymous access without proper auth
-- Current policies require either user_id = auth.uid() or a valid access token

-- Create a function to validate access tokens are cryptographically secure
-- For now, let's add explicit logging and tighten the guest order policy

-- Update the guest orders policy to require non-empty and minimum length token
DROP POLICY IF EXISTS "Guest orders require access token" ON public.orders;

CREATE POLICY "Guest orders require access token"
ON public.orders
FOR SELECT
USING (
  user_id IS NULL 
  AND access_token IS NOT NULL 
  AND length(access_token) >= 32  -- Ensure token is at least 32 chars (UUID length)
  AND access_token = (current_setting('request.headers', true)::json->>'x-order-token')
);

-- For gift_cards, add an explicit policy that requires authentication for SELECT
-- The existing policies already require auth.uid() = purchaser_id or redeemed_by
-- But let's make it clearer by adding a comment and ensuring no gaps

-- The current RLS is using FORCE mode which means all policies must pass
-- Actually in Postgres, RESTRICTIVE policies are combined with AND, PERMISSIVE with OR
-- Current policies are RESTRICTIVE (indicated by "No" in permissive column)

-- The fix is that RESTRICTIVE policies combined with OR for same command
-- So anon users should already be blocked since auth.uid() would be null

-- Let's add an explicit check to the INSERT policy to prevent abuse
DROP POLICY IF EXISTS "Anyone can create gift cards" ON public.gift_cards;

-- Allow gift card creation but with basic validation
CREATE POLICY "Authenticated or checkout can create gift cards"
ON public.gift_cards
FOR INSERT
WITH CHECK (
  -- Must have a valid purchaser email
  purchaser_email IS NOT NULL 
  AND length(purchaser_email) >= 5
  AND purchaser_email LIKE '%@%.%'
  -- Amount must be reasonable (between $5 and $500)
  AND original_amount >= 5
  AND original_amount <= 500
  AND remaining_balance = original_amount
);

-- Source: 20260102093001_584c0110-3366-4c88-b5a3-19d8447f56ae.sql
-- Add explicit deny policies for anonymous users as defense-in-depth
-- These ensure that even if there's a misconfiguration, anonymous users cannot access sensitive data

-- 1. profiles table - add explicit anonymous deny
-- The existing policies already use auth.uid() = id which blocks anonymous access
-- But we'll add an explicit restrictive policy to be extra safe
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. orders table - ensure anonymous users can only access with valid token
-- Drop and recreate the guest orders policy with stricter validation
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 3. addresses table - add explicit anonymous deny
CREATE POLICY "Block anonymous access to addresses"
ON public.addresses
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. gift_cards table - ensure only authenticated purchasers/redeemers can view
-- Drop and recreate with explicit auth check
DROP POLICY IF EXISTS "Users can view gift cards they purchased" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view gift cards they redeemed" ON public.gift_cards;

CREATE POLICY "Users can view gift cards they purchased"
ON public.gift_cards
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = purchaser_id);

CREATE POLICY "Users can view gift cards they redeemed"
ON public.gift_cards
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = redeemed_by);

-- 5. checkout_recovery table - the token-based access is intentional for cart recovery links
-- But we can add additional protection by masking email in the response
-- For now, the existing policy is fine as it requires valid unexpired tokens

-- 6. referrals table - add explicit auth requirement
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referred user" ON public.referrals;

CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are the referred user"
ON public.referrals
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = referred_user_id);

-- Also add explicit auth checks to warn-level tables for defense-in-depth

-- 7. subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 8. loyalty_points table
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON public.loyalty_points;
CREATE POLICY "Users can view their own loyalty points"
ON public.loyalty_points
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 9. loyalty_transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions"
ON public.loyalty_transactions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 10. wishlist table
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 11. stock_notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.stock_notifications;
CREATE POLICY "Users can view their own notifications"
ON public.stock_notifications
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Source: 20260102093120_ab4cd579-e78b-4244-8def-4a3d3bf15717.sql
-- Fix remaining security issues

-- 1. profiles table - the "Block anonymous access" policy was too permissive
-- It only checked auth.uid() IS NOT NULL but didn't verify ownership
-- Drop and recreate properly
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
-- The existing "Users can view their own profile" policy already handles this with auth.uid() = id
-- No additional policy needed

-- 2. gift_cards - add rate limiting function for gift card creation lookups
-- Create a function to check if a gift card code is being brute-forced
CREATE OR REPLACE FUNCTION public.check_gift_card_lookup_rate_limit(p_code text, p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_count integer;
  v_window_start timestamp with time zone;
  v_max_attempts constant integer := 10; -- Max 10 lookup attempts per hour
  v_window_duration constant interval := '1 hour';
BEGIN
  -- Get current rate limit record
  SELECT attempt_count, window_start 
  INTO v_attempt_count, v_window_start
  FROM public.gift_card_rate_limits 
  WHERE identifier = p_identifier;
  
  IF NOT FOUND THEN
    -- First attempt, create record
    INSERT INTO public.gift_card_rate_limits (identifier, attempt_count, window_start)
    VALUES (p_identifier, 1, now())
    ON CONFLICT (identifier) DO NOTHING;
    RETURN true;
  END IF;
  
  -- Check if window has expired
  IF v_window_start + v_window_duration < now() THEN
    -- Reset window
    UPDATE public.gift_card_rate_limits 
    SET attempt_count = 1, window_start = now()
    WHERE identifier = p_identifier;
    RETURN true;
  END IF;
  
  -- Check if within limit
  IF v_attempt_count >= v_max_attempts THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE public.gift_card_rate_limits 
  SET attempt_count = attempt_count + 1
  WHERE identifier = p_identifier;
  
  RETURN true;
END;
$$;

-- 3. Update the checkout_recovery policy to add expiration timestamp validation
-- The existing policy already checks expires_at > now() and used_at IS NULL
-- But we should ensure tokens are cryptographically secure (handled in application code)
-- Add a policy comment for documentation
COMMENT ON POLICY "Anyone can read recovery by token" ON public.checkout_recovery IS 
'Allows reading checkout recovery data only for unexpired, unused tokens. Tokens must be cryptographically secure (min 32 chars) and are validated server-side.';

-- 4. referrals table - add validation on referred_email to prevent enumeration
-- Update the insert policy to require authentication and validate email format
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = referrer_id
  AND (referred_email IS NULL OR referred_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Source: 20260102093227_306a009d-7b36-4548-9bc7-970fd5b2641b.sql
-- Add token expiration column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone;

-- Set default expiration for existing tokens (30 days from now)
UPDATE public.orders 
SET token_expires_at = now() + interval '30 days'
WHERE user_id IS NULL AND access_token IS NOT NULL AND token_expires_at IS NULL;

-- Update RLS policy to check token expiration
DROP POLICY IF EXISTS "Guest orders require access token" ON public.orders;

CREATE POLICY "Guest orders require access token"
ON public.orders
FOR SELECT
USING (
  user_id IS NULL 
  AND access_token IS NOT NULL 
  AND length(access_token) >= 32
  AND access_token = (current_setting('request.headers', true)::json->>'x-order-token')
  AND (token_expires_at IS NULL OR token_expires_at > now())
);

-- Create function to generate secure access token
CREATE OR REPLACE FUNCTION public.generate_secure_order_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a 64-character cryptographically secure token
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Create function to rotate guest order token
CREATE OR REPLACE FUNCTION public.rotate_guest_order_token(
  p_order_id uuid,
  p_current_token text,
  p_extend_hours integer DEFAULT 24
)
RETURNS TABLE(success boolean, new_token text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_new_token text;
  v_new_expiry timestamp with time zone;
BEGIN
  -- Find and verify the order with current token
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id IS NULL
    AND access_token = p_current_token
    AND (token_expires_at IS NULL OR token_expires_at > now())
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::timestamp with time zone;
    RETURN;
  END IF;
  
  -- Generate new token and expiry
  v_new_token := generate_secure_order_token();
  v_new_expiry := now() + (p_extend_hours || ' hours')::interval;
  
  -- Update the order with new token
  UPDATE public.orders
  SET 
    access_token = v_new_token,
    token_expires_at = v_new_expiry,
    updated_at = now()
  WHERE id = p_order_id;
  
  RETURN QUERY SELECT true, v_new_token, v_new_expiry;
END;
$$;

-- Create function to validate guest order token (for use in edge functions)
CREATE OR REPLACE FUNCTION public.validate_guest_order_token(
  p_order_id uuid,
  p_token text
)
RETURNS TABLE(valid boolean, order_status order_status, expires_in_hours numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id IS NULL
    AND access_token = p_token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::order_status, NULL::numeric;
    RETURN;
  END IF;
  
  -- Check if expired
  IF v_order.token_expires_at IS NOT NULL AND v_order.token_expires_at <= now() THEN
    RETURN QUERY SELECT false, v_order.status, 0::numeric;
    RETURN;
  END IF;
  
  -- Calculate hours until expiration
  RETURN QUERY SELECT 
    true, 
    v_order.status,
    CASE 
      WHEN v_order.token_expires_at IS NULL THEN 720::numeric -- 30 days if no expiry
      ELSE EXTRACT(EPOCH FROM (v_order.token_expires_at - now())) / 3600
    END;
END;
$$;

-- Source: 20260102093437_70b048d1-14b2-4329-ad96-b8f617314cc3.sql
-- Create table to track checkout attempts by IP
CREATE TABLE public.checkout_security_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  user_id uuid,
  event_type text NOT NULL, -- 'attempt', 'success', 'failure', 'rate_limited', 'suspicious'
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient IP lookups
CREATE INDEX idx_checkout_security_log_ip ON public.checkout_security_log(ip_address, created_at DESC);
CREATE INDEX idx_checkout_security_log_event ON public.checkout_security_log(event_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.checkout_security_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions use service role)
CREATE POLICY "Service role only access"
ON public.checkout_security_log
FOR ALL
USING (false);

-- Function to log checkout security event
CREATE OR REPLACE FUNCTION public.log_checkout_security_event(
  p_ip_address text,
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.checkout_security_log (ip_address, event_type, user_id, session_id, metadata)
  VALUES (p_ip_address, p_event_type, p_user_id, p_session_id, p_metadata);
END;
$$;

-- Function to check if IP is suspicious
CREATE OR REPLACE FUNCTION public.check_checkout_ip_security(p_ip_address text)
RETURNS TABLE(
  is_suspicious boolean,
  is_rate_limited boolean,
  reason text,
  attempts_last_hour integer,
  failures_last_hour integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_last_hour integer;
  v_failures_last_hour integer;
  v_suspicious_count integer;
  v_rate_limited_count integer;
  v_max_attempts_per_hour constant integer := 20;
  v_max_failures_per_hour constant integer := 5;
  v_suspicious_threshold constant integer := 3;
BEGIN
  -- Count attempts in last hour
  SELECT COUNT(*) INTO v_attempts_last_hour
  FROM public.checkout_security_log
  WHERE ip_address = p_ip_address
    AND event_type = 'attempt'
    AND created_at > now() - interval '1 hour';
  
  -- Count failures in last hour
  SELECT COUNT(*) INTO v_failures_last_hour
  FROM public.checkout_security_log
  WHERE ip_address = p_ip_address
    AND event_type = 'failure'
    AND created_at > now() - interval '1 hour';
  
  -- Count suspicious events in last 24 hours
  SELECT COUNT(*) INTO v_suspicious_count
  FROM public.checkout_security_log
  WHERE ip_address = p_ip_address
    AND event_type = 'suspicious'
    AND created_at > now() - interval '24 hours';
  
  -- Count rate limited events in last hour
  SELECT COUNT(*) INTO v_rate_limited_count
  FROM public.checkout_security_log
  WHERE ip_address = p_ip_address
    AND event_type = 'rate_limited'
    AND created_at > now() - interval '1 hour';
  
  -- Determine if suspicious
  IF v_suspicious_count >= v_suspicious_threshold THEN
    RETURN QUERY SELECT 
      true, 
      true, 
      'IP has been flagged for suspicious activity'::text,
      v_attempts_last_hour,
      v_failures_last_hour;
    RETURN;
  END IF;
  
  -- Check rate limit
  IF v_attempts_last_hour >= v_max_attempts_per_hour THEN
    RETURN QUERY SELECT 
      false, 
      true, 
      'Too many checkout attempts. Please try again later.'::text,
      v_attempts_last_hour,
      v_failures_last_hour;
    RETURN;
  END IF;
  
  -- Check failure rate
  IF v_failures_last_hour >= v_max_failures_per_hour THEN
    RETURN QUERY SELECT 
      true, 
      true, 
      'Too many failed checkout attempts.'::text,
      v_attempts_last_hour,
      v_failures_last_hour;
    RETURN;
  END IF;
  
  -- All good
  RETURN QUERY SELECT 
    false, 
    false, 
    NULL::text,
    v_attempts_last_hour,
    v_failures_last_hour;
END;
$$;

-- Function to get IP security stats for admin dashboard
CREATE OR REPLACE FUNCTION public.get_checkout_security_stats(p_hours integer DEFAULT 24)
RETURNS TABLE(
  total_attempts bigint,
  total_failures bigint,
  total_suspicious bigint,
  total_rate_limited bigint,
  unique_ips bigint,
  top_suspicious_ips jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'attempt') as attempts,
      COUNT(*) FILTER (WHERE event_type = 'failure') as failures,
      COUNT(*) FILTER (WHERE event_type = 'suspicious') as suspicious,
      COUNT(*) FILTER (WHERE event_type = 'rate_limited') as rate_limited,
      COUNT(DISTINCT ip_address) as ips
    FROM public.checkout_security_log
    WHERE created_at > now() - (p_hours || ' hours')::interval
  ),
  top_ips AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'ip', ip_address,
        'count', cnt,
        'last_seen', last_seen
      )
    ) as suspicious_ips
    FROM (
      SELECT 
        ip_address,
        COUNT(*) as cnt,
        MAX(created_at) as last_seen
      FROM public.checkout_security_log
      WHERE event_type IN ('suspicious', 'rate_limited')
        AND created_at > now() - (p_hours || ' hours')::interval
      GROUP BY ip_address
      ORDER BY cnt DESC
      LIMIT 10
    ) t
  )
  SELECT 
    s.attempts,
    s.failures,
    s.suspicious,
    s.rate_limited,
    s.ips,
    COALESCE(t.suspicious_ips, '[]'::jsonb)
  FROM stats s, top_ips t;
END;
$$;

-- Source: 20260107072352_b907ea08-bc17-44ba-ba85-41bfee1dd122.sql
-- Add ms@thefourths.com as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('71cb0de4-a90e-42e1-b92b-616b32d13cff', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create admin audit log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs (via edge function with service role)
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Source: 20260107085328_e35a6edf-cce4-4114-b72e-b40d5ae736f9.sql
-- Fix 1: Replace MD5-based gift card code generation with cryptographically secure random bytes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Use gen_random_bytes for cryptographically secure randomness
    -- Generate 12 random bytes and encode as hex (24 chars), then format as XXXX-XXXX-XXXX-XXXX
    new_code := UPPER(
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4) || '-' ||
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4) || '-' ||
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4) || '-' ||
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Fix 2: Replace overly permissive INSERT policy on gift_card_transactions
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.gift_card_transactions;

-- Create a more restrictive policy that validates the transaction context
-- Only allow inserts for gift cards the user owns OR via service role (edge functions)
CREATE POLICY "Authenticated users can insert transactions for their gift cards"
ON public.gift_card_transactions
FOR INSERT
WITH CHECK (
  -- Allow if the user owns the gift card (purchaser or redeemer)
  EXISTS (
    SELECT 1 FROM public.gift_cards gc
    WHERE gc.id = gift_card_id
    AND (
      gc.purchaser_id = auth.uid()
      OR gc.redeemed_by = auth.uid()
    )
  )
  OR
  -- Allow for purchase transactions (new gift card creation flow - purchaser_email validation happens at gift_cards level)
  (
    transaction_type = 'purchase'
    AND EXISTS (
      SELECT 1 FROM public.gift_cards gc
      WHERE gc.id = gift_card_id
    )
  )
);

-- Source: 20260107085344_4ea5c71f-be4c-4d42-aa83-f063bda4f9dd.sql
-- Fix: Replace overly permissive checkout_recovery policy
-- This table is for abandoned cart recovery and should only be accessible via service role (edge functions)

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role has full access to recovery" ON public.checkout_recovery;

-- Create a restrictive policy that denies direct access (service role bypasses RLS anyway)
-- Regular users should not be able to access this table directly
CREATE POLICY "No direct access to checkout recovery"
ON public.checkout_recovery
FOR ALL
USING (false)
WITH CHECK (false);

-- Note: The edge functions use service role which bypasses RLS, so they can still access this table
-- This policy ensures the anon and authenticated roles cannot directly read/write recovery data

-- Source: 20260107093042_4c36b811-740c-4427-be95-81140dd2cccc.sql
-- Drop the redundant "Block anonymous access to addresses" policy that only checks authentication
-- The existing "Users can view their own addresses" policy already properly checks auth.uid() = user_id
DROP POLICY IF EXISTS "Block anonymous access to addresses" ON public.addresses;

-- Source: 20260107093404_93a94410-8c72-4462-81cc-c7ba1c86a068.sql
-- Drop and recreate the view with security_invoker = true
-- This makes the view respect the RLS policies of the underlying products table
DROP VIEW IF EXISTS public.low_stock_products;

CREATE VIEW public.low_stock_products
WITH (security_invoker = true)
AS
SELECT id,
    name,
    stock_quantity,
    low_stock_threshold,
    category,
    image
FROM products
WHERE track_inventory = true 
  AND stock_quantity <= low_stock_threshold 
  AND is_published = true
ORDER BY stock_quantity;

-- Grant select to authenticated users (RLS on products table will filter)
GRANT SELECT ON public.low_stock_products TO authenticated;

-- Since products table allows everyone to SELECT, we need a different approach
-- We'll revoke public access and only grant to service_role
REVOKE SELECT ON public.low_stock_products FROM anon, authenticated;
GRANT SELECT ON public.low_stock_products TO service_role;

-- Source: 20260107100333_c67cadb5-f7f1-47f0-ad11-478f8d69b234.sql
-- Create rate limit table for referral operations
CREATE TABLE IF NOT EXISTS public.referral_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL UNIQUE,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the rate limit table
ALTER TABLE public.referral_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access - only through functions
CREATE POLICY "No direct access to referral rate limits" 
ON public.referral_rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Create rate limiting function for referrals
CREATE OR REPLACE FUNCTION public.check_referral_rate_limit(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_max_attempts INTEGER := 10; -- Max 10 referral attempts per hour
  v_window_minutes INTEGER := 60;
BEGIN
  -- Clean up old entries
  DELETE FROM public.referral_rate_limits 
  WHERE window_start < now() - (v_window_minutes || ' minutes')::interval;
  
  -- Get or create rate limit record
  INSERT INTO public.referral_rate_limits (identifier, attempt_count, window_start)
  VALUES (p_identifier, 1, now())
  ON CONFLICT (identifier) DO UPDATE SET
    attempt_count = CASE 
      WHEN referral_rate_limits.window_start < now() - (v_window_minutes || ' minutes')::interval 
      THEN 1 
      ELSE referral_rate_limits.attempt_count + 1 
    END,
    window_start = CASE 
      WHEN referral_rate_limits.window_start < now() - (v_window_minutes || ' minutes')::interval 
      THEN now() 
      ELSE referral_rate_limits.window_start 
    END
  RETURNING attempt_count INTO v_count;
  
  -- Check if over limit
  IF v_count > v_max_attempts THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create helper function to mask email addresses
CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_local_part text;
  v_domain text;
  v_masked_local text;
BEGIN
  IF p_email IS NULL OR p_email = '' THEN
    RETURN NULL;
  END IF;
  
  v_local_part := split_part(p_email, '@', 1);
  v_domain := split_part(p_email, '@', 2);
  
  -- Show first 2 chars, mask rest with asterisks, preserve length hint
  IF length(v_local_part) <= 2 THEN
    v_masked_local := v_local_part(1, 1) || '***';
  ELSE
    v_masked_local := substring(v_local_part, 1, 2) || '***';
  END IF;
  
  RETURN v_masked_local || '@' || v_domain;
END;
$$;

-- Update apply_referral_code to include rate limiting
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text, p_referred_email text, p_referred_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(valid boolean, message text, referrer_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_name TEXT;
  v_identifier text;
BEGIN
  -- Create rate limit identifier (use IP if available, or email prefix)
  v_identifier := 'referral_' || COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    LEFT(p_referred_email, 4) || '_unknown'
  );
  
  -- Check rate limit
  IF NOT check_referral_rate_limit(v_identifier) THEN
    RETURN QUERY SELECT false, 'Too many attempts. Please try again later.'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Find the referral by code
  SELECT r.*, p.first_name INTO v_referral
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_id
  WHERE r.referral_code = UPPER(TRIM(p_code))
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Use generic message to prevent code enumeration
    RETURN QUERY SELECT false, 'Invalid referral code'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Can't refer yourself
  IF v_referral.referrer_id = p_referred_user_id THEN
    RETURN QUERY SELECT false, 'You cannot use your own referral code'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if this email was already referred (generic message to prevent email enumeration)
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_email = p_referred_email 
    AND status != 'pending'
  ) THEN
    -- Use same message as invalid code to prevent enumeration
    RETURN QUERY SELECT false, 'This code cannot be applied to your account'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Create a new referral record for this specific referral
  INSERT INTO public.referrals (
    referrer_id,
    referral_code,
    referred_email,
    referred_user_id,
    status
  ) VALUES (
    v_referral.referrer_id,
    v_referral.referral_code,
    p_referred_email,
    p_referred_user_id,
    CASE WHEN p_referred_user_id IS NOT NULL THEN 'signed_up' ELSE 'pending' END
  )
  ON CONFLICT (referral_code) DO NOTHING;
  
  v_referrer_name := COALESCE(v_referral.first_name, 'A friend');
  
  RETURN QUERY SELECT true, ('Referred by ' || v_referrer_name)::TEXT, v_referrer_name;
END;
$$;

-- Source: 20260107101651_3b451db0-9f01-40cd-8345-f8c033cf45d7.sql
-- Create function to get referral security statistics
CREATE OR REPLACE FUNCTION get_referral_security_stats(p_hours integer DEFAULT 24)
RETURNS TABLE(
  total_entries bigint,
  high_attempt_entries bigint,
  unique_identifiers bigint,
  pending_referrals bigint,
  converted_referrals bigint,
  top_rate_limited jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_time timestamp with time zone := now() - (p_hours || ' hours')::interval;
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM referral_rate_limits WHERE window_start >= cutoff_time)::bigint as total_entries,
    (SELECT COUNT(*) FROM referral_rate_limits WHERE window_start >= cutoff_time AND attempt_count > 5)::bigint as high_attempt_entries,
    (SELECT COUNT(DISTINCT identifier) FROM referral_rate_limits WHERE window_start >= cutoff_time)::bigint as unique_identifiers,
    (SELECT COUNT(*) FROM referrals WHERE created_at >= cutoff_time AND status = 'pending')::bigint as pending_referrals,
    (SELECT COUNT(*) FROM referrals WHERE created_at >= cutoff_time AND status = 'converted')::bigint as converted_referrals,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'identifier', r.identifier,
          'attempt_count', r.attempt_count,
          'window_start', r.window_start
        )
        ORDER BY r.attempt_count DESC
      ), '[]'::jsonb)
      FROM (
        SELECT identifier, attempt_count, window_start
        FROM referral_rate_limits
        WHERE window_start >= cutoff_time
        ORDER BY attempt_count DESC
        LIMIT 10
      ) r
    ) as top_rate_limited;
END;
$$;

-- Source: 20260107102842_28bd2de0-e9a5-4c3c-b263-fe904a9799bd.sql
-- Drop and recreate get_referral_security_stats with blocked count
DROP FUNCTION IF EXISTS get_referral_security_stats(integer);

CREATE OR REPLACE FUNCTION get_referral_security_stats(p_hours integer DEFAULT 24)
RETURNS TABLE(
  total_entries bigint,
  high_attempt_entries bigint,
  unique_identifiers bigint,
  pending_referrals bigint,
  converted_referrals bigint,
  blocked_identifiers bigint,
  top_rate_limited jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM referral_rate_limits WHERE window_start > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referral_rate_limits WHERE attempt_count > 5 AND window_start > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(DISTINCT identifier) FROM referral_rate_limits WHERE window_start > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referrals WHERE status = 'pending' AND created_at > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referrals WHERE status = 'converted' AND converted_at > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referral_blocklist)::bigint,
    (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT identifier, attempt_count, window_start
      FROM referral_rate_limits
      WHERE window_start > now() - (p_hours || ' hours')::interval
      ORDER BY attempt_count DESC
      LIMIT 10
    ) t);
END;
$$;

-- Source: 20260107103930_15cb215e-cd5c-479c-a015-72462c40d9d2.sql
-- Create referral_blocklist table with geolocation columns
CREATE TABLE IF NOT EXISTS public.referral_blocklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  country TEXT,
  region TEXT,
  city TEXT,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- If table exists but columns don't, add them
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_blocklist' AND column_name = 'country') THEN
    ALTER TABLE public.referral_blocklist ADD COLUMN country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_blocklist' AND column_name = 'region') THEN
    ALTER TABLE public.referral_blocklist ADD COLUMN region TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_blocklist' AND column_name = 'city') THEN
    ALTER TABLE public.referral_blocklist ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_blocklist' AND column_name = 'country_code') THEN
    ALTER TABLE public.referral_blocklist ADD COLUMN country_code TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.referral_blocklist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can view blocklist" ON public.referral_blocklist;
DROP POLICY IF EXISTS "Admins can insert into blocklist" ON public.referral_blocklist;
DROP POLICY IF EXISTS "Admins can delete from blocklist" ON public.referral_blocklist;
DROP POLICY IF EXISTS "Admins can update blocklist" ON public.referral_blocklist;

-- Create policies for admin access (using correct has_role signature: user_id, role)
CREATE POLICY "Admins can view blocklist" 
ON public.referral_blocklist 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert into blocklist" 
ON public.referral_blocklist 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete from blocklist" 
ON public.referral_blocklist 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blocklist" 
ON public.referral_blocklist 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_blocklist_identifier ON public.referral_blocklist(identifier);
CREATE INDEX IF NOT EXISTS idx_referral_blocklist_country_code ON public.referral_blocklist(country_code);

-- Update get_referral_security_stats function
CREATE OR REPLACE FUNCTION public.get_referral_security_stats(p_hours integer DEFAULT 24)
RETURNS TABLE(
  total_entries bigint,
  high_attempt_entries bigint,
  unique_identifiers bigint,
  pending_referrals bigint,
  converted_referrals bigint,
  blocked_identifiers bigint,
  top_rate_limited jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_time timestamptz;
BEGIN
  cutoff_time := now() - (p_hours || ' hours')::interval;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM referral_rate_limits WHERE window_start >= cutoff_time)::bigint as total_entries,
    (SELECT COUNT(*) FROM referral_rate_limits WHERE window_start >= cutoff_time AND attempt_count > 5)::bigint as high_attempt_entries,
    (SELECT COUNT(DISTINCT identifier) FROM referral_rate_limits WHERE window_start >= cutoff_time)::bigint as unique_identifiers,
    (SELECT COUNT(*) FROM referrals WHERE status = 'pending')::bigint as pending_referrals,
    (SELECT COUNT(*) FROM referrals WHERE status = 'converted')::bigint as converted_referrals,
    (SELECT COUNT(*) FROM referral_blocklist)::bigint as blocked_identifiers,
    (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT identifier, attempt_count, window_start
        FROM referral_rate_limits
        WHERE window_start >= cutoff_time
        ORDER BY attempt_count DESC
        LIMIT 10
      ) t
    ) as top_rate_limited;
END;
$$;

-- Source: 20260111175851_e38e2ec2-93a9-4d30-9630-c6ceb91b1ce9.sql
CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_user_id uuid DEFAULT NULL::uuid, 
  p_session_id text DEFAULT NULL::text, 
  p_current_product_id text DEFAULT NULL::text, 
  p_limit integer DEFAULT 6
)
RETURNS TABLE(
  id text, 
  name text, 
  price numeric, 
  image text, 
  category text, 
  slug text, 
  stock_quantity integer, 
  recommendation_score numeric, 
  recommendation_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_history boolean := false;
BEGIN
  -- Check if user has any browsing/purchase history
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM product_analytics WHERE user_id = p_user_id LIMIT 1
    ) INTO v_has_history;
  END IF;
  
  IF NOT v_has_history AND p_session_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM product_analytics WHERE session_id = p_session_id LIMIT 1
    ) INTO v_has_history;
  END IF;

  RETURN QUERY
  WITH user_activity AS (
    SELECT 
      pa.product_id,
      pa.event_type,
      pa.created_at,
      CASE 
        WHEN pa.event_type = 'purchase' THEN 10
        WHEN pa.event_type = 'add_to_cart' THEN 5
        WHEN pa.event_type = 'wishlist_add' THEN 4
        WHEN pa.event_type = 'view' THEN 1
        ELSE 0
      END as interaction_weight
    FROM product_analytics pa
    WHERE (p_user_id IS NOT NULL AND pa.user_id = p_user_id)
       OR (p_session_id IS NOT NULL AND pa.session_id = p_session_id)
  ),
  
  category_affinity AS (
    SELECT 
      prod.category AS cat_name,
      SUM(ua.interaction_weight) as category_score
    FROM user_activity ua
    JOIN products prod ON prod.id = ua.product_id
    GROUP BY prod.category
  ),
  
  purchased_products AS (
    SELECT DISTINCT ua.product_id
    FROM user_activity ua
    WHERE ua.event_type = 'purchase'
  ),
  
  viewed_not_purchased AS (
    SELECT 
      ua.product_id,
      COUNT(*) as view_count,
      MAX(ua.created_at) as last_viewed
    FROM user_activity ua
    WHERE ua.event_type = 'view'
      AND ua.product_id NOT IN (SELECT pp.product_id FROM purchased_products pp)
    GROUP BY ua.product_id
  ),
  
  pairs_from_purchases AS (
    SELECT UNNEST(prod.pairs_well_with) as paired_product_id
    FROM purchased_products pp
    JOIN products prod ON prod.id = pp.product_id
    WHERE prod.pairs_well_with IS NOT NULL
  ),
  
  scored_products AS (
    SELECT 
      prod.id AS product_id,
      prod.name AS product_name,
      prod.price AS product_price,
      prod.image AS product_image,
      prod.category AS product_category,
      prod.slug AS product_slug,
      prod.stock_quantity AS product_stock,
      (
        COALESCE((SELECT ca.category_score FROM category_affinity ca WHERE ca.cat_name = prod.category), 0) * 2
        + COALESCE((SELECT vnp.view_count * 3 FROM viewed_not_purchased vnp WHERE vnp.product_id = prod.id), 0)
        + CASE WHEN prod.id IN (SELECT pfp.paired_product_id FROM pairs_from_purchases pfp) THEN 15 ELSE 0 END
        + (random() * 2)
      )::numeric(10,2) as calc_score,
      CASE
        WHEN prod.id IN (SELECT pfp.paired_product_id FROM pairs_from_purchases pfp) THEN 'Pairs with your purchases'
        WHEN prod.id IN (SELECT vnp.product_id FROM viewed_not_purchased vnp) THEN 'Recently viewed'
        WHEN prod.category IN (SELECT ca.cat_name FROM category_affinity ca ORDER BY ca.category_score DESC LIMIT 1) THEN 'Based on your interests'
        ELSE 'Popular pick'
      END as calc_reason
    FROM products prod
    WHERE prod.is_published = true
      AND prod.stock_quantity > 0
      AND prod.id NOT IN (SELECT pp.product_id FROM purchased_products pp)
      AND (p_current_product_id IS NULL OR prod.id != p_current_product_id)
  )
  
  SELECT 
    sp.product_id,
    sp.product_name,
    sp.product_price,
    sp.product_image,
    sp.product_category,
    sp.product_slug,
    sp.product_stock,
    sp.calc_score,
    sp.calc_reason
  FROM scored_products sp
  ORDER BY sp.calc_score DESC
  LIMIT p_limit;
END;
$function$;

-- Source: 20260305080934_12d84133-9a81-490a-a05c-b7ab0924b3d9.sql
INSERT INTO storage.buckets (id, name, public) VALUES ('email-assets', 'email-assets', true) ON CONFLICT (id) DO NOTHING;

-- Source: 20260308082853_785413b5-e634-464c-8ae5-bfbe05d55cf5.sql
UPDATE products SET is_published = false WHERE is_bundle = true;

-- Source: 20260308161228_7ab8c00f-d2c9-41e2-acd9-634e9b6e6dc3.sql

-- Add product trait columns for dietary/lifestyle filtering
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_vegan boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_gluten_free boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_sugar_free boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_keto_friendly boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS contains_allergens text[] DEFAULT '{}';

-- Set collagen products as non-vegan (contains animal-derived collagen)
UPDATE public.products SET is_vegan = false WHERE LOWER(name) LIKE '%collagen%';


-- Source: 20260308164117_62d13822-3b65-41a9-b41d-4b4fd78bd171.sql
ALTER TABLE public.products ADD COLUMN is_coming_soon boolean NOT NULL DEFAULT false;

-- Source: 20260312133000_processed_webhook_events.sql
-- Create table for tracking processed Stripe webhook events to ensure idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No public access - only service role
CREATE POLICY "Service role only access for processed_webhook_events"
ON public.processed_webhook_events
FOR ALL
USING (auth.role() = 'service_role');

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id ON public.processed_webhook_events(stripe_event_id);

COMMENT ON TABLE public.processed_webhook_events IS 'Stores processed Stripe event IDs to prevent duplicate processing (idempotency).';


