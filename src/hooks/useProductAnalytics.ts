import { useCallback } from "react";

type EventType = "view" | "add_to_cart" | "purchase" | "wishlist_add" | "wishlist_remove";

export const useProductAnalytics = () => {
  const trackEvent = useCallback(
    async (_productId: string, _eventType: EventType, _metadata?: Record<string, unknown>) => {
      // Intentionally a no-op. Page-level analytics is handled by Cloudflare Web
      // Analytics (see index.html). Per-product event tracking will move to a
      // dedicated worker endpoint when the product team needs those stats.
    },
    []
  );

  const trackView = useCallback((productId: string) => trackEvent(productId, "view"), [trackEvent]);
  const trackAddToCart = useCallback(
    (productId: string, quantity: number = 1, isSubscription: boolean = false) =>
      trackEvent(productId, "add_to_cart", { quantity, isSubscription }),
    [trackEvent]
  );
  const trackPurchase = useCallback(
    (productId: string, quantity: number, price: number) =>
      trackEvent(productId, "purchase", { quantity, price }),
    [trackEvent]
  );
  const trackWishlistAdd = useCallback(
    (productId: string) => trackEvent(productId, "wishlist_add"),
    [trackEvent]
  );
  const trackWishlistRemove = useCallback(
    (productId: string) => trackEvent(productId, "wishlist_remove"),
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
