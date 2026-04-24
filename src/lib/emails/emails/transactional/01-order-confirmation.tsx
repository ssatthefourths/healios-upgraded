import * as React from "react";
import {
  AddressBlock,
  Footer,
  Header,
  Hero,
  OrderSummary,
  PillarStrip,
  Spacer,
  type LineItem,
} from "../../components";
import { Layout } from "../../components/Layout";

interface OrderConfirmationProps {
  customerName?: string;
  orderNumber?: string;
  orderDate?: string;
  items?: LineItem[];
  subtotal?: string;
  shipping?: string;
  discount?: string;
  total?: string;
  shippingAddress?: { name: string; lines: string[] };
  trackingUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  customerName = "Monique",
  orderNumber = "HLS-10482",
  orderDate = "23 April 2026",
  items = defaultItems,
  subtotal = "£43.98",
  shipping = "£3.99",
  discount,
  total = "£47.97",
  shippingAddress = defaultAddress,
  trackingUrl = "https://www.thehealios.com/account/orders/HLS-10482",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`Order confirmed — ${orderNumber}`}>
    <Header />
    <Hero
      eyebrow={`ORDER CONFIRMED · ${orderDate}`}
      headline={`Thank you, ${customerName}.`}
      italicWord={customerName}
      body="Your order is in the hands of our dispatch team. We'll send tracking as soon as it's on the way."
      ctaLabel="Track your order"
      ctaHref={trackingUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Editorial+hero+1200%C3%971400&font=playfair"
    />
    <OrderSummary
      orderNumber={orderNumber}
      items={items}
      subtotal={subtotal}
      shipping={shipping}
      discount={discount}
      total={total}
    />
    <Spacer size="l" />
    <section style={{ padding: "0 32px 32px 32px" }}>
      <AddressBlock
        title="SHIPPING TO"
        name={shippingAddress.name}
        lines={shippingAddress.lines}
      />
    </section>
    <PillarStrip />
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

OrderConfirmation.displayName = "01 · Order Confirmation";
export default OrderConfirmation;
