import { Heading, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, spacing, typography } from "../tokens";
import { Button } from "./Button";

interface HeroProps {
  eyebrow?: string;
  headline: string;
  /**
   * Pass a specific word to render in italic serif inside the headline.
   * e.g. headline="What Magnesium brings to your routine."
   *      italicWord="routine"
   * → the word "routine" (only) is rendered in italic.
   */
  italicWord?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Full 1200x1400 hero image (supplied at 2x, rendered at 600x700). */
  imageUrl?: string;
  imageAlt?: string;
  /** Background color behind the hero content. Default is bone. */
  bg?: string;
  /** Text color on the hero. Default is charcoal. Use cream on dark bg. */
  textColor?: string;
}

/**
 * Hero block. This is the module equivalent of AG1's top-of-email section:
 *   eyebrow (tiny uppercase label) →
 *   big serif headline with an italic accent word →
 *   short body paragraph →
 *   primary CTA →
 *   hero lifestyle image beneath
 *
 * The italic accent word is the signature typographic move — e.g. "Wellness,
 * Elevated." is exactly this pattern. Pass `italicWord` to apply it.
 */
export const Hero: React.FC<HeroProps> = ({
  eyebrow,
  headline,
  italicWord,
  body,
  ctaLabel,
  ctaHref,
  imageUrl = assets.placeholder(1200, 1400, "Hero image 1200×1400"),
  imageAlt = "Healios",
  bg = colors.bg,
  textColor = colors.textPrimary,
}) => {
  const renderedHeadline = italicWord
    ? renderHeadlineWithItalic(headline, italicWord)
    : headline;

  return (
    <Section style={{ backgroundColor: bg }}>
      <Section
        style={{
          padding: `${spacing.xxxl} ${layout.contentPaddingX} ${spacing.xxl}`,
          textAlign: "center",
        }}
      >
        {eyebrow && (
          <Text
            style={{
              ...typography.eyebrow,
              color: textColor,
              margin: `0 0 ${spacing.m} 0`,
            }}
          >
            {eyebrow}
          </Text>
        )}
        <Heading
          as="h1"
          style={{
            ...typography.displayL,
            color: textColor,
            margin: `0 0 ${spacing.l} 0`,
          }}
        >
          {renderedHeadline}
        </Heading>
        {body && (
          <Text
            style={{
              ...typography.bodyM,
              color: textColor,
              opacity: 0.85,
              margin: `0 auto ${spacing.xl} auto`,
              maxWidth: "440px",
            }}
          >
            {body}
          </Text>
        )}
        {ctaLabel && ctaHref && (
          <Button href={ctaHref} variant="primary">
            {ctaLabel}
          </Button>
        )}
      </Section>
      {imageUrl && (
        <Img
          src={imageUrl}
          alt={imageAlt}
          width={layout.containerWidth}
          height={700}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            maxWidth: `${layout.containerWidth}px`,
          }}
        />
      )}
    </Section>
  );
};

/**
 * Renders a headline with exactly one italic word using Playfair Display.
 * Falls back to the original headline if the word isn't found.
 */
function renderHeadlineWithItalic(
  headline: string,
  italicWord: string,
): React.ReactNode {
  const idx = headline.toLowerCase().indexOf(italicWord.toLowerCase());
  if (idx === -1) return headline;
  const before = headline.slice(0, idx);
  const match = headline.slice(idx, idx + italicWord.length);
  const after = headline.slice(idx + italicWord.length);
  return (
    <>
      {before}
      <em style={{ fontStyle: "italic", fontWeight: 500 }}>{match}</em>
      {after}
    </>
  );
}
