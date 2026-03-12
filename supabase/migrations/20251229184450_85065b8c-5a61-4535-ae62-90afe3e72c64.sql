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