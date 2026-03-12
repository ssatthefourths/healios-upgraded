-- Remove the public SELECT policy that allows enumeration of discount codes
-- The validate-discount edge function uses SUPABASE_ANON_KEY which bypasses RLS anyway
-- so we can safely remove this permissive policy

DROP POLICY IF EXISTS "Anyone can read active discount codes" ON public.discount_codes;

-- Create a more restrictive policy: only authenticated users can read codes they've used
-- For validation, the edge function already handles this server-side
CREATE POLICY "Authenticated users can view discount codes they've applied"
ON public.discount_codes
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.user_id = auth.uid() 
    AND orders.discount_code = discount_codes.code
  )
);