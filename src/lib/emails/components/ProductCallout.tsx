import { Heading, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, radius, spacing, typography } from "../tokens";
import { Button } from "./Button";

interface ProductCalloutProps {
  name: string;
  category?: string;
  description?: string;
  price: string;
  imageUrl?: string;
  href: string;
  ctaLabel?: string;
}

/**
 * ProductCallout — a single featured product block. Used in abandoned cart,
 * restock alert, launch, and post-purchase emails. Square product image on
 * warm surface, product name in DM Sans, price below, primary CTA.
 */
export const ProductCallout: React.FC<ProductCalloutProps> = ({
  name,
  category,
  description,
  price,
  imageUrl = assets.placeholder(1200, 1200, `${name} pack shot`),
  href,
  ctaLabel = "Shop now",
}) => (
  <Section
    style={{
      padding: `${spacing.xl} ${layout.contentPaddingX}`,
      textAlign: "center",
    }}
  >
    <Section
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.l,
        padding: spacing.xl,
        textAlign: "center",
      }}
    >
      <Img
        src={imageUrl}
        alt={name}
        width="320"
        height="320"
        style={{
          width: "320px",
          height: "320px",
          maxWidth: "100%",
          display: "block",
          margin: "0 auto",
          borderRadius: radius.m,
        }}
      />
    </Section>

    {category && (
      <Text
        style={{
          ...typography.eyebrow,
          color: colors.textSecondary,
          margin: `${spacing.l} 0 ${spacing.xs} 0`,
        }}
      >
        {category}
      </Text>
    )}
    <Heading
      as="h3"
      style={{
        ...typography.displayM,
        color: colors.textPrimary,
        margin: `${spacing.s} 0 ${spacing.s} 0`,
      }}
    >
      {name}
    </Heading>
    {description && (
      <Text
        style={{
          ...typography.bodyM,
          color: colors.textPrimary,
          opacity: 0.8,
          margin: `0 auto ${spacing.m} auto`,
          maxWidth: "420px",
        }}
      >
        {description}
      </Text>
    )}
    <Text
      style={{
        ...typography.productPrice,
        color: colors.textPrimary,
        margin: `0 0 ${spacing.l} 0`,
      }}
    >
      {price}
    </Text>
    <Button href={href} variant="primary">
      {ctaLabel}
    </Button>
  </Section>
);
