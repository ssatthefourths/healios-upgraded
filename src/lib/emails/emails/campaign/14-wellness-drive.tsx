import { Section, Text } from "@react-email/components";
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
import { colors, layout, spacing, typography } from "../../tokens";

interface WellnessDriveProps {
  title?: string;
  subtitle?: string;
  readtime?: string;
  articleUrl?: string;
  featuredProductSlug?: keyof typeof sampleProducts;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Wellness Drive — the editorial / educational template. Lead with a long-
 * form piece, then gently connect it to a featured product. Think magazine
 * cover → feature article preview → shop note. This is the one to use for
 * ingredient spotlights, routine features, and science explainers.
 */
export const WellnessDrive: React.FC<WellnessDriveProps> = ({
  title = "The quiet power of magnesium.",
  subtitle = "Why the mineral you've probably heard of does more than you think — and why most people aren't getting enough.",
  readtime = "4 min read",
  articleUrl = "https://www.thehealios.com/wellness-drive/magnesium",
  featuredProductSlug = "magnesium",
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const product = sampleProducts[featuredProductSlug];

  return (
    <Layout preview={`${title} · Wellness Drive`}>
      <Header />
      <Section
        style={{
          padding: `${spacing.xxl} ${layout.contentPaddingX} ${spacing.m} ${layout.contentPaddingX}`,
          textAlign: "center",
          backgroundColor: colors.bg,
        }}
      >
        <Text
          style={{
            ...typography.eyebrow,
            color: colors.textSecondary,
            margin: 0,
          }}
        >
          WELLNESS DRIVE · {readtime.toUpperCase()}
        </Text>
      </Section>
      <Hero
        headline={title}
        italicWord={title.split(" ").pop()?.replace(".", "") ?? ""}
        body={subtitle}
        ctaLabel="Read the piece"
        ctaHref={articleUrl}
        imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Article+hero+1200%C3%971400&font=playfair"
      />
      <EditorialCard
        eyebrow="A PREVIEW"
        headline="What we learned."
        italicWord="learned"
        body="Magnesium is involved in over 300 enzymatic reactions in the body — from muscle function to sleep quality to cardiovascular health. And yet an estimated 68% of adults don't hit the daily recommended intake. In the full piece we look at why, and what actually moves the needle."
        noBackgroundImage
      />
      <ProductCallout
        category="RELATED"
        name={product.name}
        description="If the piece resonated, this is the Healios formulation most people start with."
        price={product.price}
        href={product.href}
        ctaLabel="View product"
      />
      <BigCTA
        eyebrow="MORE FROM WELLNESS DRIVE"
        headline="Explore the full library."
        italicWord="full"
        body="Ingredient breakdowns, routine essays, conversations with our formulators — all free, all thoughtfully written."
        ctaLabel="Open Wellness Drive"
        ctaHref="https://www.thehealios.com/wellness-drive"
        dark
      />
      <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
    </Layout>
  );
};

WellnessDrive.displayName = "14 · Wellness Drive Editorial";
export default WellnessDrive;
