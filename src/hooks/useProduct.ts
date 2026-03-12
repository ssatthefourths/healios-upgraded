import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import logger from '@/lib/logger';

type Product = Tables<'products'>;

export const useProduct = (productId: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Try to find by id first, then by slug
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .or(`id.eq.${productId},slug.eq.${productId}`)
        .eq('is_published', true)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load product');
        logger.error('Error fetching product', fetchError, { productId });
      } else if (!data) {
        setError('Product not found');
      } else {
        setProduct(data);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};
