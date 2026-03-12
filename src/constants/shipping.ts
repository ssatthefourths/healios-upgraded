/**
 * Shipping configuration constants
 * Centralized shipping options to avoid hardcoded strings throughout the codebase
 */

export const SHIPPING_METHODS = {
  STANDARD: {
    id: "standard",
    label: "Standard Shipping",
    description: "Free delivery",
    price: 0,
    estimatedDays: "3-5 business days",
  },
  EXPRESS: {
    id: "express",
    label: "Express Shipping",
    description: "Fast delivery",
    price: 5.99,
    estimatedDays: "1-2 business days",
  },
  OVERNIGHT: {
    id: "overnight",
    label: "Overnight Delivery",
    description: "Next business day",
    price: 9.99,
    estimatedDays: "Next business day",
  },
} as const;

export type ShippingMethodId = keyof typeof SHIPPING_METHODS;
export type ShippingMethod = (typeof SHIPPING_METHODS)[ShippingMethodId];

/**
 * Get shipping cost by method ID
 */
export function getShippingCost(methodId: string): number {
  switch (methodId) {
    case SHIPPING_METHODS.EXPRESS.id:
      return SHIPPING_METHODS.EXPRESS.price;
    case SHIPPING_METHODS.OVERNIGHT.id:
      return SHIPPING_METHODS.OVERNIGHT.price;
    case SHIPPING_METHODS.STANDARD.id:
    default:
      return SHIPPING_METHODS.STANDARD.price;
  }
}

/**
 * Supported shipping countries
 */
export const SHIPPING_COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
] as const;

export type ShippingCountryCode = (typeof SHIPPING_COUNTRIES)[number]["code"];
