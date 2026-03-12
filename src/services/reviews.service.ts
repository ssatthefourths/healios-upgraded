import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type ProductReview = Tables<'product_reviews'>;

export const reviewsService = {
  async getByProduct(productId: string, limit = 5, page = 1): Promise<ProductReview[]> {
    try {
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Failed to fetch reviews for product ${productId}`, error);
      throw error;
    }
  },

  async getByUser(userId: string): Promise<ProductReview[]> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error(`Failed to fetch reviews for user ${userId}`, error);
      throw error;
    }
  },

  async create(reviewData: {
    product_id: string;
    user_id: string;
    rating: number;
    review_text: string;
    image_urls?: string[];
  }): Promise<ProductReview> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert([{ ...reviewData, status: 'approved' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create review', error);
      throw error;
    }
  },

  async update(
    reviewId: string,
    updates: Partial<
      Omit<ProductReview, 'id' | 'created_at' | 'updated_at' | 'product_id' | 'user_id'>
    >
  ): Promise<ProductReview> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to update review ${reviewId}`, error);
      throw error;
    }
  },

  async delete(reviewId: string): Promise<void> {
    try {
      const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId);

      if (error) throw error;
    } catch (error) {
      logger.error(`Failed to delete review ${reviewId}`, error);
      throw error;
    }
  },

  async getAverageRating(productId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved');

      if (error) throw error;

      const reviews = data || [];
      if (reviews.length === 0) return 0;

      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      return Math.round((sum / reviews.length) * 10) / 10;
    } catch (error) {
      logger.error(`Failed to get average rating for product ${productId}`, error);
      throw error;
    }
  },
};
