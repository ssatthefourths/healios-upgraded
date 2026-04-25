import { useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/product/StarRating";
import { useProductRatings } from "@/hooks/useProductRatings";
import OptimizedImage from "@/components/ui/optimized-image";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { getProductPath } from "@/lib/productPath";

interface Product {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  description: string | null;
  price: number;
  image: string;
  stock_quantity: number;
  is_coming_soon: boolean;
  compare_at_price?: number | null;
}

const ProductCarousel = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['bestseller-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, category, description, price, image, stock_quantity, is_coming_soon, compare_at_price')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(6);
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const { formatPrice, currency } = useCurrency();
  const isZAR = currency.code === 'ZAR';
  const visibleProducts = useMemo(
    () => (products || []).filter(p => isZAR || !p.name.toLowerCase().includes('halo glow')),
    [products, isZAR]
  );
  const productIds = useMemo(() => visibleProducts.map(p => p.id), [visibleProducts]);
  const { ratings } = useProductRatings(productIds);
  const staggerReveal = useGsapReveal({ direction: "up", distance: 30, stagger: 0.1, duration: 0.8 });

  if (isLoading) {
    return (
      <section className="w-full mb-16 px-page">
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-1/2 md:w-1/3 lg:w-1/4 space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-[var(--space-xl)] px-page">
      <div className="mb-[var(--space-md)]">
        <h2 className="text-lg font-medium text-foreground uppercase tracking-widest">Bestsellers</h2>
        <p className="text-sm font-light text-muted-foreground">Our most-loved supplements</p>
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="">
          {visibleProducts.map((product) => {
            const isComingSoon = !!product.is_coming_soon;
            const isOutOfStock = !isComingSoon && product.stock_quantity === 0;
            return (
            <CarouselItem
              key={product.id}
              className="basis-1/2 md:basis-1/3 lg:basis-1/4 pr-2 md:pr-4"
            >
              <Link to={getProductPath(product)} className="group block h-full">
                <Card className="border-none shadow-none bg-transparent h-full">
                  <CardContent className="p-0 h-full flex flex-col">
                    <div className="aspect-square mb-[var(--space-sm)] overflow-hidden bg-muted rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] relative transition-all duration-500">
                      <OptimizedImage
                        src={product.image}
                        alt={product.name}
                        aspectRatio="square"
                        className={`transition-all duration-500 ease-smooth group-hover:scale-[1.03] ${isOutOfStock || isComingSoon ? 'opacity-50' : ''}`}
                      />
                      <div className="absolute inset-0 bg-black/[0.03] pointer-events-none"></div>
                      {isComingSoon ? (
                        <div className="absolute top-sm left-sm bg-primary text-primary-foreground text-xs font-medium px-sm py-xs rounded-lg">
                          Coming Soon
                        </div>
                      ) : isOutOfStock && (
                        <div className="absolute top-sm left-sm bg-foreground text-background text-xs font-medium px-sm py-xs rounded-lg">
                          Sold Out
                        </div>
                      )}
                    </div>
                    <div className="space-y-xs">
                      <h3 className="text-base md:text-lg font-medium text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
                        {product.name}
                      </h3>
                      <p className="text-[11px] font-light text-muted-foreground">
                        {product.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <p className="text-base font-medium text-foreground">
                            {formatPrice(product.price)}
                          </p>
                          {product.compare_at_price != null && product.compare_at_price > product.price && (
                            <p className="text-sm font-light text-muted-foreground line-through">
                              {formatPrice(product.compare_at_price)}
                            </p>
                          )}
                        </div>
                        {ratings[product.id] && (
                          <StarRating
                            rating={ratings[product.id].averageRating}
                            reviewCount={ratings[product.id].reviewCount}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          )})}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
