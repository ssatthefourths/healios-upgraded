import * as React from "react";
import {
  BigCTA,
  EditorialCard,
  Footer,
  Header,
  Hero,
  PillarStrip,
  ProductGrid,
} from "../../components";
import { Layout } from "../../components/Layout";
import { bestsellerGrid } from "../../data/sampleProducts";

interface PromoProps {
  /** E.g. "Spring Edit", "Summer Reset", "End of Year". */
  occasion?: string;
  /** Headline discount — keep this rare and seasonal, not permanent. */
  discountPct?: number;
  discountCode?: string;
  endsOn?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Promotional offer — the sitewide sale template. Kept visually restrained
 * on purpose: Healios isn't a discount brand, and the email shouldn't feel
 * like one. The editorial frame stays intact; the discount is the reward for
 * reading, not the reason to read.
 */
export const Promo: React.FC<PromoProps> = ({
  occasion = "Spring Edit",
  discountPct = 20,
  discountCode = "SPRING20",
  endsOn = "Sunday, 3 May",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`${occasion} — ${discountPct}% off, this week only.`}>
    <Header />
    <Hero
      eyebrow={`THE ${occasion.toUpperCase()}`}
      headline={`${discountPct}% off the full range.`}
      italicWord="full"
      body={`${occasion}: a moment to reset a routine, or start a new one. ${discountPct}% off everything with ${discountCode}, through ${endsOn}.`}
      ctaLabel={`Shop with ${discountCode}`}
      ctaHref={`https://www.thehealios.com/shop?code=${discountCode}`}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Promo+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <EditorialCard
      eyebrow="OUR RARE PROMOTION"
      headline="We run these twice a year."
      italicWord="twice"
      body="Healios isn't a discount brand — we'd rather invest in formulation and shipping than run constant sales. But two moments a year we offer a real saving on the full range. This is one of them."
      noBackgroundImage
    />
    <ProductGrid
      title="WHERE PEOPLE START"
      subtitle="Our most-ordered supplements"
      products={bestsellerGrid}
    />
    <BigCTA
      eyebrow={`ENDS ${endsOn.toUpperCase()}`}
      headline={`${discountPct}% off the range.`}
      body={`Use ${discountCode} at checkout. Free shipping over £40. Applies to subscriptions too.`}
      ctaLabel="Shop the edit"
      ctaHref={`https://www.thehealios.com/shop?code=${discountCode}`}
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

Promo.displayName = "16 · Promotional Offer";
export default Promo;
