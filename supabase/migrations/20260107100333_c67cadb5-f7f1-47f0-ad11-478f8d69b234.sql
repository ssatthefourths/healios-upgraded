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