import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Package, Truck, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { trackNewsletterSignup, trackPurchase as trackGA4Purchase } from "@/lib/analytics";
import { trackMetaPurchase, trackMetaLead } from "@/lib/metaPixel";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getProductPath } from "@/lib/productPath";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  product_category: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_subscription: boolean | null;
}

interface Order {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  shipping_method: string | null;
  created_at: string;
}

interface RecommendedProduct {
  id: string;
  slug: string | null;
  name: string;
  image: string;
  price: number;
  category: string;
}

interface OrderConfirmationProps {
  sessionId: string;
  customerEmail?: string;
  isLoggedIn: boolean;
}

const OrderConfirmation = ({ sessionId, customerEmail, isLoggedIn }: OrderConfirmationProps) => {
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState(customerEmail || "");
  const [isNewsletterSubscribed, setIsNewsletterSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSignup = async () => {
    if (!newsletterEmail.trim()) return;
    
    const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';
    setIsSubscribing(true);
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      toast.success("Welcome to our community!");
      trackNewsletterSignup("checkout");
      trackMetaLead("checkout");
      setIsNewsletterSubscribed(true);
      localStorage.setItem("healios_newsletter_subscribed", "true");
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Track purchase event after order is fetched
  const hasTrackedPurchase = useRef(false);
  useEffect(() => {
    if (order && orderItems.length > 0 && !hasTrackedPurchase.current) {
      hasTrackedPurchase.current = true;
      
      const items = orderItems.map(item => ({
        id: item.id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
        category: item.product_category || undefined,
      }));
      
      // GA4 purchase event
      trackGA4Purchase(
        order.id,
        items,
        order.total,
        order.shipping_cost
      );
      
      // Meta Pixel purchase event
      trackMetaPurchase(order.id, items, order.total);
    }
  }, [order, orderItems]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      
      try {
        // Fetch order by stripe_session_id for reliable lookup
        // This ensures we always show the correct order even with concurrent checkouts
        let query = supabase.from('orders').select('*');
        
        if (sessionId) {
          query = query.eq('stripe_session_id', sessionId);
        } else {
          // Fallback to most recent order if no session_id (legacy support)
          query = query.order('created_at', { ascending: false }).limit(1);
        }

        const { data: orders, error: orderError } = await query;

        if (orderError || !orders || orders.length === 0) {
          console.error('Error fetching order:', orderError);
          setIsLoading(false);
          return;
        }

        const matchedOrder = orders[0];
        setOrder(matchedOrder);

        // Fetch order items
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', matchedOrder.id);

        if (!itemsError && items) {
          setOrderItems(items);

          // Get product IDs to exclude from recommendations
          const purchasedIds = items.map(item => item.product_id);

          // Fetch recommendations (products not in this order)
          let recommendationsQuery = supabase
            .from('products')
            .select('id, slug, name, image, price, category')
            .eq('is_published', true)
            .gt('stock_quantity', 0);

          // Only apply exclusion filter if there are purchased IDs
          if (purchasedIds.length > 0) {
            recommendationsQuery = recommendationsQuery.not('id', 'in', `(${purchasedIds.join(',')})`);
          }

          const { data: products } = await recommendationsQuery.limit(3);

          if (products) {
            setRecommendations(products);
          }
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  const getDeliveryEstimate = () => {
    if (!order?.shipping_method) return "3-5 working days";
    switch (order.shipping_method) {
      case "express":
        return "1-2 working days";
      case "overnight":
        return "Next working day";
      default:
        return "3-5 working days";
    }
  };

  const getShippingMethodName = () => {
    if (!order?.shipping_method) return "Standard Delivery";
    switch (order.shipping_method) {
      case "express":
        return "Express Delivery";
      case "overnight":
        return "Overnight Delivery";
      default:
        return "Standard Delivery (Free)";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-5 w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Celebratory Header */}
      <div className="text-center mb-12">
        <div className="relative inline-block">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-primary animate-bounce" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-light text-foreground mb-3">
          Thank You{order?.first_name ? `, ${order.first_name}` : ''}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Your wellness essentials are on their way
        </p>
      </div>

      {/* Order Reference & Email */}
      <div className="bg-muted/30 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
            <p className="font-mono text-sm text-foreground">
              {order?.id ? `#${order.id.slice(0, 8).toUpperCase()}` : sessionId.slice(0, 12)}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-muted-foreground mb-1">Confirmation sent to</p>
            <p className="text-foreground">{order?.email || customerEmail || 'your email'}</p>
          </div>
        </div>
      </div>

      {/* Delivery Estimate */}
      <div className="border border-primary/20 bg-primary/5 p-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Truck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Expected Delivery</p>
          <p className="text-muted-foreground">
            {getDeliveryEstimate()} · {getShippingMethodName()}
          </p>
        </div>
      </div>

      {/* Order Items */}
      {orderItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Order
          </h2>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-muted/20">
                <div className="w-20 h-20 bg-muted overflow-hidden flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{item.product_name}</h3>
                  {item.product_category && (
                    <p className="text-sm text-muted-foreground">{item.product_category}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                    {!!item.is_subscription && (
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary">
                        Subscribe & Save
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-foreground font-medium">
                  {formatPrice(item.line_total)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          {order && (
            <div className="mt-4 pt-4 border-t border-muted-foreground/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">
                  {order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Free'}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-medium pt-2 border-t border-muted-foreground/20">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{formatPrice(order.total)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* What's Next */}
      <div className="bg-muted/20 p-6 mb-8">
        <h2 className="font-medium text-foreground mb-4">What's Next?</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-primary">1</span>
            </div>
            <p className="text-muted-foreground">
              We're preparing your order now and will send you a shipping confirmation with tracking details
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-primary">2</span>
            </div>
            <p className="text-muted-foreground">
              When your gummies arrive, take 2 daily with or without food for best results
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-primary">3</span>
            </div>
            <p className="text-muted-foreground">
              Stay consistent for 30 days to feel the full benefits of your wellness routine
            </p>
          </div>
        </div>
      </div>

      {/* Product Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="font-medium text-foreground mb-4">Complete Your Routine</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendations.map((product) => (
              <Link 
                key={product.id} 
                to={getProductPath(product)}
                className="group p-4 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="aspect-square bg-muted overflow-hidden mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Signup */}
      {!isNewsletterSubscribed && !localStorage.getItem("healios_newsletter_subscribed") && (
        <div className="bg-muted/30 border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-foreground">Stay in the Loop</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Get exclusive offers, wellness tips, and be the first to know about new products.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleNewsletterSignup}
              disabled={isSubscribing || !newsletterEmail.trim()}
            >
              {isSubscribing ? "..." : "Subscribe"}
            </Button>
          </div>
        </div>
      )}

      {/* Account / Continue Shopping */}
      <div className="space-y-3">
        {isLoggedIn ? (
          <Link to="/account">
            <Button className="w-full rounded-none">View Order History</Button>
          </Link>
        ) : (
          <div className="bg-primary/5 border border-primary/20 p-6 mb-4">
            <h3 className="font-medium text-foreground mb-2">Save Your Details</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create an account to track your order, manage subscriptions, and speed up future checkouts
            </p>
            <Link to="/auth?redirect=/account">
              <Button className="w-full rounded-none">Create Account</Button>
            </Link>
          </div>
        )}
        <Link to="/">
          <Button variant="outline" className="w-full rounded-none">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;
