// Meta Pixel (Facebook Pixel) utility functions

import { hasMarketingConsent } from '@/lib/consentMode';

const META_PIXEL_SCRIPT_ID = "meta-pixel-script";

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

/** Check if user has granted marketing/Meta Pixel consent */
export const hasMetaPixelConsent = hasMarketingConsent;

/**
 * Initialize Meta Pixel
 * Called only after cookie consent is granted
 */
export const initializeMetaPixel = (): void => {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  
  if (!pixelId) {
    if (import.meta.env.DEV) {
      console.warn("Meta Pixel ID not configured (VITE_META_PIXEL_ID)");
    }
    return;
  }
  
  // Check if already initialized
  if (document.getElementById(META_PIXEL_SCRIPT_ID)) return;
  
  // Initialize fbq function
  const n = (window.fbq = function () {
    // eslint-disable-next-line prefer-rest-params
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  } as any);
  
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  
  // Load the pixel script
  const script = document.createElement("script");
  script.id = META_PIXEL_SCRIPT_ID;
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  
  // Initialize pixel
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
};

/**
 * Track Meta Pixel ViewContent event
 * Used on product detail pages
 */
export const trackMetaViewContent = (product: {
  id: string;
  name: string;
  category: string;
  price: number;
}): void => {
  if (!hasMetaPixelConsent() || !window.fbq) return;

  window.fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    value: product.price,
    currency: "GBP",
  });
};

/**
 * Track Meta Pixel AddToCart event
 */
export const trackMetaAddToCart = (
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
  },
  quantity: number
): void => {
  if (!hasMetaPixelConsent() || !window.fbq) return;

  window.fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    value: product.price * quantity,
    currency: "GBP",
    num_items: quantity,
  });
};

/**
 * Track Meta Pixel InitiateCheckout event
 */
export const trackMetaInitiateCheckout = (
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>,
  total: number
): void => {
  if (!hasMetaPixelConsent() || !window.fbq) return;

  window.fbq("track", "InitiateCheckout", {
    content_ids: items.map((item) => item.id),
    contents: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })),
    content_type: "product",
    value: total,
    currency: "GBP",
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
  });
};

/**
 * Track Meta Pixel Purchase event (with deduplication)
 */
export const trackMetaPurchase = (
  orderId: string,
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>,
  total: number
): void => {
  if (!hasMetaPixelConsent() || !window.fbq) return;

  // Deduplicate - check if already tracked this session
  const purchaseKey = `meta_purchase_${orderId}`;
  if (sessionStorage.getItem(purchaseKey)) return;
  sessionStorage.setItem(purchaseKey, "true");

  window.fbq("track", "Purchase", {
    content_ids: items.map((item) => item.id),
    contents: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })),
    content_type: "product",
    value: total,
    currency: "GBP",
    num_items: items.reduce((sum, item) => sum + item.quantity, 0),
    order_id: orderId,
  });
};

/**
 * Track newsletter signup / lead event
 */
export const trackMetaLead = (source: string): void => {
  if (!hasMetaPixelConsent() || !window.fbq) return;

  window.fbq("track", "Lead", {
    content_name: "Newsletter Signup",
    content_category: source,
  });
};
