import { Link } from "react-router-dom";
import { usePersonalizedRecommendations } from "@/hooks/usePersonalizedRecommendations";
import { useProductRatings } from "@/hooks/useProductRatings";
import { useCurrency } from "@/contexts/CurrencyContext";
import OptimizedImage from "@/components/ui/optimized-image";
import StarRating from "@/components/product/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getProductPath } from "@/lib/productPath";

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
  const { addToCart } = useCart();

  const productIds = products?.map((p) => p.id) || [];
  const ratings = useProductRatings(productIds);

  const formatCategory = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const staggerReveal = useGsapReveal({ 
    direction: "up", 
    distance: 30, 
    stagger: 0.1, 
    duration: 0.8,
    triggerDeps: [products?.length || 0]
  });

  if (isLoading) {
    return (
      <section className="w-full px-page mb-16">
        <div className="max-w-7xl mx-auto">
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
    <section className="w-full px-page mb-[var(--space-xl)]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-lg font-medium text-foreground mb-[var(--space-md)] uppercase tracking-widest">{title}</h2>

        <div ref={staggerReveal} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[var(--space-sm)] md:gap-[var(--space-md)]">
          {products.map((product) => {
            const rating = ratings[product.id];

            return (
              <Link
                key={product.id}
                to={getProductPath(product)}
                className="group block space-y-[var(--space-xs)]"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-muted rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] overflow-hidden transition-all duration-500">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.03]"
                  />

                  {/* Quick Add Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                      });
                      toast.success(`${product.name} added to bag`);
                    }}
                    className="absolute top-[var(--space-sm)] right-[var(--space-sm)] w-8 h-8 md:w-10 md:h-10 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-sm z-20"
                    aria-label="Add to bag"
                  >
                    <ShoppingBag size={14} className="md:w-4 md:h-4" />
                  </button>

                  {/* Recommendation reason badge */}
                  <div className="absolute bottom-[var(--space-sm)] left-[var(--space-sm)] right-[var(--space-sm)]">
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-background/90 backdrop-blur-sm text-muted-foreground font-normal truncate max-w-full rounded-md"
                    >
                      {product.recommendation_reason}
                    </Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-[var(--space-xs)]">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
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
