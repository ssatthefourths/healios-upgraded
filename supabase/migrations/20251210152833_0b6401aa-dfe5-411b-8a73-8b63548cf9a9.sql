-- Add bundle support fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_bundle boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bundle_products text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bundle_discount_percent integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.products.is_bundle IS 'Whether this product is a bundle of other products';
COMMENT ON COLUMN public.products.bundle_products IS 'Array of product IDs included in this bundle';
COMMENT ON COLUMN public.products.bundle_discount_percent IS 'Discount percentage applied to bundle vs individual items';