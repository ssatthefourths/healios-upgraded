-- Drop and recreate get_referral_security_stats with blocked count
DROP FUNCTION IF EXISTS get_referral_security_stats(integer);

CREATE OR REPLACE FUNCTION get_referral_security_stats(p_hours integer DEFAULT 24)
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
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM referral_rate_limits WHERE window_start > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referral_rate_limits WHERE attempt_count > 5 AND window_start > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(DISTINCT identifier) FROM referral_rate_limits WHERE window_start > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referrals WHERE status = 'pending' AND created_at > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referrals WHERE status = 'converted' AND converted_at > now() - (p_hours || ' hours')::interval)::bigint,
    (SELECT count(*) FROM referral_blocklist)::bigint,
    (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (
      SELECT identifier, attempt_count, window_start
      FROM referral_rate_limits
      WHERE window_start > now() - (p_hours || ' hours')::interval
      ORDER BY attempt_count DESC
      LIMIT 10
    ) t);
END;
$$;