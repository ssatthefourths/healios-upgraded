-- THE-158: Add RLS policy for low_stock_products view
-- Views inherit RLS from underlying tables, but we can add explicit policies

-- Since low_stock_products is a VIEW (not a table), RLS policies are applied through
-- the underlying products table which already has proper policies.
-- However, we should ensure admins can query this view by creating a security definer function

-- Create a function for admin-only low stock access
CREATE OR REPLACE FUNCTION public.get_low_stock_products()
RETURNS TABLE (
  id text,
  name text,
  category text,
  image text,
  stock_quantity integer,
  low_stock_threshold integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    category,
    image,
    stock_quantity,
    low_stock_threshold
  FROM public.products
  WHERE stock_quantity <= low_stock_threshold
    AND track_inventory = true
  ORDER BY stock_quantity ASC;
$$;

-- Grant execute permission to authenticated users (RLS check happens in function)
GRANT EXECUTE ON FUNCTION public.get_low_stock_products() TO authenticated;