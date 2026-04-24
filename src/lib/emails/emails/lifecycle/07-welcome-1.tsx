import * as React from "react";
import {
  BigCTA,
  EditorialCard,
  Footer,
  Header,
  Hero,
  PillarStrip,
} from "../../components";
import { Layout } from "../../components/Layout";

interface Welcome1Props {
  customerName?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Welcome email 1 — brand introduction. First touchpoint after sign-up.
 * Sets the tone: editorial, considered, science-meets-craft.
 */
export const Welcome1: React.FC<Welcome1Props> = ({
  customerName = "Monique",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview="Welcome to Healios — the thinking behind it.">
    <Header />
    <Hero
      eyebrow="WELCOME"
      headline="Wellness, elevated."
      italicWord="elevated"
      body={`You're in, ${customerName}. Over the next few days, we'll share a little about who we are and what we make — no pressure to shop, just the thinking behind the brand.`}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Welcome+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <EditorialCard
      eyebrow="WHO WE ARE"
      headline="Science-backed, simply made."
      italicWord="simply"
      body="We started Healios because daily wellness shouldn't require a cabinet full of pills. Our gummies are formulated by nutritionists in the UK, using clinically-studied ingredients — and nothing you don't need."
      backgroundImage="https://placehold.co/1200x1000/F1F0EE/9A9AA3?text=Editorial+backdrop+1200%C3%971000&font=playfair"
    />
    <BigCTA
      eyebrow="NO RUSH"
      headline="Take a look around."
      body="Your inbox will stay quiet. A couple more notes from us over the coming week, then back to your schedule."
      ctaLabel="Explore Healios"
      ctaHref="https://www.thehealios.com"
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

Welcome1.displayName = "07 · Welcome 1 — Brand Intro";
export default Welcome1;
