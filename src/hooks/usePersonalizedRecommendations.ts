import { useQuery } from "@tanstack/react-query";

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

export const usePersonalizedRecommendations = (
  _currentProductId?: string,
  _limit: number = 6
) => {
  return useQuery({
    queryKey: ["personalized-recommendations"],
    queryFn: async (): Promise<RecommendedProduct[]> => [],
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
