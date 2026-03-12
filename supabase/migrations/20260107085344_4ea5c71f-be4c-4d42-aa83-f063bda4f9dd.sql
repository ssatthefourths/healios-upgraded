-- Fix: Replace overly permissive checkout_recovery policy
-- This table is for abandoned cart recovery and should only be accessible via service role (edge functions)

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role has full access to recovery" ON public.checkout_recovery;

-- Create a restrictive policy that denies direct access (service role bypasses RLS anyway)
-- Regular users should not be able to access this table directly
CREATE POLICY "No direct access to checkout recovery"
ON public.checkout_recovery
FOR ALL
USING (false)
WITH CHECK (false);

-- Note: The edge functions use service role which bypasses RLS, so they can still access this table
-- This policy ensures the anon and authenticated roles cannot directly read/write recovery data