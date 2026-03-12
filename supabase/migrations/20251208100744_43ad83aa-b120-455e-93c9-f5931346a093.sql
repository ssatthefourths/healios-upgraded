-- Add inventory columns to products table
ALTER TABLE public.products
ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 100,
ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 10,
ADD COLUMN track_inventory BOOLEAN NOT NULL DEFAULT true;

-- Create function to check and update stock
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id TEXT, p_quantity INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
  tracks_inventory BOOLEAN;
BEGIN
  SELECT stock_quantity, track_inventory 
  INTO current_stock, tracks_inventory
  FROM public.products 
  WHERE id = p_product_id;
  
  -- If not tracking inventory, always allow
  IF NOT tracks_inventory THEN
    RETURN TRUE;
  END IF;
  
  -- Check if enough stock
  IF current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;
  
  -- Decrement stock
  UPDATE public.products 
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id;
  
  RETURN TRUE;
END;
$$;

-- Create view for low stock products (for admin dashboard)
CREATE OR REPLACE VIEW public.low_stock_products AS
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