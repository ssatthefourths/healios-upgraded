import * as React from "react";
import {
  AddressBlock,
  BigCTA,
  Footer,
  Header,
  Hero,
  OrderSummary,
  Spacer,
  type LineItem,
} from "../../components";
import { Layout } from "../../components/Layout";

interface ShippingConfirmationProps {
  customerName?: string;
  orderNumber?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  items?: LineItem[];
  subtotal?: string;
  shipping?: string;
  total?: string;
  shippingAddress?: { name: string; lines: string[] };
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const ShippingConfirmation: React.FC<ShippingConfirmationProps> = ({
  customerName = "Monique",
  orderNumber = "HLS-10482",
  carrier = "Royal Mail Tracked 48",
  trackingNumber = "AB123456789GB",
  trackingUrl = "https://track.royalmail.com/AB123456789GB",
  estimatedDelivery = "Tue 28 April",
  items = defaultItems,
  subtotal = "£43.98",
  shipping = "£3.99",
  total = "£47.97",
  shippingAddress = defaultAddress,
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`Your Healios order is on its way · ${trackingNumber}`}>
    <Header />
    <Hero
      eyebrow="ON THE WAY"
      headline={`It's shipped, ${customerName}.`}
      italicWord={customerName}
      body={`Estimated delivery ${estimatedDelivery} via ${carrier}.`}
      ctaLabel="Track parcel"
      ctaHref={trackingUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Dispatch+hero+1200%C3%971400&font=playfair"
    />
    <section style={{ padding: "32px", textAlign: "center" }}>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "12px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "#6D6D78",
          margin: "0 0 8px 0",
        }}
      >
        TRACKING NUMBER
      </p>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "20px",
          fontWeight: 500,
          color: "#242428",
          margin: 0,
          letterSpacing: "1px",
        }}
      >
        {trackingNumber}
      </p>
    </section>
    <OrderSummary
      orderNumber={orderNumber}
      items={items}
      subtotal={subtotal}
      shipping={shipping}
      total={total}
    />
    <Spacer />
    <section style={{ padding: "0 32px 32px 32px" }}>
      <AddressBlock
        title="SHIPPING TO"
        name={shippingAddress.name}
        lines={shippingAddress.lines}
      />
    </section>
    <BigCTA
      eyebrow="NEED TO MAKE A CHANGE?"
      headline="Questions about your order?"
      body="Our team is here to help — every weekday, 9am to 5pm."
      ctaLabel="Contact support"
      ctaHref="mailto:hello@thehealios.com"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

const defaultItems: LineItem[] = [
  { name: "Magnesium Gummies", quantity: 1, price: "£18.99", variant: "60 gummies" },
  { name: "Vitamin D3 4000 IU", quantity: 1, price: "£14.99", variant: "60 gummies" },
  { name: "Halo Glow Collagen", quantity: 1, price: "£9.99", variant: "Sample size" },
];

const defaultAddress = {
  name: "Monique Smith",
  lines: ["12 Example Street", "London, W1A 1AA", "United Kingdom"],
};

ShippingConfirmation.displayName = "02 · Shipping Confirmation";
export default ShippingConfirmation;
