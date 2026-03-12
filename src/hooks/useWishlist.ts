import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import logger from '@/lib/logger';

// Track wishlist analytics
const trackWishlistEvent = async (productId: string, eventType: 'wishlist_add' | 'wishlist_remove', userId?: string) => {
  try {
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
    }
    
    await supabase.from("product_analytics").insert({
      product_id: productId,
      event_type: eventType,
      user_id: userId || null,
      session_id: sessionId,
      metadata: {},
    });
  } catch (error) {
    logger.error("Failed to track wishlist event", error);
  }
};

export const useWishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlistItems(data?.map(item => item.product_id) || []);
    } catch (error) {
      logger.error('Error fetching wishlist', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (productId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    const isCurrentlyInWishlist = isInWishlist(productId);
    
    // Optimistic update - update UI immediately
    if (isCurrentlyInWishlist) {
      setWishlistItems(prev => prev.filter(id => id !== productId));
    } else {
      setWishlistItems(prev => [...prev, productId]);
    }

    try {
      if (isCurrentlyInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
        trackWishlistEvent(productId, 'wishlist_remove', user.id);
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist.",
        });
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;
        trackWishlistEvent(productId, 'wishlist_add', user.id);
        toast({
          title: "Added to wishlist",
          description: "Item has been added to your wishlist.",
        });
      }
    } catch (error) {
      // Rollback optimistic update on error
      if (isCurrentlyInWishlist) {
        setWishlistItems(prev => [...prev, productId]);
      } else {
        setWishlistItems(prev => prev.filter(id => id !== productId));
      }
      
      logger.error('Error updating wishlist', error);
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, isInWishlist, toast]);

  return {
    wishlistItems,
    loading,
    isInWishlist,
    toggleWishlist,
    refetch: fetchWishlist,
  };
};
