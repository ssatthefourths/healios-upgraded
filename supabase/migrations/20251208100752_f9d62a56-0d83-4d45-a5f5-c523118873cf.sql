-- Drop the security definer view and replace with a regular view
DROP VIEW IF EXISTS public.low_stock_products;

CREATE VIEW public.low_stock_products 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  stock_quantity,
  low_stock_threshold,
  category,
  image
FROM public.products
WHERE track_inventory = true 
  AND stock_quantity <= low_stock_threshold
  AND is_published = true
ORDER BY stock_quantity ASC;