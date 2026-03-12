import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type WishlistItem = Tables<'wishlist'>;

export const wishlistService = {
  async getByUser(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map((item) => item.product_id);
    } catch (error) {
      logger.error(`Failed to fetch wishlist for user ${userId}`, error);
      throw error;
    }
  },

  async add(userId: string, productId: string): Promise<WishlistItem> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .insert([{ user_id: userId, product_id: productId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to add product ${productId} to wishlist`, error);
      throw error;
    }
  },

  async remove(userId: string, productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) throw error;
    } catch (error) {
      logger.error(`Failed to remove product ${productId} from wishlist`, error);
      throw error;
    }
  },

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      logger.error(`Failed to check wishlist status for product ${productId}`, error);
      throw error;
    }
  },
};
