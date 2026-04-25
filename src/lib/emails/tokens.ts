/**
 * Healios Email Design Tokens
 * ---------------------------
 * The single source of truth for all visual decisions in the email system.
 * Every component and template imports from this file. Change a value here
 * and it cascades everywhere.
 *
 * Extracted from thehealios.com on 2026-04-23. If the brand evolves, update
 * these tokens — do not hard-code values in components.
 */

export const colors = {
  // Text
  textPrimary: "#242428", // warm charcoal — body copy and primary headlines
  textSecondary: "#6D6D78", // muted — captions, metadata, timestamps
  textTertiary: "#3D3D43", // slightly softer than primary, used sparingly
  textInverse: "#FBFAF9", // on dark backgrounds
  textMuted: "#9A9AA3", // disclaimers, legal, unsubscribe

  // Surfaces
  bg: "#FBFAF9", // page background — warm bone
  surface: "#F1F0EE", // cards, dividers, product tiles
  surfaceSubtle: "#F7F6F4", // very light surface for subtle separation
  white: "#FFFFFF",
  black: "#141413",

  // Borders
  border: "#E8E6E3",
  borderSubtle: "#EFEDEA",

  // Button states (no brand accent — color comes from photography)
  btnPrimaryBg: "#242428",
  btnPrimaryText: "#FBFAF9",
  btnSecondaryBg: "#FFFFFF",
  btnSecondaryText: "#242428",
  btnSecondaryBorder: "#E8E6E3",
} as const;

export const fonts = {
  display: "'Playfair Display', Georgia, 'Times New Roman', serif",
  body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  // Google Fonts imports — referenced in Layout component <Head>
  googleFontsUrl:
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap",
} as const;

export const typography = {
  // Display (Playfair Display)
  displayXL: {
    fontFamily: fonts.display,
    fontSize: "40px",
    lineHeight: "46px",
    fontWeight: 400,
    letterSpacing: "-0.8px",
  },
  displayL: {
    fontFamily: fonts.display,
    fontSize: "32px",
    lineHeight: "38px",
    fontWeight: 400,
    letterSpacing: "-0.64px",
  },
  displayM: {
    fontFamily: fonts.display,
    fontSize: "26px",
    lineHeight: "32px",
    fontWeight: 400,
    letterSpacing: "-0.5px",
  },

  // Editorial labels — UPPERCASE with wide tracking
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: 500,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
  },
  sectionLabel: {
    fontFamily: fonts.body,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
  },

  // Body (DM Sans)
  bodyL: {
    fontFamily: fonts.body,
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: 400,
  },
  bodyM: {
    fontFamily: fonts.body,
    fontSize: "16px",
    lineHeight: "24px",
    fontWeight: 400,
  },
  bodyS: {
    fontFamily: fonts.body,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 400,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: 400,
  },

  // Button
  button: {
    fontFamily: fonts.body,
    fontSize: "13px",
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
  },

  // Product title
  productTitle: {
    fontFamily: fonts.body,
    fontSize: "16px",
    lineHeight: "22px",
    fontWeight: 500,
  },
  productPrice: {
    fontFamily: fonts.body,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
  },
} as const;

export const spacing = {
  xs: "4px",
  s: "8px",
  m: "16px",
  l: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",
} as const;

export const radius = {
  s: "8px",
  m: "12px",
  l: "16px",
  pill: "999px",
} as const;

export const layout = {
  // 600px is the safe rendering width across Gmail, Apple Mail, Outlook
  containerWidth: 600,
  contentPaddingX: "32px",
  contentPaddingY: "40px",
} as const;

/**
 * Image asset host. Real images will replace placeholders once the photo
 * shoot wraps. Placeholder service renders neutral warm greys matching the
 * Healios palette so previews don't look garish.
 */
export const assets = {
  imageHost: "https://placehold.co",
  placeholder: (
    w: number,
    h: number,
    label = "healios",
    bg = "F1F0EE",
    fg = "9A9AA3",
  ) =>
    `${assets.imageHost}/${w}x${h}/${bg}/${fg}?text=${encodeURIComponent(label)}&font=playfair`,

  // Logos served from the Cloudflare Pages deploy at thehealios.com so emails
  // render the real brand mark instead of the placehold.co preview image.
  // The dark/light variants share the same source for now — Monique's brand
  // pack only supplies one logo. Swap when she ships a reversed variant.
  logoDark:
    "https://www.thehealios.com/healios-logo.png",
  logoLight:
    "https://www.thehealios.com/healios-logo.png",

  // Social icons — swap for final SVG-exported PNGs
  iconInstagram:
    "https://placehold.co/48x48/FBFAF9/242428?text=IG",
  iconTiktok:
    "https://placehold.co/48x48/FBFAF9/242428?text=TT",
  iconYoutube:
    "https://placehold.co/48x48/FBFAF9/242428?text=YT",
} as const;

export const brand = {
  name: "Healios",
  tagline: "Wellness, Elevated.",
  shortDesc:
    "Science-backed gummy supplements that help you sleep deeper, think clearer, and feel your best, every single day.",
  pillars: ["PREMIUM QUALITY", "UK MADE", "SCIENCE-BACKED"],
  supportEmail: "hello@thehealios.com",
  website: "https://www.thehealios.com",
  currency: {
    gbp: "£",
    zar: "R",
    usd: "$",
    eur: "€",
  },
  legalAddress:
    "Healios Ltd · Registered in England · Unit 1, 1 Example Road, London, UK",
} as const;

export type Tokens = {
  colors: typeof colors;
  fonts: typeof fonts;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  assets: typeof assets;
  brand: typeof brand;
};
