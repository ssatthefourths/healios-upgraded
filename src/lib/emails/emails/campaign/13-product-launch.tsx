import * as React from "react";
import {
  BigCTA,
  EditorialCard,
  Footer,
  Header,
  Hero,
  IngredientCallout,
  PillarStrip,
  type Ingredient,
} from "../../components";
import { Layout } from "../../components/Layout";

interface ProductLaunchProps {
  productName?: string;
  tagline?: string;
  price?: string;
  productUrl?: string;
  launchIngredients?: Ingredient[];
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Product launch — the AG1-structure hero campaign. This is the template that
 * most closely mirrors the reference we worked from:
 *   Hero intro →
 *   Editorial "thinking behind it" card →
 *   Ingredient callouts with the new formulation →
 *   Closing CTA
 */
export const ProductLaunch: React.FC<ProductLaunchProps> = ({
  productName = "Deep Sleep Gummies",
  tagline = "Rest, rebuilt.",
  price = "£22.99",
  productUrl = "https://www.thehealios.com/product/deep-sleep",
  launchIngredients = defaultIngredients,
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`New from Healios: ${productName}.`}>
    <Header />
    <Hero
      eyebrow="NEW FROM HEALIOS"
      headline={tagline}
      italicWord={tagline.split(",").pop()?.trim().replace(".", "") ?? "rebuilt"}
      body={`${productName} — a clinically-formulated blend to help you fall asleep faster and stay asleep longer.`}
      ctaLabel={`Shop — ${price}`}
      ctaHref={productUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Launch+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <EditorialCard
      eyebrow="THE THINKING BEHIND IT"
      headline={`Why we made ${productName}.`}
      body="Most sleep aids either knock you out or leave you foggy. We wanted something in between — a blend that quiets the mind without numbing it, built around ingredients with real clinical backing."
      backgroundImage="https://placehold.co/1200x1000/F1F0EE/9A9AA3?text=Editorial+backdrop+1200%C3%971000&font=playfair"
    />
    <IngredientCallout
      eyebrow="WHAT'S INSIDE"
      ingredients={launchIngredients}
      imageUrl="https://placehold.co/1200x1200/F1F0EE/9A9AA3?text=Ingredient+hero+1200%C3%971200&font=playfair"
    />
    <BigCTA
      eyebrow={`LAUNCHING TODAY · ${price}`}
      headline="Shop now, first batch."
      italicWord="first"
      body="First run of 1,200 jars — we make small batches to keep freshness peak. Free shipping over £40."
      ctaLabel={`Shop ${productName}`}
      ctaHref={productUrl}
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

const defaultIngredients: Ingredient[] = [
  { label: "MAGNESIUM GLYCINATE", value: "200mg — supports muscle relaxation" },
  { label: "L-THEANINE", value: "100mg — calms without drowsiness" },
  { label: "MONTMORENCY CHERRY", value: "Natural source of melatonin" },
  { label: "PASSIONFLOWER", value: "Traditionally used for sleep quality" },
];

ProductLaunch.displayName = "13 · Product Launch";
export default ProductLaunch;
