import * as React from "react";
import {
  BigCTA,
  EditorialCard,
  Footer,
  Header,
  Hero,
  ProductCallout,
} from "../../components";
import { Layout } from "../../components/Layout";
import { sampleProducts } from "../../data/sampleProducts";

interface PostPurchaseProps {
  customerName?: string;
  daysSinceDelivery?: number;
  reviewUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Post-purchase / review request — sent 7-10 days after delivery. Aims to
 * capture a review while the customer's experience is fresh, then gently
 * cross-sells with a companion product suggestion.
 */
export const PostPurchase: React.FC<PostPurchaseProps> = ({
  customerName = "Monique",
  daysSinceDelivery = 10,
  reviewUrl = "https://www.thehealios.com/review/HLS-10482",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview="How's your Healios routine going?">
    <Header />
    <Hero
      eyebrow={`${daysSinceDelivery} DAYS IN`}
      headline={`How's it going, ${customerName}?`}
      italicWord="going"
      body="A few days with a new routine is usually when things start to click. We'd love to hear how it's landing — and your words help the next person decide."
      ctaLabel="Leave a review"
      ctaHref={reviewUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Review+hero+1200%C3%971400&font=playfair"
    />
    <EditorialCard
      eyebrow="A QUIET ASK"
      headline="Your review helps us stay small."
      italicWord="small"
      body="Independent reviews are how a brand like ours grows — without us needing to turn up the volume. Thank you, honestly."
      noBackgroundImage
    />
    <ProductCallout
      category="PAIRS WELL WITH"
      name={sampleProducts.haloGlow.name}
      description="Most people who love Magnesium pair it with our Halo Glow collagen — the two work beautifully together for recovery and skin."
      price={sampleProducts.haloGlow.price}
      href={sampleProducts.haloGlow.href}
      ctaLabel="View Halo Glow"
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

PostPurchase.displayName = "11 · Post-Purchase / Review";
export default PostPurchase;
