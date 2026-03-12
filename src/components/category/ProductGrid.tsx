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
    <section className="w-full px-6 mb-16">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const isComingSoon = product.is_coming_soon;
          const isOutOfStock = !isComingSoon && product.stock_quantity === 0;
          return (
          <Link key={product.id} to={`/product/${product.id}`}>
            <Card 
              className="border-none shadow-none bg-transparent group cursor-pointer"
            >
              <CardContent className="p-0">
                <div className="aspect-square mb-3 overflow-hidden bg-muted/10 relative">
                  <OptimizedImage
                    src={product.image}
                    alt={product.name}
                    aspectRatio="square"
                    className={`transition-all duration-300 group-hover:scale-105 ${isOutOfStock || isComingSoon ? 'opacity-50' : ''}`}
                  />
                  <div className="absolute inset-0 bg-black/[0.03] pointer-events-none"></div>
                  {isComingSoon && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded">
                      Coming Soon
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute top-2 left-2 bg-foreground text-background text-xs font-medium px-2 py-0.5 rounded">
                      Sold Out
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-center">
                    <WishlistButton
                      isInWishlist={isInWishlist(product.id)}
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="opacity-0 group-hover:opacity-100"
                      size="sm"
                    />
                    {isComingSoon && (
                      <div 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="space-y-1">
                  <p className="text-sm font-light text-foreground/60">
                    {formatCategory(product.category)}
                  </p>
                  <h3 className="text-sm font-medium text-foreground">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-light text-foreground">
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
                    <div className="pt-2" onClick={(e) => e.preventDefault()}>
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
