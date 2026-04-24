import * as React from "react";
import {
  BigCTA,
  Footer,
  Header,
  Hero,
  PillarStrip,
  ProductGrid,
} from "../../components";
import { Layout } from "../../components/Layout";
import { bestsellerGrid } from "../../data/sampleProducts";

interface Welcome3Props {
  customerName?: string;
  discountCode?: string;
  discountPct?: number;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Welcome email 3 — the gentle nudge to first purchase. After two editorial-
 * tone emails, this one finally extends the welcome incentive. Still quiet in
 * tone — not shouty — but with a clear call to action.
 */
export const Welcome3: React.FC<Welcome3Props> = ({
  customerName = "Monique",
  discountCode = "WELCOME10",
  discountPct = 10,
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`${discountPct}% off your first Healios order — here when you're ready.`}>
    <Header />
    <Hero
      eyebrow={`YOUR ${discountPct}% WELCOME GIFT`}
      headline={`When you're ready, ${customerName}.`}
      italicWord="ready"
      body={`Use ${discountCode} for ${discountPct}% off your first order. Free shipping over £40. No rush — the code is yours for 30 days.`}
      ctaLabel={`Use ${discountCode}`}
      ctaHref={`https://www.thehealios.com/shop?code=${discountCode}`}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Product+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <ProductGrid
      title="WHERE PEOPLE START"
      subtitle="Our four most-ordered supplements"
      products={bestsellerGrid}
    />
    <BigCTA
      eyebrow="NOT SURE WHERE TO BEGIN?"
      headline="Take the wellness quiz."
      italicWord="wellness"
      body="Two minutes, five questions, and a recommendation built around what you actually want to work on."
      ctaLabel="Take the quiz"
      ctaHref="https://www.thehealios.com/quiz"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

Welcome3.displayName = "09 · Welcome 3 — First Order";
export default Welcome3;
