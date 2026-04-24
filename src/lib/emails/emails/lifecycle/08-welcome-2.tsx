import * as React from "react";
import {
  BigCTA,
  Footer,
  Header,
  Hero,
  IngredientCallout,
  Spacer,
  type Ingredient,
} from "../../components";
import { Layout } from "../../components/Layout";

interface Welcome2Props {
  customerName?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Welcome email 2 — the formulation story. Lean into the "science-backed"
 * pillar. Shows ingredient transparency, which is a meaningful differentiator
 * for a premium supplements brand.
 */
export const Welcome2: React.FC<Welcome2Props> = ({
  customerName = "Monique",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview="What goes into a Healios gummy — and what doesn't.">
    <Header />
    <Hero
      eyebrow="HOW WE MAKE THEM"
      headline="Formulation, first."
      italicWord="first"
      body={`Hi again, ${customerName}. Today, a look at what goes into every Healios gummy — and, just as importantly, what we leave out.`}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Formulation+hero+1200%C3%971400&font=playfair"
    />
    <IngredientCallout
      eyebrow="WHAT'S INSIDE"
      ingredients={defaultIngredients}
      imageUrl="https://placehold.co/1200x1200/F1F0EE/9A9AA3?text=Ingredient+hero+1200%C3%971200&font=playfair"
    />
    <Spacer />
    <BigCTA
      eyebrow="THE SCIENCE"
      headline="Read the research."
      italicWord="research"
      body="Every ingredient we use has clinical studies behind it. Dive into our Wellness Drive for the full formulation notes."
      ctaLabel="Open Wellness Drive"
      ctaHref="https://www.thehealios.com/wellness-drive"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

const defaultIngredients: Ingredient[] = [
  { label: "ACTIVE BOTANICALS", value: "Ashwagandha KSM-66, Magnesium Glycinate, Vitamin D3" },
  { label: "NO ARTIFICIAL COLOURS", value: "Colour from fruit and vegetable extracts only" },
  { label: "LOW SUGAR", value: "Under 2g per serving — we use fruit pectin, not gelatin" },
  { label: "VEGAN FORMULAS", value: "All core SKUs are vegan and vegetarian friendly" },
  { label: "UK MADE", value: "Formulated and manufactured in the United Kingdom" },
  { label: "THIRD-PARTY TESTED", value: "Every batch independently tested for purity" },
];

Welcome2.displayName = "08 · Welcome 2 — Formulation";
export default Welcome2;
