import { Heading, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, spacing, typography } from "../tokens";
import { Button } from "./Button";

interface BigCTAProps {
  eyebrow?: string;
  headline: string;
  italicWord?: string;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  /**
   * Optional background image. If provided, the CTA appears as an overlay
   * on a 1200×800 photograph. If omitted, CTA sits on a dark charcoal panel.
   */
  backgroundImage?: string;
  /** Force the dark-panel variant even without a background image. */
  dark?: boolean;
}

/**
 * BigCTA — the closing module of the 4-part rhythm. Strong visual break from
 * the content above, containing a final headline and primary action.
 *
 * Two variants:
 *   default (with imageUrl)   — image + overlaid text (white)
 *   dark (no imageUrl or dark=true) — charcoal panel + cream text
 */
export const BigCTA: React.FC<BigCTAProps> = ({
  eyebrow,
  headline,
  italicWord,
  body,
  ctaLabel,
  ctaHref,
  backgroundImage,
  dark = false,
}) => {
  const useImage = backgroundImage && !dark;
  const textColor = useImage ? colors.white : colors.textInverse;

  const renderedHeadline = italicWord
    ? renderHeadlineWithItalic(headline, italicWord)
    : headline;

  if (useImage) {
    return (
      <Section style={{ position: "relative", backgroundColor: colors.black }}>
        <Img
          src={backgroundImage!}
          alt=""
          width={layout.containerWidth}
          height={400}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            opacity: 0.85,
          }}
        />
        <Section
          style={{
            padding: `${spacing.xl} ${layout.contentPaddingX}`,
            textAlign: "center",
            backgroundColor: colors.black,
          }}
        >
          <CTAContent
            eyebrow={eyebrow}
            headline={renderedHeadline}
            body={body}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            textColor={textColor}
            buttonVariant="secondary"
          />
        </Section>
      </Section>
    );
  }

  // Dark panel variant
  return (
    <Section
      style={{
        backgroundColor: colors.black,
        padding: `${spacing.xxxl} ${layout.contentPaddingX}`,
        textAlign: "center",
      }}
    >
      <CTAContent
        eyebrow={eyebrow}
        headline={renderedHeadline}
        body={body}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        textColor={textColor}
        buttonVariant="secondary"
      />
    </Section>
  );
};

const CTAContent: React.FC<{
  eyebrow?: string;
  headline: React.ReactNode;
  body?: string;
  ctaLabel: string;
  ctaHref: string;
  textColor: string;
  buttonVariant: "primary" | "secondary";
}> = ({ eyebrow, headline, body, ctaLabel, ctaHref, textColor, buttonVariant }) => (
  <>
    {eyebrow && (
      <Text
        style={{
          ...typography.eyebrow,
          color: textColor,
          opacity: 0.7,
          margin: `0 0 ${spacing.m} 0`,
        }}
      >
        {eyebrow}
      </Text>
    )}
    <Heading
      as="h2"
      style={{
        ...typography.displayL,
        color: textColor,
        margin: `0 0 ${spacing.l} 0`,
      }}
    >
      {headline}
    </Heading>
    {body && (
      <Text
        style={{
          ...typography.bodyM,
          color: textColor,
          opacity: 0.85,
          margin: `0 auto ${spacing.xl} auto`,
          maxWidth: "420px",
        }}
      >
        {body}
      </Text>
    )}
    <Button href={ctaHref} variant={buttonVariant}>
      {ctaLabel}
    </Button>
  </>
);

function renderHeadlineWithItalic(
  headline: string,
  italicWord: string,
): React.ReactNode {
  const idx = headline.toLowerCase().indexOf(italicWord.toLowerCase());
  if (idx === -1) return headline;
  return (
    <>
      {headline.slice(0, idx)}
      <em style={{ fontStyle: "italic", fontWeight: 500 }}>
        {headline.slice(idx, idx + italicWord.length)}
      </em>
      {headline.slice(idx + italicWord.length)}
    </>
  );
}
