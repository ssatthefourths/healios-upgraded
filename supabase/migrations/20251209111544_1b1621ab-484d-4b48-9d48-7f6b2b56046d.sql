-- Create function to increment discount code usage
CREATE OR REPLACE FUNCTION public.increment_discount_usage(discount_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE code = discount_code;
END;
$$;