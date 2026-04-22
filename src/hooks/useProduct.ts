import { useState, useEffect } from 'react';
import { Tables } from '@/integrations/supabase/types';
import logger from '@/lib/logger';

type Product = Tables<'products'>;

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

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

      try {
        const res = await fetch(`${API_URL}/products/${encodeURIComponent(productId)}`);
        if (res.status === 404) {
          setError('Product not found');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError('Failed to load product');
          logger.error('Error fetching product', { status: res.status, productId });
          setLoading(false);
          return;
        }
        const data = await res.json() as Product;
        setProduct(data);
      } catch (err) {
        setError('Failed to load product');
        logger.error('Error fetching product', err, { productId });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
};
