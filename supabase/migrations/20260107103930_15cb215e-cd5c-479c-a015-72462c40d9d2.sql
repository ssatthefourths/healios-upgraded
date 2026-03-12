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