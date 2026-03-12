import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductRating {
  averageRating: number;
  reviewCount: number;
}

export const useProductRatings = (productIds: string[]) => {
  const [ratings, setRatings] = useState<Record<string, ProductRating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!productIds.length) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .eq('status', 'approved')
        .in('product_id', productIds);

      if (error) {
        setLoading(false);
        return;
      }

      const ratingsMap: Record<string, ProductRating> = {};
      
      productIds.forEach(id => {
        const productReviews = data?.filter(r => r.product_id === id) || [];
        if (productReviews.length > 0) {
          const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
          ratingsMap[id] = {
            averageRating: Math.round((sum / productReviews.length) * 10) / 10,
            reviewCount: productReviews.length
          };
        }
      });

      setRatings(ratingsMap);
      setLoading(false);
    };

    fetchRatings();
  }, [productIds.join(',')]);

  return { ratings, loading };
};
