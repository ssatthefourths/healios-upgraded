-- Add is_subscription column to order_items table
ALTER TABLE public.order_items ADD COLUMN is_subscription BOOLEAN DEFAULT FALSE;