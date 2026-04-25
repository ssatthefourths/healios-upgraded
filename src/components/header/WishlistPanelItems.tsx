import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { getProductPath } from "@/lib/productPath";
import OptimizedImage from "@/components/ui/optimized-image";

/**
 * Wishlist items rendered inside the header off-canvas Favourites panel.
 *
 * Mirrors the data-fetching pattern used by `src/components/account/WishlistSection.tsx`
 * — `useWishlist()` returns ids only, so we hydrate with a `products` query keyed
 * on the current id list.
 *
 * Self-contained: handles its own empty / loading / signed-out branches. Only the
 * "sign in" CTA is rendered upstream because it needs the off-canvas-close handler.
 */
interface ItemProduct {
  id: string;
  slug: string | null;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface WishlistPanelItemsProps {
  /** Called after a click on an item or the remove button so the off-canvas can close. */
  onItemClicked: () => void;
}

const WishlistPanelItems = ({ onItemClicked }: WishlistPanelItemsProps) => {
  const { wishlistItems, loading: wishlistLoading, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<ItemProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        return;
      }
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, price, image, category')
        .in('id', wishlistItems);
      if (cancelled) return;
      if (!error && data) {
        // Preserve the wishlist add order so the most-recent additions stay near the top.
        const order = new Map(wishlistItems.map((id, idx) => [id, idx]));
        const sorted = [...data].sort(
          (a: any, b: any) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
        );
        setProducts(sorted as ItemProduct[]);
      }
      setLoadingProducts(false);
    };
    run();
    return () => { cancelled = true; };
  }, [wishlistItems]);

  if (wishlistLoading || loadingProducts) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        You haven't added any favourites yet. Browse our collection and click the heart icon
        to save items you love.
      </p>
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {products.map((p) => (
        <li key={p.id} className="flex items-center gap-3 border border-border p-3 group">
          <Link
            to={getProductPath(p)}
            onClick={onItemClicked}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden bg-muted">
              <OptimizedImage
                src={p.image}
                alt={p.name}
                aspectRatio="square"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-light text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(Number(p.price))}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={(e) => toggleWishlist(p.id, e)}
            aria-label={`Remove ${p.name} from favourites`}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default WishlistPanelItems;
