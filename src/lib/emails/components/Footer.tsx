import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { assets, brand, colors, layout, spacing, typography } from "../tokens";

interface FooterProps {
  /**
   * Social links to display. Defaults to IG + TikTok + YouTube.
   * Pass `[]` to hide the social row entirely.
   */
  social?: Array<{ href: string; icon: string; label: string }>;
  /** Recipient-specific unsubscribe URL. Required by law (CAN-SPAM, GDPR). */
  unsubscribeUrl?: string;
  /** Recipient-specific manage-preferences URL. */
  preferencesUrl?: string;
}

const defaultSocial = [
  { href: "https://instagram.com/healios", icon: assets.iconInstagram, label: "Instagram" },
  { href: "https://tiktok.com/@healios", icon: assets.iconTiktok, label: "TikTok" },
  { href: "https://youtube.com/@healios", icon: assets.iconYoutube, label: "YouTube" },
];

/**
 * Footer — sits at the bottom of every email. Contains:
 *   - Small logo
 *   - Social icon row
 *   - Legal address
 *   - Unsubscribe + manage preferences links
 *
 * The unsubscribe and preferences links MUST be populated per-recipient by
 * Resend at send time. Do not hard-code them.
 */
export const Footer: React.FC<FooterProps> = ({
  social = defaultSocial,
  unsubscribeUrl = "{{unsubscribe_url}}",
  preferencesUrl = "{{preferences_url}}",
}) => (
  <Section
    style={{
      backgroundColor: colors.surface,
      padding: `${spacing.xxl} ${layout.contentPaddingX}`,
      textAlign: "center",
    }}
  >
    <Img
      src={assets.logoDark}
      alt="Healios"
      width="100"
      height="25"
      style={{ margin: "0 auto", display: "block" }}
    />

    {social.length > 0 && (
      <Row style={{ marginTop: spacing.l, marginBottom: spacing.l }}>
        <Column style={{ textAlign: "center" }}>
          {social.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              style={{ display: "inline-block", margin: `0 ${spacing.s}` }}
            >
              <Img
                src={s.icon}
                alt={s.label}
                width="24"
                height="24"
                style={{ display: "inline-block" }}
              />
            </Link>
          ))}
        </Column>
      </Row>
    )}

    <Hr
      style={{
        borderColor: colors.border,
        margin: `${spacing.l} 0`,
      }}
    />

    <Text
      style={{
        ...typography.caption,
        color: colors.textSecondary,
        margin: `0 0 ${spacing.s} 0`,
      }}
    >
      {brand.legalAddress}
    </Text>

    <Text style={{ ...typography.caption, color: colors.textSecondary, margin: 0 }}>
      <Link href={unsubscribeUrl} style={{ color: colors.textSecondary, textDecoration: "underline" }}>
        Unsubscribe
      </Link>
      {"  ·  "}
      <Link href={preferencesUrl} style={{ color: colors.textSecondary, textDecoration: "underline" }}>
        Manage preferences
      </Link>
      {"  ·  "}
      <Link href={brand.website} style={{ color: colors.textSecondary, textDecoration: "underline" }}>
        thehealios.com
      </Link>
    </Text>
  </Section>
);
