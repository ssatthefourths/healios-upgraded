-- Create products table
CREATE TABLE public.products (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (id, name, price, image, category, description) VALUES
('arcus-bracelet', 'Arcus Bracelet', 2450.00, '/arcus-bracelet.png', 'bracelets', 'A sculptural bracelet featuring our signature curved silhouette in polished gold.'),
('span-bracelet', 'Span Bracelet', 1850.00, '/span-bracelet.png', 'bracelets', 'Minimalist cuff bracelet with a bold architectural presence.'),
('eclipse-ring', 'Eclipse Ring', 3200.00, '/rings-collection.png', 'rings', 'A statement ring inspired by celestial geometry.'),
('halo-pendant', 'Halo Pendant', 2800.00, '/earrings-collection.png', 'necklaces', 'Delicate pendant necklace with a luminous circular motif.'),
('lintel-earrings', 'Lintel Earrings', 1650.00, '/earrings-collection.png', 'earrings', 'Architectural drop earrings with clean geometric lines.'),
('oblique-ring', 'Oblique Ring', 2100.00, '/rings-collection.png', 'rings', 'Angular band ring with an asymmetric silhouette.');

-- Add foreign key to wishlist
ALTER TABLE public.wishlist
ADD CONSTRAINT wishlist_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;