-- Create increment_stock function for stock restoration on order cancellation
CREATE OR REPLACE FUNCTION public.increment_stock(p_product_id text, p_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products 
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_product_id;
  
  RETURN TRUE;
END;
$$;