import { cloudflare as supabase } from '@/integrations/cloudflare/client';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Product = Tables<'products'>;
type ProductReview = Tables<'product_reviews'>;

export const productsService = {
  async getById(idOrSlug: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to fetch product', error);
      throw error;
    }
  },

  async getBestsellers(limit = 8): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .order('sort_order')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch bestsellers', error);
      throw error;
    }
  },

  async getByCategory(category: string, limit = 50): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('is_published', true)
        .order('sort_order')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Failed to fetch products for category ${category}`, error);
      throw error;
    }
  },

  async searchByName(query: string, limit = 20): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .eq('is_published', true)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Failed to search products with query "${query}"`, error);
      throw error;
    }
  },

  async getReviewsForProduct(
    productId: string,
    page = 1,
    pageSize = 5
  ): Promise<{ reviews: ProductReview[]; total: number }> {
    try {
      const offset = (page - 1) * pageSize;

      // Get total count
      const { count } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('status', 'approved');

      // Get paginated reviews
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      return {
        reviews: data || [],
        total: count || 0,
      };
    } catch (error) {
      logger.error(`Failed to fetch reviews for product ${productId}`, error);
      throw error;
    }
  },

  async getReviewRating(productId: string): Promise<{ avg: number; count: number }> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved');

      if (error) throw error;

      const reviews = data || [];
      const avg =
        reviews.length > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
          : 0;

      return { avg, count: reviews.length };
    } catch (error) {
      logger.error(`Failed to fetch review rating for product ${productId}`, error);
      throw error;
    }
  },

  async getPairsWellWith(productId: string): Promise<Product[]> {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('pairs_well_with')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (!product?.pairs_well_with || product.pairs_well_with.length === 0) {
        return [];
      }

      const { data: pairedProducts, error: pairsError } = await supabase
        .from('products')
        .select('*')
        .in('id', product.pairs_well_with)
        .eq('is_published', true);

      if (pairsError) throw pairsError;

      return pairedProducts || [];
    } catch (error) {
      logger.error(`Failed to fetch paired products for ${productId}`, error);
      throw error;
    }
  },
};
