import { useQuery } from "@tanstack/react-query";
import OptimizedImage from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getProductPath } from "@/lib/productPath";

interface BundleContentsProps {
  bundleProducts: string[];
  bundleDiscount?: number;
}

const BundleContents = ({ bundleProducts, bundleDiscount }: BundleContentsProps) => {
  const { formatPrice } = useCurrency();
  const { data: products, isLoading } = useQuery({
    queryKey: ['bundle-products', bundleProducts],
    queryFn: async () => {
      if (!bundleProducts || bundleProducts.length === 0) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, slug, category')
        .in('id', bundleProducts);
      
      if (error) throw error;
      return data || [];
    },
    enabled: bundleProducts && bundleProducts.length > 0,
  });

  if (isLoading) {
    return (
      <div className="mt-8 border-t border-border pt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) return null;

  const individualTotal = products.reduce((sum, p) => sum + Number(p.price), 0);

  return (
    <div className="mt-8 border-t border-border pt-8">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium text-foreground">What's Included</h3>
        {bundleDiscount && (
          <Badge variant="secondary" className="ml-2">
            Save {bundleDiscount}%
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {products.map((product) => (
          <Link 
            key={product.id} 
            to={getProductPath(product)}
            className="group block"
          >
            <div className="border border-border rounded-lg p-4 transition-colors hover:border-primary/50 hover:bg-muted/30">
              <div className="aspect-square mb-3 overflow-hidden rounded bg-muted">
                <OptimizedImage 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  aspectRatio="square"
                />
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPrice(Number(product.price))} individually
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">If purchased separately:</span>
          <span className="text-muted-foreground line-through">{formatPrice(individualTotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Buy as a bundle and save {formatPrice(individualTotal * (bundleDiscount || 0) / 100)}
        </p>
      </div>
    </div>
  );
};

export default BundleContents;