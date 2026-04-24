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

interface WinbackProps {
  customerName?: string;
  monthsAway?: number;
  discountCode?: string;
  discountPct?: number;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Win-back — sent to customers 60-90 days after their last order with no
 * activity since. Quiet tone (not desperate), clear incentive, reminder of
 * what they loved.
 */
export const Winback: React.FC<WinbackProps> = ({
  customerName = "Monique",
  monthsAway = 3,
  discountCode = "BACK15",
  discountPct = 15,
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`It's been a minute — here's ${discountPct}% off.`}>
    <Header />
    <Hero
      eyebrow={`${monthsAway} MONTHS LATER`}
      headline={`We miss you, ${customerName}.`}
      italicWord="miss"
      body={`Routines drift. Happens to all of us. If you're thinking about picking it back up, use ${discountCode} for ${discountPct}% off any order over £25.`}
      ctaLabel={`Use ${discountCode}`}
      ctaHref={`https://www.thehealios.com/shop?code=${discountCode}`}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Winback+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <ProductGrid
      title="WHAT'S MOVING RIGHT NOW"
      subtitle="Since you were last here"
      products={bestsellerGrid}
    />
    <BigCTA
      eyebrow="OR DON'T — NO OFFENCE TAKEN"
      headline="Rather stop hearing from us?"
      body="Totally fair. Update your preferences or unsubscribe below — we'd rather you hear from us only when it's useful."
      ctaLabel="Manage preferences"
      ctaHref="{{preferences_url}}"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

Winback.displayName = "12 · Win-back";
export default Winback;
