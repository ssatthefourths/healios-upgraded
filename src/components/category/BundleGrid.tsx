import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";

interface Bundle {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compare_at_price: number | null;
  description: string;
}

interface BundleGridProps {
  bundles: Bundle[];
  isLoading: boolean;
}

const BundleGrid = ({ bundles, isLoading }: BundleGridProps) => {
  const { formatPrice } = useCurrency();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-lg mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <div className="text-center py-16 border border-border rounded-lg mt-8">
        <p className="text-muted-foreground">No bundles available yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {bundles.map((bundle) => {
        const hasSaving = bundle.compare_at_price && bundle.compare_at_price > bundle.price;
        const savingPercent = hasSaving
          ? Math.round(((Number(bundle.compare_at_price) - Number(bundle.price)) / Number(bundle.compare_at_price)) * 100)
          : 0;
        return (
          <Link key={bundle.id} to={`/bundle/${bundle.slug}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-4">
              <OptimizedImage
                src={bundle.image}
                alt={bundle.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                aspectRatio="square"
              />
              {hasSaving && (
                <Badge className="absolute top-3 left-3 bg-foreground text-background">
                  Save {savingPercent}%
                </Badge>
              )}
            </div>
            <h3 className="text-base md:text-lg font-medium text-foreground leading-tight mb-1 line-clamp-2">{bundle.name}</h3>
            <p className="text-[11px] font-light text-muted-foreground mb-2">Bundle</p>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-medium text-foreground">{formatPrice(Number(bundle.price))}</span>
              {hasSaving && (
                <span className="text-sm font-light text-muted-foreground line-through">
                  {formatPrice(Number(bundle.compare_at_price))}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default BundleGrid;
