/**
 * Product category constants
 * Centralized category slugs and mappings to avoid hardcoded strings
 */

export const CATEGORY_SLUGS = {
  ALL: "all",
  SHOP: "shop",
  VITAMINS_MINERALS: "vitamins-minerals",
  ADAPTOGENS: "adaptogens",
  DIGESTIVE_HEALTH: "digestive-health",
  SLEEP_RELAXATION: "sleep-relaxation",
  BEAUTY: "beauty",
  WOMENS_HEALTH: "womens-health",
  NEW_IN: "new-in",
  BEST_SELLERS: "best-sellers",
  BUNDLES: "bundles",
} as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[keyof typeof CATEGORY_SLUGS];

/**
 * Maps URL slugs to database category names
 */
export const CATEGORY_MAP: Record<string, string> = {
  [CATEGORY_SLUGS.VITAMINS_MINERALS]: "Vitamins & Minerals",
  [CATEGORY_SLUGS.ADAPTOGENS]: "Adaptogens",
  [CATEGORY_SLUGS.DIGESTIVE_HEALTH]: "Digestive Health",
  [CATEGORY_SLUGS.SLEEP_RELAXATION]: "Sleep & Relaxation",
  [CATEGORY_SLUGS.BEAUTY]: "Beauty",
  [CATEGORY_SLUGS.WOMENS_HEALTH]: "Women's Health",
  [CATEGORY_SLUGS.BUNDLES]: "Bundles",
};

/**
 * Category display configuration
 */
export const CATEGORY_CONFIG = {
  [CATEGORY_SLUGS.ALL]: {
    title: "All Products",
    description: "Browse our complete range of science-backed supplements",
  },
  [CATEGORY_SLUGS.VITAMINS_MINERALS]: {
    title: "Vitamins & Minerals",
    description: "Essential nutrients for everyday wellness",
  },
  [CATEGORY_SLUGS.ADAPTOGENS]: {
    title: "Adaptogens",
    description: "Natural stress relief and balance",
  },
  [CATEGORY_SLUGS.DIGESTIVE_HEALTH]: {
    title: "Digestive Health",
    description: "Support your gut health naturally",
  },
  [CATEGORY_SLUGS.SLEEP_RELAXATION]: {
    title: "Sleep & Relaxation",
    description: "Rest better, recover stronger",
  },
  [CATEGORY_SLUGS.BEAUTY]: {
    title: "Beauty",
    description: "Glow from within",
  },
  [CATEGORY_SLUGS.NEW_IN]: {
    title: "New Arrivals",
    description: "The latest additions to our collection",
  },
  [CATEGORY_SLUGS.BEST_SELLERS]: {
    title: "Best Sellers",
    description: "Our most loved products",
  },
  [CATEGORY_SLUGS.BUNDLES]: {
    title: "Bundles & Stacks",
    description: "Curated combinations for maximum benefit",
  },
} as const;

/**
 * Navigation menu items with categories
 */
export const NAV_CATEGORIES = [
  { name: "All Products", href: `/category/${CATEGORY_SLUGS.ALL}` },
  { name: "Vitamins & Minerals", href: `/category/${CATEGORY_SLUGS.VITAMINS_MINERALS}` },
  { name: "Adaptogens", href: `/category/${CATEGORY_SLUGS.ADAPTOGENS}` },
  { name: "Digestive Health", href: `/category/${CATEGORY_SLUGS.DIGESTIVE_HEALTH}` },
  { name: "Sleep & Relaxation", href: `/category/${CATEGORY_SLUGS.SLEEP_RELAXATION}` },
] as const;
