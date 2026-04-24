/**
 * Single source of truth for all application route paths.
 * Import from here instead of hardcoding strings in Navigation, Footer, or any component.
 * Changing a route path only requires editing this file.
 */
export const ROUTES = {
  HOME: '/',

  // Products
  PRODUCT: (id: string) => `/product/${id}`,

  // Categories
  CATEGORY: {
    ALL: '/category/all',
    VITAMINS: '/category/vitamins-minerals',
    ADAPTOGENS: '/category/adaptogens',
    DIGESTIVE: '/category/digestive-health',
    SLEEP: '/category/sleep-relaxation',
    NEW_IN: '/category/new-in',
    BEST_SELLERS: '/category/best-sellers',
    BUNDLES: '/category/bundles',
  },

  // Shop extras
  SUBSCRIBE: '/subscribe',
  WELLNESS_QUIZ: '/wellness-quiz',
  GIFT_CARDS: '/gift-cards',

  // Wellness Drive
  WELLNESS_DRIVE: '/wellness-drive',
  WELLNESS_DRIVE_SUBMIT: '/wellness-drive#submit',

  // Blog
  BLOG: '/blog',
  BLOG_POST: (slug: string) => `/blog/${slug}`,

  // About
  ABOUT: {
    STORY: '/about/our-story',
    QUALITY: '/about/quality-sourcing',
    GUIDE: '/about/product-guide',
    CARE: '/about/customer-care',
    WHOLESALE: '/about/wholesale',
  },

  // Account / Auth
  AUTH: '/auth',
  ACCOUNT: '/account',
  CHECKOUT: '/checkout',

  // Info
  FAQ: '/faq',
  PRIVACY: '/privacy-policy',
  DATA_REQUEST: '/privacy/request',
  TERMS: '/terms-of-service',
  SHIPPING: '/shipping-returns',

  // Admin
  ADMIN: {
    ROOT: '/admin',
    DSR: '/admin/dsr',
    EMAILS: '/admin/emails',
    ORDERS: '/admin/orders',
    PRODUCTS: '/admin/products',
    NEWSLETTER: '/admin/newsletter',
    WELLNESS: '/admin/wellness',
    INVENTORY: '/admin/inventory',
    DISCOUNTS: '/admin/discounts',
    REVIEWS: '/admin/reviews',
    BLOG: '/admin/blog',
    ANALYTICS: '/admin/analytics',
    COHORTS: '/admin/cohorts',
    RFM: '/admin/rfm',
    CLV: '/admin/clv',
    SUBSCRIPTIONS: '/admin/subscriptions',
    CAMPAIGNS: '/admin/campaigns',
    SECURITY: '/admin/security',
    REFERRAL_SECURITY: '/admin/referral-security',
    USERS: '/admin/users',
  },
} as const;
