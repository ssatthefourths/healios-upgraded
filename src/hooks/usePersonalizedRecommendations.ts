import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  slug: string | null;
  stock_quantity: number;
  recommendation_score: number;
  recommendation_reason: string;
}

// Get session ID for anonymous users
const getSessionId = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("analytics_session_id");
};

export const usePersonalizedRecommendations = (
  currentProductId?: string,
  limit: number = 6
) => {
  const { user } = useAuth();
  const sessionId = getSessionId();

  return useQuery({
    queryKey: ["personalized-recommendations", user?.id, sessionId, currentProductId, limit],
    queryFn: async (): Promise<RecommendedProduct[]> => {
      const { data, error } = await supabase.rpc("get_personalized_recommendations", {
        p_user_id: user?.id || null,
        p_session_id: sessionId,
        p_current_product_id: currentProductId || null,
        p_limit: limit,
      });

      if (error) {
        console.error("Failed to fetch recommendations:", error);
        throw error;
      }

      return (data as RecommendedProduct[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
