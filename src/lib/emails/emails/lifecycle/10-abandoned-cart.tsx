import * as React from "react";
import {
  BigCTA,
  Footer,
  Header,
  Hero,
  OrderSummary,
  PillarStrip,
  type LineItem,
} from "../../components";
import { Layout } from "../../components/Layout";

interface AbandonedCartProps {
  customerName?: string;
  items?: LineItem[];
  subtotal?: string;
  shipping?: string;
  total?: string;
  checkoutUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const AbandonedCart: React.FC<AbandonedCartProps> = ({
  customerName = "Monique",
  items = defaultItems,
  subtotal = "£33.98",
  shipping = "£3.99",
  total = "£37.97",
  checkoutUrl = "https://www.thehealios.com/checkout?session=PLACEHOLDER",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview="Your cart is still here.">
    <Header />
    <Hero
      eyebrow="STILL HERE"
      headline={`Picking up where you left off, ${customerName}.`}
      italicWord={customerName}
      body="We saved your basket. Come back when you're ready — we're holding it for 48 hours."
      ctaLabel="Complete your order"
      ctaHref={checkoutUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Still+here+hero+1200%C3%971400&font=playfair"
    />
    <OrderSummary
      items={items}
      subtotal={subtotal}
      shipping={shipping}
      total={total}
    />
    <PillarStrip />
    <BigCTA
      eyebrow="QUESTIONS?"
      headline="We're here to help."
      body="Need help choosing, or have a question about any product? Reply to this email and our team will get back to you."
      ctaLabel="Contact support"
      ctaHref="mailto:hello@thehealios.com"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

const defaultItems: LineItem[] = [
  { name: "Magnesium Gummies", quantity: 1, price: "£18.99", variant: "60 gummies" },
  { name: "Ashwagandha Gummies", quantity: 1, price: "£24.99", variant: "60 gummies" },
];

AbandonedCart.displayName = "10 · Abandoned Cart";
export default AbandonedCart;
