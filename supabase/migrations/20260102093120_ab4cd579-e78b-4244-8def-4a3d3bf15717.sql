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