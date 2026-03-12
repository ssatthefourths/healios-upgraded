-- Add stripe_session_id column to orders table for reliable order confirmation lookup
ALTER TABLE public.orders 
ADD COLUMN stripe_session_id text UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);