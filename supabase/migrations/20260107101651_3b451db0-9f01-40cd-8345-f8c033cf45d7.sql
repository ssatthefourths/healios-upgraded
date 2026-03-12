-- Create function to get referral security statistics
CREATE OR REPLACE FUNCTION get_referral_security_stats(p_hours integer DEFAULT 24)
RETURNS TABLE(
  total_entries bigint,
  high_attempt_entries bigint,
  unique_identifiers bigint,
  pending_referrals bigint,
  converted_referrals bigint,
  top_rate_limited jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_time timestamp with time zone := now() - (p_hours || ' hours')::interval;
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM referral_rate_limits WHERE window_start >= cutoff_time)::bigint as total_entries,
    (SELECT COUNT(*) FROM referral_rate_limits WHERE window_start >= cutoff_time AND attempt_count > 5)::bigint as high_attempt_entries,
    (SELECT COUNT(DISTINCT identifier) FROM referral_rate_limits WHERE window_start >= cutoff_time)::bigint as unique_identifiers,
    (SELECT COUNT(*) FROM referrals WHERE created_at >= cutoff_time AND status = 'pending')::bigint as pending_referrals,
    (SELECT COUNT(*) FROM referrals WHERE created_at >= cutoff_time AND status = 'converted')::bigint as converted_referrals,
    (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'identifier', r.identifier,
          'attempt_count', r.attempt_count,
          'window_start', r.window_start
        )
        ORDER BY r.attempt_count DESC
      ), '[]'::jsonb)
      FROM (
        SELECT identifier, attempt_count, window_start
        FROM referral_rate_limits
        WHERE window_start >= cutoff_time
        ORDER BY attempt_count DESC
        LIMIT 10
      ) r
    ) as top_rate_limited;
END;
$$;