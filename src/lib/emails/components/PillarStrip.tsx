import { Column, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { brand, colors, layout, spacing, typography } from "../tokens";

interface PillarStripProps {
  /**
   * Override the default pillars. Defaults to
   * ["PREMIUM QUALITY", "UK MADE", "SCIENCE-BACKED"].
   */
  pillars?: readonly string[];
  /** Background color. Default is warm surface. */
  bg?: string;
}

/**
 * PillarStrip — horizontal row of 3 brand pillars separated by thin dots.
 * Matches the treatment below the Healios homepage hero ("PREMIUM QUALITY ·
 * UK MADE · SCIENCE-BACKED"). Small uppercase letters, wide tracking.
 */
export const PillarStrip: React.FC<PillarStripProps> = ({
  pillars = brand.pillars,
  bg = colors.surface,
}) => {
  return (
    <Section
      style={{
        backgroundColor: bg,
        padding: `${spacing.l} ${layout.contentPaddingX}`,
      }}
    >
      <Row>
        {pillars.map((pillar, i) => (
          <Column
            key={pillar}
            style={{
              textAlign: "center",
              verticalAlign: "middle",
            }}
          >
            <Text
              style={{
                ...typography.eyebrow,
                color: colors.textPrimary,
                margin: 0,
              }}
            >
              {pillar}
            </Text>
          </Column>
        ))}
      </Row>
    </Section>
  );
};
