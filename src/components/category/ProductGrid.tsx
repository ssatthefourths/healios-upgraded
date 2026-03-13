import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import WishlistButton from "@/components/product/WishlistButton";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import StarRating from "@/components/product/StarRating";
import { useWishlist } from "@/hooks/useWishlist";
import { useProductRatings } from "@/hooks/useProductRatings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import OptimizedImage from "@/components/ui/optimized-image";
import { Bell } from "lucide-react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  is_published: boolean;
  stock_quantity?: number;
  is_coming_soon?: boolean;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

const ProductGrid = ({ products, isLoading }: ProductGridProps) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { ratings } = useProductRatings(productIds);
  const { formatPrice } = useCurrency();
  const staggerReveal = useGsapReveal({ direction: "up", distance: 30, stagger: 0.1, duration: 0.8 });

  if (isLoading) {
    return (
      <section className="w-full px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="w-full px-6 mb-16">
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No products found in this category.</p>
          <Link to="/category/shop" className="text-foreground underline hover:no-underline">
            Browse all products
          </Link>
        </div>
      </section>
    );
  }

  const formatPriceLocal = (price: number) => {
    return formatPrice(price);
  };

  const formatCategory = (category: string) => {
    return category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <section className="w-full px-md mb-[var(--space-xl)]">
      <div ref={staggerReveal} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[var(--space-md)] lg:gap-[var(--space-lg)]">
        {products.map((product) => {
          const isComingSoon = product.is_coming_soon;
          const isOutOfStock = !isComingSoon && product.stock_quantity === 0;
          return (
          <Link key={product.id} to={`/product/${product.id}`} className="group block h-full">
            <Card 
              className="border-none shadow-none bg-transparent cursor-pointer h-full"
            >
              <CardContent className="p-0 h-full flex flex-col">
                <div className="aspect-square mb-[var(--space-sm)] overflow-hidden bg-muted rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] relative transition-all duration-500">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    aspectRatio="square"
                    className={`transition-all duration-500 ease-smooth group-hover:scale-[1.03] ${isOutOfStock || isComingSoon ? 'opacity-50' : ''}`}
                  />
                  <div className="absolute inset-0 bg-black/[0.03] pointer-events-none"></div>
                  {isComingSoon && (
                    <div className="absolute top-sm left-sm bg-primary text-primary-foreground text-xs font-medium px-sm py-xs rounded-lg">
                      Coming Soon
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute top-sm left-sm bg-foreground text-background text-xs font-medium px-sm py-xs rounded-lg">
                      Sold Out
                    </div>
                  )}
                  <div className="absolute top-sm right-sm flex flex-col gap-xs items-center">
                    <WishlistButton
                      isInWishlist={isInWishlist(product.id)}
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                      size="sm"
                    />
                    {isComingSoon && (
                      <div 
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                        onClick={(e) => e.preventDefault()}
                      >
                        <NotifyMeButton
                          productId={product.id}
                          productName={product.name}
                          variant="small"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-xs">
                  <p className="text-xs font-light text-muted-foreground uppercase tracking-wider">
                    {formatCategory(product.category)}
                  </p>
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {formatPriceLocal(product.price)}
                    </p>
                    {ratings[product.id] && (
                      <StarRating 
                        rating={ratings[product.id].averageRating} 
                        reviewCount={ratings[product.id].reviewCount}
                      />
                    )}
                  </div>
                  {isOutOfStock && !isComingSoon && (
                    <div className="pt-xs" onClick={(e) => e.preventDefault()}>
                      <NotifyMeButton 
                        productId={product.id} 
                        productName={product.name}
                        variant="small"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )})}
      </div>
    </section>
  );
};

export default ProductGrid;
