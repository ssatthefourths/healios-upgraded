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

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string, isSubscription?: boolean) => void;
  updateQuantity: (id: string, quantity: number, isSubscription?: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
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

  // Sync cart to sessionStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => 
        i.id === item.id && i.isSubscription === item.isSubscription && i.isPreOrder === item.isPreOrder
      );
      if (existingItem) {
        toast.success('Updated quantity in cart');
        return prev.map(i => 
          i.id === item.id && i.isSubscription === item.isSubscription && i.isPreOrder === item.isPreOrder
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      const label = item.isPreOrder ? 'Pre-order added to cart' : item.isSubscription ? 'Subscription added to cart' : 'Added to cart';
      toast.success(label);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

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