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