import * as React from "react";
import {
  BigCTA,
  Footer,
  Header,
  Hero,
  ProductGrid,
  Spacer,
} from "../../components";
import { Layout } from "../../components/Layout";
import { bestsellerGrid } from "../../data/sampleProducts";

interface DeliveryConfirmationProps {
  customerName?: string;
  orderNumber?: string;
  reviewUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({
  customerName = "Monique",
  orderNumber = "HLS-10482",
  reviewUrl = "https://www.thehealios.com/account/orders/HLS-10482/review",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview="Your Healios order has arrived.">
    <Header />
    <Hero
      eyebrow="DELIVERED"
      headline={`It's arrived, ${customerName}.`}
      italicWord="arrived"
      body="Your wellness routine is ready to start. A few days in, we'd love to hear how it's going."
      ctaLabel="Leave a review"
      ctaHref={reviewUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Delivered+hero+1200%C3%971400&font=playfair"
    />
    <Spacer />
    <ProductGrid
      title="ROUND OUT YOUR ROUTINE"
      subtitle="Customers who ordered this also loved"
      products={bestsellerGrid}
    />
    <BigCTA
      eyebrow="BUILT FOR THE LONG GAME"
      headline="Support consistency, not perfection."
      italicWord="consistency"
      body="Save 15% and never run out — start a Healios subscription from your account."
      ctaLabel="Start a subscription"
      ctaHref="https://www.thehealios.com/account/subscriptions"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

DeliveryConfirmation.displayName = "03 · Delivery Confirmation";
export default DeliveryConfirmation;
