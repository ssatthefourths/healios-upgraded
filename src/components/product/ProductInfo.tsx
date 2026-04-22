import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Minus, Plus, AlertTriangle, Check, Clock, Bell } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import WishlistButton from "./WishlistButton";
import NotifyMeButton from "./NotifyMeButton";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";
import { trackAddToCart as trackGA4AddToCart } from "@/lib/analytics";
import { trackMetaAddToCart } from "@/lib/metaPixel";
import { categoryDisplayToSlug } from "@/lib/categorySlug";

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    benefits?: any;
    stock_quantity?: number;
    low_stock_threshold?: number;
    track_inventory?: boolean;
    is_coming_soon?: boolean;
  };
}

type PurchaseType = 'one-time' | 'subscription';

const SUBSCRIPTION_DISCOUNT = 0.15;
const PRE_ORDER_DISCOUNT = 0.15;
const PRE_ORDER_LEAD_WEEKS = 3;

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('one-time');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { trackAddToCart } = useProductAnalytics();

  const isComingSoon = !!product.is_coming_soon;
  const stockQuantity = product.stock_quantity ?? 100;
  const lowStockThreshold = product.low_stock_threshold ?? 10;
  const trackInventory = product.track_inventory ?? true;
  
  const isOutOfStock = !isComingSoon && trackInventory && stockQuantity <= 0;
  const isLowStock = !isComingSoon && trackInventory && stockQuantity > 0 && stockQuantity <= lowStockThreshold;
  const maxQuantity = trackInventory ? stockQuantity : 99;

  const basePrice = Number(product.price);
  const subscriptionPrice = basePrice * (1 - SUBSCRIPTION_DISCOUNT);
  const preOrderPrice = basePrice * (1 - PRE_ORDER_DISCOUNT);
  const displayPrice = purchaseType === 'subscription' ? subscriptionPrice : basePrice;

  const incrementQuantity = () => setQuantity(prev => Math.min(prev + 1, maxQuantity));
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const categoryLabel = product.category.charAt(0).toUpperCase() + product.category.slice(1).replace(/-/g, ' ');

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    // Track internal analytics
    trackAddToCart(product.id, quantity, purchaseType === 'subscription');
    
    // Track GA4 add_to_cart event
    trackGA4AddToCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        price: displayPrice,
      },
      quantity,
      purchaseType === 'subscription'
    );
    
    // Track Meta Pixel AddToCart event
    trackMetaAddToCart(
      {
        id: product.id,
        name: product.name,
        category: product.category,
        price: displayPrice,
      },
      quantity
    );
    
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.image,
        category: product.category,
        isSubscription: purchaseType === 'subscription',
      });
    }
    toast.success(`${product.name} added to bag`);
    setQuantity(1);
  };

  const handlePreOrder = () => {
    trackAddToCart(product.id, quantity, false);
    trackGA4AddToCart(
      { id: product.id, name: product.name, category: product.category, price: preOrderPrice },
      quantity,
      false
    );
    trackMetaAddToCart(
      { id: product.id, name: product.name, category: product.category, price: preOrderPrice },
      quantity
    );
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: preOrderPrice,
        image: product.image,
        category: product.category,
        isPreOrder: true,
        preOrderLeadWeeks: PRE_ORDER_LEAD_WEEKS,
      });
    }
    setQuantity(1);
  };

  // Parse benefits from JSON - handle both string[] and object[] formats
  const rawBenefits = product.benefits;
  const benefits = Array.isArray(rawBenefits) ? rawBenefits : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb - Show only on desktop */}
      <div className="hidden lg:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/category/${categoryDisplayToSlug(product.category)}`}>{categoryLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Product title and price */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-light text-muted-foreground mb-1">{categoryLabel}</p>
            <h1 className="text-2xl md:text-3xl font-light text-foreground">{product.name}</h1>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-xl font-light text-foreground">{formatPrice(displayPrice)}</p>
              {purchaseType === 'subscription' && (
                <p className="text-xs text-muted-foreground line-through">{formatPrice(basePrice)}</p>
              )}
            </div>
            <WishlistButton
              isInWishlist={isInWishlist(product.id)}
              onClick={(e) => toggleWishlist(product.id, e)}
            />
          </div>
        </div>
      </div>

      {/* Purchase Type Toggle - hide for coming soon products */}
      {!isComingSoon && (
        <>
          <div className="border border-border rounded-none">
            <button
              onClick={() => setPurchaseType('one-time')}
              className={`w-1/2 py-3 text-sm font-light transition-colors ${
                purchaseType === 'one-time'
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              One-time
            </button>
            <button
              onClick={() => setPurchaseType('subscription')}
              className={`w-1/2 py-3 text-sm font-light transition-colors ${
                purchaseType === 'subscription'
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              Subscribe & Save 15%
            </button>
          </div>

          {purchaseType === 'subscription' && (
            <p className="text-xs text-muted-foreground">
              Delivered every 30 days. Skip, pause, or cancel anytime.
            </p>
          )}
        </>
      )}

      {/* Stock Status */}
      {isComingSoon ? (
        <div className="flex items-center gap-2 text-primary">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Coming Soon</span>
        </div>
      ) : trackInventory && (
        <div className="flex items-center gap-2">
          {isOutOfStock ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Only {stockQuantity} left in stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">In Stock</span>
            </div>
          )}
        </div>
      )}

      {/* Quantity and Add to Cart */}
      <div className="space-y-4">
        {!isComingSoon && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-light text-foreground">Quantity</span>
            <div className="flex items-center border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={decrementQuantity}
                disabled={isOutOfStock}
                className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="h-10 flex items-center px-4 text-sm font-light min-w-12 justify-center border-l border-r border-border">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={incrementQuantity}
                disabled={isOutOfStock || quantity >= maxQuantity}
                className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {trackInventory && quantity >= maxQuantity && !isOutOfStock && (
              <span className="text-xs text-muted-foreground">Max available</span>
            )}
          </div>
        )}

        {isComingSoon ? (
          <div className="space-y-4">
            {/* Pre-order option */}
            <div className="border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Pre-order & Save 15%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Order now at {formatPrice(preOrderPrice)} instead of {formatPrice(basePrice)} and receive your product within {PRE_ORDER_LEAD_WEEKS} weeks of your order date.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-light text-foreground">Quantity</span>
                <div className="flex items-center border border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decrementQuantity}
                    className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="h-10 flex items-center px-4 text-sm font-light min-w-12 justify-center border-l border-r border-border">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={incrementQuantity}
                    className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="preorder-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="preorder-terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  I understand this product is currently unavailable and may take up to 3 weeks before it becomes available for shipment.
                </label>
              </div>
              <Button
                onClick={handlePreOrder}
                disabled={!acceptedTerms}
                className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50"
              >
                Pre-order Now — {formatPrice(preOrderPrice)}
              </Button>
            </div>

            {/* Notify me option */}
            <div className="border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Prefer to wait?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Get notified when this product is in stock and ready to ship.
              </p>
              <NotifyMeButton 
                productId={product.id} 
                productName={product.name} 
              />
            </div>
          </div>
        ) : (
          <>
            <Button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50"
            >
              {isOutOfStock ? "Out of Stock" : "Add to Bag"}
            </Button>
            
            {isOutOfStock && (
              <NotifyMeButton 
                productId={product.id} 
                productName={product.name} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;