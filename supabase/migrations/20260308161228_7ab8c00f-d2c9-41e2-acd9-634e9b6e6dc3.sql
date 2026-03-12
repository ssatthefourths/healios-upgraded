
-- Add product trait columns for dietary/lifestyle filtering
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_vegan boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_gluten_free boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_sugar_free boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_keto_friendly boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS contains_allergens text[] DEFAULT '{}';

-- Set collagen products as non-vegan (contains animal-derived collagen)
UPDATE public.products SET is_vegan = false WHERE LOWER(name) LIKE '%collagen%';
