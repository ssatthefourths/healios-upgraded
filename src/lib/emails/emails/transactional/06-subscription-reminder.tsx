import { Section, Text } from "@react-email/components";
import * as React from "react";
import {
  Button,
  Footer,
  Header,
  Hero,
  OrderSummary,
  type LineItem,
} from "../../components";
import { Layout } from "../../components/Layout";
import { colors, layout, spacing, typography } from "../../tokens";

interface SubscriptionReminderProps {
  customerName?: string;
  shipDate?: string;
  chargeAmount?: string;
  items?: LineItem[];
  subtotal?: string;
  shipping?: string;
  total?: string;
  manageUrl?: string;
  skipUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const SubscriptionReminder: React.FC<SubscriptionReminderProps> = ({
  customerName = "Monique",
  shipDate = "Monday 5 May",
  chargeAmount = "£40.75",
  items = defaultItems,
  subtotal = "£43.98",
  shipping = "£0.00",
  total = "£40.75",
  manageUrl = "https://www.thehealios.com/account/subscriptions",
  skipUrl = "https://www.thehealios.com/account/subscriptions/skip",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`Your next Healios shipment is on ${shipDate}.`}>
    <Header />
    <Hero
      eyebrow={`NEXT SHIPMENT · ${shipDate}`}
      headline="Your routine is ready."
      italicWord="routine"
      body={`We'll be charging ${chargeAmount} on ${shipDate} and shipping shortly after. Need to change anything?`}
      ctaLabel="Manage subscription"
      ctaHref={manageUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Subscription+hero+1200%C3%971400&font=playfair"
    />
    <OrderSummary
      items={items}
      subtotal={subtotal}
      shipping={shipping}
      total={total}
    />
    <Section
      style={{
        padding: `${spacing.l} ${layout.contentPaddingX} ${spacing.xxl} ${layout.contentPaddingX}`,
        textAlign: "center",
      }}
    >
      <Text
        style={{
          ...typography.bodyS,
          color: colors.textSecondary,
          margin: `0 0 ${spacing.m} 0`,
        }}
      >
        Need to take a month off?
      </Text>
      <Button href={skipUrl} variant="secondary">
        Skip this shipment
      </Button>
    </Section>
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

const defaultItems: LineItem[] = [
  { name: "Magnesium Gummies", quantity: 1, price: "£18.99", variant: "60 gummies · monthly" },
  { name: "Vitamin D3 4000 IU", quantity: 1, price: "£14.99", variant: "60 gummies · monthly" },
  { name: "Halo Glow Collagen", quantity: 1, price: "£9.99", variant: "Sample size" },
];

SubscriptionReminder.displayName = "06 · Subscription Reminder";
export default SubscriptionReminder;
