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

interface AccountCreatedProps {
  customerName?: string;
  firstOrderDiscountCode?: string;
  firstOrderDiscountPct?: number;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const AccountCreated: React.FC<AccountCreatedProps> = ({
  customerName = "Monique",
  firstOrderDiscountCode = "WELCOME10",
  firstOrderDiscountPct = 10,
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`${firstOrderDiscountPct}% off your first order — welcome to Healios.`}>
    <Header />
    <Hero
      eyebrow="WELCOME TO HEALIOS"
      headline={`Hello, ${customerName}.`}
      italicWord={customerName}
      body="Your account is all set up. A small welcome gift: use the code below for your first order."
      ctaLabel={`Use ${firstOrderDiscountCode}`}
      ctaHref={`https://www.thehealios.com/shop?code=${firstOrderDiscountCode}`}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Welcome+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <EditorialCard
      eyebrow="THE THINKING BEHIND IT"
      headline={`Wellness, ${"elevated"}.`}
      italicWord="elevated"
      body="Science-backed gummy supplements made in the UK, formulated to support energy, focus, and recovery — without overcomplicating your day."
      noBackgroundImage
    />
    <ProductGrid
      title="BESTSELLERS"
      subtitle="A good place to start"
      products={bestsellerGrid}
    />
    <BigCTA
      eyebrow={`YOUR ${firstOrderDiscountPct}% GIFT`}
      headline="Ready when you are."
      body={`Use code ${firstOrderDiscountCode} at checkout. Free shipping over £40.`}
      ctaLabel="Shop now"
      ctaHref={`https://www.thehealios.com/shop?code=${firstOrderDiscountCode}`}
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

AccountCreated.displayName = "05 · Account Created";
export default AccountCreated;
