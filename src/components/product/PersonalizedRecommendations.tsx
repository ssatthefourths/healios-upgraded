import { Link } from "react-router-dom";
import { usePersonalizedRecommendations } from "@/hooks/usePersonalizedRecommendations";
import { useProductRatings } from "@/hooks/useProductRatings";
import { useCurrency } from "@/contexts/CurrencyContext";
import OptimizedImage from "@/components/ui/optimized-image";
import StarRating from "@/components/product/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PersonalizedRecommendationsProps {
  currentProductId?: string;
  title?: string;
  limit?: number;
}

const PersonalizedRecommendations = ({
  currentProductId,
  title = "Recommended for You",
  limit = 6,
}: PersonalizedRecommendationsProps) => {
  const { data: products, isLoading } = usePersonalizedRecommendations(
    currentProductId,
    limit
  );
  const { formatPrice } = useCurrency();

  const productIds = products?.map((p) => p.id) || [];
  const ratings = useProductRatings(productIds);

  const formatCategory = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <section className="w-full px-6 mb-16">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full px-md mb-xl">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-lg font-medium text-foreground mb-md uppercase tracking-widest">{title}</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-sm md:gap-md">
          {products.map((product) => {
            const rating = ratings[product.id];
            const productUrl = product.slug
              ? `/product/${product.slug}`
              : `/product/${product.id}`;

            return (
              <Link
                key={product.id}
                to={productUrl}
                className="group block space-y-sm"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-muted rounded-card overflow-hidden">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.03]"
                  />

                  {/* Recommendation reason badge */}
                  <div className="absolute bottom-sm left-sm right-sm">
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-background/90 backdrop-blur-sm text-muted-foreground font-normal truncate max-w-full rounded-md"
                    >
                      {product.recommendation_reason}
                    </Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-xs">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {formatCategory(product.category)}
                  </p>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </h3>
                  <p className="text-sm font-medium text-foreground">
                    {formatPrice(product.price)}
                  </p>

                  {/* Rating */}
                  {rating && rating.count > 0 && (
                    <div className="pt-1">
                      <StarRating
                        rating={rating.average}
                        reviewCount={rating.count}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PersonalizedRecommendations;
