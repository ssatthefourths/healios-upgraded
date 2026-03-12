-- Drop the redundant "Block anonymous access to addresses" policy that only checks authentication
-- The existing "Users can view their own addresses" policy already properly checks auth.uid() = user_id
DROP POLICY IF EXISTS "Block anonymous access to addresses" ON public.addresses;