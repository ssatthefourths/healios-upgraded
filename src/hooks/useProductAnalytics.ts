import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type EventType = "view" | "add_to_cart" | "purchase" | "wishlist_add" | "wishlist_remove";

// Generate or retrieve session ID using cryptographically secure method
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useProductAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(
    async (
      productId: string,
      eventType: EventType,
      metadata?: Record<string, any>
    ) => {
      try {
        const sessionId = getSessionId();

        await supabase.from("product_analytics").insert({
          product_id: productId,
          event_type: eventType,
          user_id: user?.id || null,
          session_id: sessionId,
          metadata: metadata || {},
        });
      } catch (error) {
        // Silently fail - analytics should not break the app
        console.error("Failed to track analytics event:", error);
      }
    },
    [user?.id]
  );

  const trackView = useCallback(
    (productId: string) => {
      trackEvent(productId, "view");
    },
    [trackEvent]
  );

  const trackAddToCart = useCallback(
    (productId: string, quantity: number = 1, isSubscription: boolean = false) => {
      trackEvent(productId, "add_to_cart", { quantity, isSubscription });
    },
    [trackEvent]
  );

  const trackPurchase = useCallback(
    (productId: string, quantity: number, price: number) => {
      trackEvent(productId, "purchase", { quantity, price });
    },
    [trackEvent]
  );

  const trackWishlistAdd = useCallback(
    (productId: string) => {
      trackEvent(productId, "wishlist_add");
    },
    [trackEvent]
  );

  const trackWishlistRemove = useCallback(
    (productId: string) => {
      trackEvent(productId, "wishlist_remove");
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackView,
    trackAddToCart,
    trackPurchase,
    trackWishlistAdd,
    trackWishlistRemove,
  };
};
