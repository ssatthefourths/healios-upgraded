import { Column, Img, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, spacing, typography } from "../tokens";

export interface Ingredient {
  label: string;
  value?: string;
}

interface IngredientCalloutProps {
  /**
   * Hero product image. Supply at 1200×1200 (square). On a warm neutral
   * surface with space around the product for label lines.
   */
  imageUrl?: string;
  imageAlt?: string;
  /** Top eyebrow label — e.g. "THE THINKING BEHIND IT". */
  eyebrow?: string;
  /** 3-6 ingredient callouts displayed as a grid beneath the product. */
  ingredients: Ingredient[];
}

/**
 * IngredientCallout — AG1's ingredient-callout block reimagined for email.
 * Because radiating label lines don't render consistently across email clients,
 * we use a clean grid of labelled attributes beneath a hero product shot.
 *
 * Ideal for Wellness Drive / educational content and product launches that
 * need to communicate active ingredients and formulation.
 */
export const IngredientCallout: React.FC<IngredientCalloutProps> = ({
  imageUrl = assets.placeholder(1200, 1200, "Ingredient hero 1200×1200"),
  imageAlt = "Healios ingredient",
  eyebrow,
  ingredients,
}) => {
  // Chunk into rows of 2 for legibility on mobile
  const rows: Ingredient[][] = [];
  for (let i = 0; i < ingredients.length; i += 2) {
    rows.push(ingredients.slice(i, i + 2));
  }

  return (
    <Section
      style={{
        backgroundColor: colors.bg,
        padding: `${spacing.xxl} 0 ${spacing.xxl} 0`,
      }}
    >
      {eyebrow && (
        <Text
          style={{
            ...typography.eyebrow,
            color: colors.textSecondary,
            textAlign: "center",
            margin: `0 0 ${spacing.l} 0`,
          }}
        >
          {eyebrow}
        </Text>
      )}

      <Img
        src={imageUrl}
        alt={imageAlt}
        width={layout.containerWidth}
        height={600}
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          display: "block",
          margin: `0 auto ${spacing.xl} auto`,
        }}
      />

      <Section style={{ padding: `0 ${layout.contentPaddingX}` }}>
        {rows.map((row, i) => (
          <Row key={i} style={{ marginBottom: spacing.m }}>
            {row.map((ing) => (
              <Column
                key={ing.label}
                style={{
                  width: "50%",
                  padding: `${spacing.s} ${spacing.m}`,
                  borderTop: `1px solid ${colors.border}`,
                  verticalAlign: "top",
                }}
              >
                <Text
                  style={{
                    ...typography.eyebrow,
                    color: colors.textSecondary,
                    margin: `0 0 ${spacing.xs} 0`,
                  }}
                >
                  {ing.label}
                </Text>
                {ing.value && (
                  <Text
                    style={{
                      ...typography.bodyS,
                      color: colors.textPrimary,
                      margin: 0,
                    }}
                  >
                    {ing.value}
                  </Text>
                )}
              </Column>
            ))}
            {row.length === 1 && <Column style={{ width: "50%" }} />}
          </Row>
        ))}
      </Section>
    </Section>
  );
};
