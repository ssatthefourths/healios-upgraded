import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import logger from '@/lib/logger';
import { createElement } from 'react';

// Wishlist analytics no-op. Page-level analytics is handled by Cloudflare
// Web Analytics. Per-product events can move to a dedicated worker endpoint
// when the product team needs those stats.
const trackWishlistEvent = async (
  _productId: string,
  _eventType: 'wishlist_add' | 'wishlist_remove',
  _userId?: string
) => {};

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
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const redirect = encodeURIComponent(currentPath);
      toast({
        title: "Sign in to save favourites",
        description: "Your wishlist travels with your account.",
        action: createElement(
          ToastAction,
          {
            altText: 'Sign in',
            onClick: () => {
              window.location.assign(`/auth?redirect=${redirect}`);
            },
          },
          'Sign in'
        ),
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
