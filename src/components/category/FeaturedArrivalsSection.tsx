import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FeaturedProductCard from "./FeaturedProductCard";
import { Skeleton } from "@/components/ui/skeleton";

// Featured products for UK market
const FEATURED_PRODUCT_IDS = [
  'vitamin-d3-4000iu-gummies',
  'ashwagandha-gummies', 
  'magnesium-gummies'
];

const FeaturedArrivalsSection = () => {
  // Fetch featured products
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-arrivals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, category, hero_paragraph, slug, pairs_well_with, stock_quantity')
        .in('id', FEATURED_PRODUCT_IDS)
        .eq('is_published', true);
      
      if (error) throw error;
      
      // Sort to maintain order
      return FEATURED_PRODUCT_IDS
        .map(id => data?.find(p => p.id === id))
        .filter(Boolean);
    },
  });

  // Fetch all paired products at once
  const { data: pairedProductsMap } = useQuery({
    queryKey: ['paired-products', products],
    enabled: !!products && products.length > 0,
    queryFn: async () => {
      const allPairedIds = products
        ?.flatMap(p => p.pairs_well_with || [])
        .filter((id, index, arr) => arr.indexOf(id) === index) || [];
      
      if (allPairedIds.length === 0) return {};

      const { data, error } = await supabase
        .from('products')
        .select('id, name, image, slug')
        .in('id', allPairedIds)
        .eq('is_published', true);
      
      if (error) throw error;
      
      // Create a map for easy lookup
      const map: Record<string, typeof data> = {};
      products?.forEach(product => {
        map[product.id] = (product.pairs_well_with || [])
          .map((id: string) => data?.find(p => p.id === id))
          .filter(Boolean);
      });
      
      return map;
    },
  });

  if (isLoading) {
    return (
      <section className="px-6 md:px-12 lg:px-16 py-16">
        <div className="max-w-6xl mx-auto space-y-24">
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 md:px-12 lg:px-16 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3">Latest Arrivals</h1>
          <p className="text-muted-foreground">Simple, effective wellness for every day</p>
        </div>

        {/* Featured Products */}
        <div className="space-y-24">
          {products?.map((product, index) => (
            <FeaturedProductCard
              key={product.id}
              product={product}
              pairedProducts={pairedProductsMap?.[product.id] || []}
              reversed={index % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedArrivalsSection;
