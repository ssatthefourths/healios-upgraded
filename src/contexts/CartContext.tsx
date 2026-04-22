import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const CART_STORAGE_KEY = 'healios_cart';

export interface BundleCartItem {
  product_id: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  isSubscription?: boolean;
  isPreOrder?: boolean;
  preOrderLeadWeeks?: number;
  isBundle?: boolean;
  bundleItems?: BundleCartItem[];
}

interface LastAddedEvent {
  item: CartItem;
  // Monotonic counter so the header popover can tell "2x same item" from a no-op.
  sequence: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string, isSubscription?: boolean) => void;
  updateQuantity: (id: string, quantity: number, isSubscription?: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  lastAdded: LastAddedEvent | null;
  dismissLastAdded: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Load cart from sessionStorage
const loadCartFromStorage = (): CartItem[] => {
  try {
    // Clear old localStorage if it exists to avoid stale contamination
    if (localStorage.getItem(CART_STORAGE_KEY)) {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    const stored = sessionStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save cart to sessionStorage
const saveCartToStorage = (items: CartItem[]) => {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage might be full or unavailable
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [lastAdded, setLastAdded] = useState<LastAddedEvent | null>(null);

  // Sync cart to sessionStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  // Single source of truth for add-to-cart notification: the header CartPopover
  // reads `lastAdded` and shows a popover anchored under the cart icon. No
  // call-site toasts — per ticket 10.
  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(i =>
        i.id === item.id && i.isSubscription === item.isSubscription && i.isPreOrder === item.isPreOrder
      );
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id && i.isSubscription === item.isSubscription && i.isPreOrder === item.isPreOrder
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setLastAdded(prev => ({
      item: { ...item, quantity: 1 },
      sequence: (prev?.sequence ?? 0) + 1,
    }));
  }, []);

  const dismissLastAdded = useCallback(() => setLastAdded(null), []);

  const removeFromCart = useCallback((id: string, isSubscription?: boolean) => {
    setCartItems(prev => prev.filter(item => 
      !(item.id === id && item.isSubscription === isSubscription)
    ));
    toast.success('Removed from cart');
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, isSubscription?: boolean) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => 
        !(item.id === id && item.isSubscription === isSubscription)
      ));
    } else {
      setCartItems(prev => 
        prev.map(item => 
          item.id === id && item.isSubscription === isSubscription 
            ? { ...item, quantity } 
            : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      lastAdded,
      dismissLastAdded,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};