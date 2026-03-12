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