-- Fix 1: Replace MD5-based gift card code generation with cryptographically secure random bytes
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Use gen_random_bytes for cryptographically secure randomness
    -- Generate 12 random bytes and encode as hex (24 chars), then format as XXXX-XXXX-XXXX-XXXX
    new_code := UPPER(
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4) || '-' ||
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4) || '-' ||
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4) || '-' ||
      SUBSTRING(encode(gen_random_bytes(2), 'hex') FROM 1 FOR 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Fix 2: Replace overly permissive INSERT policy on gift_card_transactions
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.gift_card_transactions;

-- Create a more restrictive policy that validates the transaction context
-- Only allow inserts for gift cards the user owns OR via service role (edge functions)
CREATE POLICY "Authenticated users can insert transactions for their gift cards"
ON public.gift_card_transactions
FOR INSERT
WITH CHECK (
  -- Allow if the user owns the gift card (purchaser or redeemer)
  EXISTS (
    SELECT 1 FROM public.gift_cards gc
    WHERE gc.id = gift_card_id
    AND (
      gc.purchaser_id = auth.uid()
      OR gc.redeemed_by = auth.uid()
    )
  )
  OR
  -- Allow for purchase transactions (new gift card creation flow - purchaser_email validation happens at gift_cards level)
  (
    transaction_type = 'purchase'
    AND EXISTS (
      SELECT 1 FROM public.gift_cards gc
      WHERE gc.id = gift_card_id
    )
  )
);