-- Drop and recreate the view with security_invoker = true
-- This makes the view respect the RLS policies of the underlying products table
DROP VIEW IF EXISTS public.low_stock_products;

CREATE VIEW public.low_stock_products
WITH (security_invoker = true)
AS
SELECT id,
    name,
    stock_quantity,
    low_stock_threshold,
    category,
    image
FROM products
WHERE track_inventory = true 
  AND stock_quantity <= low_stock_threshold 
  AND is_published = true
ORDER BY stock_quantity;

-- Grant select to authenticated users (RLS on products table will filter)
GRANT SELECT ON public.low_stock_products TO authenticated;

-- Since products table allows everyone to SELECT, we need a different approach
-- We'll revoke public access and only grant to service_role
REVOKE SELECT ON public.low_stock_products FROM anon, authenticated;
GRANT SELECT ON public.low_stock_products TO service_role;