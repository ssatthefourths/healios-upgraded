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