/**
 * Brand Constants
 * Single source of truth for all brand-related information
 * Used across Footer, About pages, SEO schemas, and legal documents
 */

export const BRAND = {
  // Core Identity
  name: "The Healios Health Co.",
  shortName: "Healios",
  tagline: "Wellness Made Delicious",
  description: "Premium gummy vitamins and wellness supplements. Science-backed formulas, delicious taste.",
  
  // Founding & Legal
  foundingYear: 2024,
  country: "United Kingdom",
  countryCode: "GB",
  headquarters: "London, UK",
  
  // Contact
  email: {
    general: "hello@thehealios.com",
    support: "support@thehealios.com",
    orders: "orders@thehealios.com",
  },
  
  // Website
  website: {
    url: "https://www.thehealios.com",
    domain: "www.thehealios.com",
  },
  
  // Social Media
  socials: {
    instagram: {
      url: "https://instagram.com/thehealiosco",
      handle: "@thehealiosco",
    },
    tiktok: {
      url: "https://www.tiktok.com/@thehealiosco",
      handle: "@thehealiosco",
    },
  },
  
  // Brand Promises / Certifications
  certifications: [
    "Science-Backed Formulas",
    "Third-Party Tested",
    "Made in the UK",
    "Vegetarian Friendly",
  ],
  
  // Product Focus
  productFocus: [
    "Gummy Vitamins",
    "Wellness Supplements",
    "Adaptogens",
    "Sleep Support",
    "Digestive Health",
  ],
  
  // Assets
  assets: {
    logo: "/healios-logo.png",
    logoWhite: "/healios-logo-white.png",
    ogImage: "/images/og/healios-og.png",
  },
} as const;

// Social links array for easy iteration
export const SOCIAL_LINKS = [
  { name: "Instagram", url: BRAND.socials.instagram.url, handle: BRAND.socials.instagram.handle },
  { name: "TikTok", url: BRAND.socials.tiktok.url, handle: BRAND.socials.tiktok.handle },
] as const;

// Type exports
export type Brand = typeof BRAND;
export type SocialLink = typeof SOCIAL_LINKS[number];
