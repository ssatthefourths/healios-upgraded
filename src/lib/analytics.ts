// GA4 Analytics utility functions

const COOKIE_CONSENT_KEY = "healios-cookie-consent";

/**
 * Check if user has granted cookie consent
 */
export const hasAnalyticsConsent = (): boolean => {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
};

/**
 * Track newsletter signup event (GA4 generate_lead + custom newsletter_signup)
 * @param email - The email address (will not be sent to GA, used for dedup only)
 * @param source - Where the signup occurred
 */
export const trackNewsletterSignup = (
  source: "popup" | "footer" | "checkout" | "other"
): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  // GA4 recommended event for lead generation
  window.gtag("event", "generate_lead", {
    currency: "GBP",
    value: 5, // Estimated value of a newsletter subscriber
    source: source,
  });

  // Custom event for more granular tracking
  window.gtag("event", "newsletter_signup", {
    event_category: "engagement",
    event_label: source,
    signup_source: source,
  });
};

/**
 * Track GA4 e-commerce view_item_list event
 * Fired when a user views a list of products (category page, search results)
 */
export const trackViewItemList = (
  listId: string,
  listName: string,
  items: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    index: number;
  }>
): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  window.gtag("event", "view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      price: item.price,
      index: item.index,
      quantity: 1,
    })),
  });
};

/**
 * Track GA4 e-commerce select_item event
 * Fired when a user clicks on a product from a list
 */
export const trackSelectItem = (
  listId: string,
  listName: string,
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    index: number;
  }
): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  window.gtag("event", "select_item", {
    item_list_id: listId,
    item_list_name: listName,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        index: product.index,
        quantity: 1,
      },
    ],
  });
};

/**
 * Track GA4 e-commerce view_item event
 */
export const trackViewItem = (product: {
  id: string;
  name: string;
  category: string;
  price: number;
}): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  window.gtag("event", "view_item", {
    currency: "GBP",
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity: 1,
      },
    ],
  });
};

/**
 * Track GA4 e-commerce add_to_cart event
 */
export const trackAddToCart = (
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
  },
  quantity: number,
  isSubscription: boolean
): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  const price = isSubscription ? product.price * 0.85 : product.price;

  window.gtag("event", "add_to_cart", {
    currency: "GBP",
    value: price * quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: price,
        quantity: quantity,
        item_variant: isSubscription ? "subscription" : "one-time",
      },
    ],
  });
};

/**
 * Track GA4 e-commerce begin_checkout event
 */
export const trackBeginCheckout = (
  items: Array<{
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }>,
  coupon?: string
): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  const value = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  window.gtag("event", "begin_checkout", {
    currency: "GBP",
    value: value,
    coupon: coupon || undefined,
    items: items.map((item, index) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category || "unknown",
      price: item.price,
      quantity: item.quantity,
      index: index,
    })),
  });
};

/**
 * Track GA4 e-commerce purchase event (with deduplication)
 */
export const trackPurchase = (
  orderId: string,
  items: Array<{
    id: string;
    name: string;
    category?: string;
    price: number;
    quantity: number;
  }>,
  total: number,
  shipping: number,
  coupon?: string
): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  // Deduplicate - check if already tracked this session
  const purchaseKey = `ga4_purchase_${orderId}`;
  if (sessionStorage.getItem(purchaseKey)) return;
  sessionStorage.setItem(purchaseKey, "true");

  // Calculate VAT (20% included in UK prices)
  const vatAmount = total - total / 1.2;

  window.gtag("event", "purchase", {
    transaction_id: orderId,
    currency: "GBP",
    value: total,
    tax: vatAmount,
    shipping: shipping,
    coupon: coupon || undefined,
    items: items.map((item, index) => ({
      item_id: item.id,
      item_name: item.name,
      item_category: item.category || "unknown",
      price: item.price,
      quantity: item.quantity,
      index: index,
    })),
  });
};

/**
 * Set GA4 user_id for cross-device tracking
 * Should be called when user logs in
 */
export const setAnalyticsUserId = (userId: string): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId) return;

  window.gtag("config", gaId, {
    user_id: userId,
  });

  // Also set as user property for more flexible reporting
  window.gtag("set", "user_properties", {
    user_id: userId,
  });
};

/**
 * Clear GA4 user_id on logout
 * Resets to anonymous tracking
 */
export const clearAnalyticsUserId = (): void => {
  if (!window.gtag) return;

  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId) return;

  window.gtag("config", gaId, {
    user_id: undefined,
  });

  window.gtag("set", "user_properties", {
    user_id: undefined,
  });
};

/**
 * Track login event
 */
export const trackLogin = (method: "email" | "google" | "other" = "email"): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  window.gtag("event", "login", {
    method: method,
  });
};

/**
 * Track signup event
 */
export const trackSignUp = (method: "email" | "google" | "other" = "email"): void => {
  if (!hasAnalyticsConsent() || !window.gtag) return;

  window.gtag("event", "sign_up", {
    method: method,
  });
};
