import { Section, Text } from "@react-email/components";
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
import { sampleProducts } from "../../data/sampleProducts";
import { colors, layout, spacing, typography } from "../../tokens";

interface BundleProps {
  /** Bundle title, e.g. "The Recovery Edit". */
  bundleName?: string;
  /** The routine story this bundle represents. */
  concept?: string;
  /** Price summary, e.g. "£59 (save £8)". */
  priceBadge?: string;
  bundleUrl?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Bundle / pairing — bundles as stories, not discount vehicles. Each bundle
 * represents a routine (morning, wind-down, post-workout). The email sells
 * the concept first, then shows the products inside.
 */
export const Bundle: React.FC<BundleProps> = ({
  bundleName = "The Wind-Down Edit",
  concept = "Three formulas, built for the hour before bed. Together they help quiet the mind, relax the body, and set up deeper rest.",
  priceBadge = "£58 (save £10)",
  bundleUrl = "https://www.thehealios.com/bundles/wind-down",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview={`${bundleName} — ${priceBadge}`}>
    <Header />
    <Hero
      eyebrow="THE BUNDLES"
      headline={bundleName}
      italicWord={bundleName.split(" ").pop() ?? ""}
      body={concept}
      ctaLabel={`Shop — ${priceBadge}`}
      ctaHref={bundleUrl}
      imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Bundle+hero+1200%C3%971400&font=playfair"
    />
    <PillarStrip />
    <EditorialCard
      eyebrow="HOW IT WORKS"
      headline="A routine, not a deal."
      italicWord="routine"
      body="We don't bundle to move stock — we bundle when three products work meaningfully better together than they do alone. Below: what's in this one, and why."
      noBackgroundImage
    />
    <ProductGrid
      title="WHAT'S IN THE BUNDLE"
      subtitle="Three-part evening routine"
      products={[
        sampleProducts.magnesium,
        sampleProducts.ashwagandha,
        sampleProducts.haloGlow,
      ]}
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
          margin: 0,
        }}
      >
        Bundle savings apply at checkout — no code needed.
      </Text>
    </Section>
    <BigCTA
      eyebrow={priceBadge.toUpperCase()}
      headline="Start the routine."
      italicWord="routine"
      body="Subscribe your bundle for an additional 15% off each recurring order, or order one-time."
      ctaLabel="Shop bundle"
      ctaHref={bundleUrl}
      dark
    />
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

Bundle.displayName = "17 · Bundle / Pairing";
export default Bundle;
