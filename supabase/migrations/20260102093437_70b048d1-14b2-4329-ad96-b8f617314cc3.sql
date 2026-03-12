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