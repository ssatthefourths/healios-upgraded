import { Heading, Img, Section, Text } from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, radius, spacing, typography } from "../tokens";

interface EditorialCardProps {
  eyebrow?: string;
  headline: string;
  italicWord?: string;
  body: string;
  /** Background image behind the overlaid card. Supply at 1200x1000. */
  backgroundImage?: string;
  /** If true, renders as a standalone white card without background imagery. */
  noBackgroundImage?: boolean;
}

/**
 * EditorialCard — AG1's "The thinking behind it" module. A white content card
 * sits over a soft textural image (herbs, linen, water, skin) and carries a
 * short brand paragraph.
 *
 * When `noBackgroundImage` is true, the card renders on the bone page bg
 * without a photo — useful for transactional emails that want the editorial
 * tone without needing custom photography.
 */
export const EditorialCard: React.FC<EditorialCardProps> = ({
  eyebrow,
  headline,
  italicWord,
  body,
  backgroundImage = assets.placeholder(1200, 1000, "Editorial backdrop 1200×1000"),
  noBackgroundImage = false,
}) => {
  const renderedHeadline = italicWord
    ? renderHeadlineWithItalic(headline, italicWord)
    : headline;

  // If no background image, render card on bone bg
  if (noBackgroundImage) {
    return (
      <Section
        style={{
          backgroundColor: colors.bg,
          padding: `${spacing.xxl} ${layout.contentPaddingX}`,
        }}
      >
        <CardInner
          eyebrow={eyebrow}
          headline={renderedHeadline}
          body={body}
        />
      </Section>
    );
  }

  // With background image — the card overlays the image bottom half
  return (
    <Section style={{ backgroundColor: colors.bg, position: "relative" }}>
      <Img
        src={backgroundImage}
        alt=""
        width={layout.containerWidth}
        height={500}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
      <Section
        style={{
          padding: `0 ${layout.contentPaddingX} ${spacing.xxl} ${layout.contentPaddingX}`,
          marginTop: "-120px",
        }}
      >
        <CardInner
          eyebrow={eyebrow}
          headline={renderedHeadline}
          body={body}
        />
      </Section>
    </Section>
  );
};

const CardInner: React.FC<{
  eyebrow?: string;
  headline: React.ReactNode;
  body: string;
}> = ({ eyebrow, headline, body }) => (
  <Section
    style={{
      backgroundColor: colors.white,
      padding: `${spacing.xl} ${spacing.xl}`,
      borderRadius: radius.l,
      textAlign: "center",
      border: `1px solid ${colors.borderSubtle}`,
    }}
  >
    {eyebrow && (
      <Text
        style={{
          ...typography.eyebrow,
          color: colors.textSecondary,
          margin: `0 0 ${spacing.m} 0`,
        }}
      >
        {eyebrow}
      </Text>
    )}
    <Heading
      as="h2"
      style={{
        ...typography.displayM,
        color: colors.textPrimary,
        margin: `0 0 ${spacing.m} 0`,
      }}
    >
      {headline}
    </Heading>
    <Text
      style={{
        ...typography.bodyM,
        color: colors.textPrimary,
        margin: 0,
        maxWidth: "420px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {body}
    </Text>
  </Section>
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
