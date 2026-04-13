import { X, Minus, Plus } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CartItem } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ShoppingBagProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, newQuantity: number, isSubscription?: boolean) => void;
  onViewFavorites?: () => void;
}

const ShoppingBag = ({ isOpen, onClose, cartItems, updateQuantity, onViewFavorites }: ShoppingBagProps) => {
  const { formatPrice } = useCurrency();
  
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // UK VAT is 20%, prices are VAT-inclusive so VAT = total - (total / 1.2)
  const vatAmount = subtotal - (subtotal / 1.2);
  return (
    <div className="fixed inset-0 z-50 h-screen">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 h-screen"
        onClick={onClose}
      />
      
      {/* Off-canvas panel */}
      <div className="absolute right-0 top-0 h-screen w-96 bg-background border-l border-border animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-light text-foreground">Shopping Bag</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-foreground hover:text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0"> {/* fixed height container */}
          {/* Cart items - Scrollable area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            {onViewFavorites && (
              <div className="md:hidden mb-6 pb-6 border-b border-border">
                <button
                  type="button"
                  onClick={onViewFavorites}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-border rounded-lg text-nav-foreground hover:text-nav-hover hover:border-nav-hover transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  <span className="text-sm font-light">View Favorites</span>
                </button>
              </div>
            )}
            
            {cartItems.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-sm text-center">
                  Your shopping bag is empty.<br />
                  Continue shopping to add items to your bag.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.isSubscription ? 'sub' : item.isPreOrder ? 'pre' : 'once'}`} className="flex gap-4">
                    <div className="w-20 h-20 bg-muted/10 rounded-lg overflow-hidden flex-shrink-0">
                      <OptimizedImage 
                        src={item.image || '/placeholder.svg'} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        aspectRatio="square"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-light text-muted-foreground">{item.category}</p>
                          <h3 className="text-sm font-medium text-foreground">{item.name}</h3>
                          {item.isSubscription && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-sm">
                              Subscribe & Save
                            </span>
                          )}
                          {item.isPreOrder && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-accent text-accent-foreground rounded-sm">
                              Pre-order · {item.preOrderLeadWeeks}-week lead time
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-light text-foreground">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center border border-border">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.isSubscription)}
                            className="p-2 hover:bg-muted/50 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 py-2 text-sm font-light min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.isSubscription)}
                            className="p-2 hover:bg-muted/50 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sticky Checkout Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-border p-6 space-y-4 bg-background">
              <div className="flex justify-between items-center">
                <span className="text-sm font-light text-foreground">Subtotal</span>
                <span className="text-sm font-medium text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic font-light">
                Shipping calculated at checkout
              </p>
              
              <div className="space-y-3 pt-2">
                <Button 
                  asChild 
                  className="w-full rounded-none tracking-widest uppercase text-xs h-12" 
                  size="lg"
                  onClick={onClose}
                >
                  <Link to="/checkout">
                    Proceed to Checkout
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full rounded-none tracking-widest uppercase text-xs h-12" 
                  size="lg"
                  onClick={onClose}
                  asChild
                >
                  <Link to="/category/shop">
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ShoppingBag;