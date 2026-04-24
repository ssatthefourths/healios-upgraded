/**
 * Sample product data for template previews.
 * Pulled from /Healios/products.json. Servaas should replace this with live
 * data from the Healios API or a Resend merge-variable pattern at send time.
 */
import type { ProductGridItem } from "../components";

export const sampleProducts: Record<string, ProductGridItem> = {
  magnesium: {
    name: "Magnesium Gummies",
    category: "VITAMINS & MINERALS",
    price: "£18.99",
    href: "https://www.thehealios.com/product/magnesium",
  },
  vitaminD3: {
    name: "Vitamin D3 4000 IU",
    category: "VITAMINS & MINERALS",
    price: "£14.99",
    href: "https://www.thehealios.com/product/vitamin-d3",
  },
  ashwagandha: {
    name: "Ashwagandha Gummies",
    category: "ADAPTOGENS",
    price: "£24.99",
    href: "https://www.thehealios.com/product/ashwagandha",
  },
  haloGlow: {
    name: "Halo Glow Collagen",
    category: "BEAUTY",
    price: "£28.99",
    href: "https://www.thehealios.com/product/halo-glow",
  },
  acvGinger: {
    name: "ACV & Ginger Gummies",
    category: "DIGESTIVE HEALTH",
    price: "£15.99",
    href: "https://www.thehealios.com/product/acv-ginger",
  },
  probiotic: {
    name: "Probiotic Complex",
    category: "GUT HEALTH",
    price: "£22.99",
    href: "https://www.thehealios.com/product/probiotic",
  },
};

export const bestsellerGrid: ProductGridItem[] = [
  sampleProducts.magnesium,
  sampleProducts.haloGlow,
  sampleProducts.vitaminD3,
  sampleProducts.ashwagandha,
];
