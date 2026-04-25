import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ShoppingBag } from "lucide-react";
import NotifyMeButton from "@/components/product/NotifyMeButton";
import { getProductPath } from "@/lib/productPath";

interface PairedProduct {
  id: string;
  name: string;
  image: string;
  slug: string | null;
}

interface FeaturedProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    hero_paragraph: string | null;
    slug: string | null;
    stock_quantity?: number;
    is_coming_soon?: boolean;
    compare_at_price?: number | null;
  };
  pairedProducts: PairedProduct[];
  reversed?: boolean;
}

const FeaturedProductCard = ({ product, pairedProducts, reversed = false }: FeaturedProductCardProps) => {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
  };

  const truncatedDescription = product.hero_paragraph 
    ? (() => {
        const maxLength = 280;
        if (product.hero_paragraph.length <= maxLength) return product.hero_paragraph;
        const truncated = product.hero_paragraph.slice(0, maxLength);
        const lastPeriod = truncated.lastIndexOf('.');
        return lastPeriod > 100 ? truncated.slice(0, lastPeriod + 1) : truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
      })()
    : '';

  const isComingSoon = !!product.is_coming_soon;
  const isOutOfStock = !isComingSoon && product.stock_quantity === 0;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-md md:gap-xl items-center ${reversed ? 'md:direction-rtl' : ''}`}>
      {/* Product Image */}
      <Link 
        to={getProductPath(product)}
        className={`relative aspect-square bg-muted rounded-card overflow-hidden group ${reversed ? 'md:order-2' : ''}`}
      >
        <OptimizedImage 
          src={product.image} 
          alt={product.name}
          className={`w-full h-full object-contain p-lg transition-transform duration-500 ease-smooth group-hover:scale-[1.03] ${isOutOfStock || isComingSoon ? 'opacity-50' : ''}`}
          aspectRatio="square"
        />
        {isComingSoon ? (
          <div className="absolute top-md left-md bg-primary text-primary-foreground text-xs font-medium px-md py-sm rounded-lg">
            Coming Soon
          </div>
        ) : isOutOfStock && (
          <div className="absolute top-md left-md bg-foreground text-background text-xs font-medium px-md py-sm rounded-lg">
            Sold Out
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className={`space-y-md ${reversed ? 'md:order-1 md:text-right' : ''}`}>
        <div className="space-y-xs">
          <Link to={getProductPath(product)}>
            <h3 className="text-2xl md:text-3xl font-medium tracking-tight hover:text-primary transition-colors duration-300">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <div className={`flex items-baseline gap-3 ${reversed ? 'md:justify-end' : ''}`}>
            <p className="text-xl font-medium">{formatPrice(product.price)}</p>
            {product.compare_at_price != null && product.compare_at_price > product.price && (
              <p className="text-base font-light text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </p>
            )}
          </div>
        </div>

        {truncatedDescription && (
          <p className="text-muted-foreground leading-relaxed font-light">{truncatedDescription}</p>
        )}

        {isComingSoon ? (
          <div className={`flex flex-col gap-2 ${reversed ? 'md:items-end' : ''}`}>
            <Button 
              asChild
              className={`gap-2`}
              size="lg"
            >
              <Link to={getProductPath(product)}>
                Pre-order — Save 15%
              </Link>
            </Button>
            <NotifyMeButton 
              productId={product.id} 
              productName={product.name}
              className={`w-auto ${reversed ? 'md:ml-auto' : ''}`}
            />
          </div>
        ) : isOutOfStock ? (
          <div className={`flex flex-col gap-2 ${reversed ? 'md:items-end' : ''}`}>
            <Button 
              disabled
              className={`gap-2`}
              size="lg"
            >
              Sold Out
            </Button>
            <NotifyMeButton 
              productId={product.id} 
              productName={product.name}
              className={`w-auto ${reversed ? 'md:ml-auto' : ''}`}
            />
          </div>
        ) : (
          <Button 
            onClick={handleAddToCart}
            className={`gap-2 ${reversed ? 'md:ml-auto' : ''}`}
            size="lg"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Bag
          </Button>
        )}

        {/* Pairs Well With */}
        {pairedProducts.length > 0 && (
          <div className={`pt-4 border-t border-border ${reversed ? 'md:flex md:flex-col md:items-end' : ''}`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Pairs well with</p>
            <div className={`flex gap-4 ${reversed ? 'md:justify-end' : ''}`}>
              {pairedProducts.slice(0, 2).map((paired) => (
                <Link 
                  key={paired.id}
                  to={getProductPath(paired)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-10 h-10 bg-muted/30 rounded overflow-hidden flex-shrink-0">
                    <OptimizedImage 
                      src={paired.image} 
                      alt={paired.name}
                      className="w-full h-full object-cover"
                      aspectRatio="square"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {paired.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProductCard;
