import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Button, Footer, Header, Spacer } from "../../components";
import { Layout } from "../../components/Layout";
import { colors, layout, spacing, typography } from "../../tokens";

interface PasswordResetProps {
  customerName?: string;
  resetUrl?: string;
  expiryMinutes?: number;
  ipAddress?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({
  customerName = "Monique",
  resetUrl = "https://www.thehealios.com/account/reset?token=PLACEHOLDER",
  expiryMinutes = 30,
  ipAddress = "82.24.x.x · London, UK",
  unsubscribeUrl,
  preferencesUrl,
}) => (
  <Layout preview="Reset your Healios password.">
    <Header />
    <Section
      style={{
        padding: `${spacing.xxl} ${layout.contentPaddingX}`,
        textAlign: "center",
      }}
    >
      <Text
        style={{
          ...typography.eyebrow,
          color: colors.textSecondary,
          margin: `0 0 ${spacing.m} 0`,
        }}
      >
        ACCOUNT SECURITY
      </Text>
      <h1
        style={{
          ...typography.displayL,
          color: colors.textPrimary,
          margin: `0 0 ${spacing.l} 0`,
        }}
      >
        Let's get you back in,{" "}
        <em style={{ fontStyle: "italic", fontWeight: 500 }}>{customerName}</em>.
      </h1>
      <Text
        style={{
          ...typography.bodyM,
          color: colors.textPrimary,
          opacity: 0.85,
          margin: `0 auto ${spacing.xl} auto`,
          maxWidth: "440px",
        }}
      >
        Click below to choose a new password. The link expires in {expiryMinutes} minutes.
      </Text>
      <Button href={resetUrl}>Reset password</Button>
      <Spacer size="l" />
      <Text
        style={{
          ...typography.caption,
          color: colors.textSecondary,
          margin: `${spacing.xl} auto 0 auto`,
          maxWidth: "440px",
        }}
      >
        Didn't request this? You can ignore this email — your password stays unchanged.
        Requested from {ipAddress}. If this wasn't you, reach out to hello@thehealios.com right away.
      </Text>
    </Section>
    <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
  </Layout>
);

PasswordReset.displayName = "04 · Password Reset";
export default PasswordReset;
