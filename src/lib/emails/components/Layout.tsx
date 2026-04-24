import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import * as React from "react";
import { colors, fonts, layout, spacing } from "../tokens";

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
  /**
   * Optional background override for the body wrapper (the area outside the
   * 600px content container). Defaults to the warm bone page background.
   */
  bodyBg?: string;
}

/**
 * Layout is the outermost wrapper for every Healios email. It sets up:
 *  - <Html>/<Head> with font imports and metadata
 *  - Preview text (the grey subject-adjacent snippet in inboxes)
 *  - A 600px-wide content container centered on a warm bone background
 *
 * Every template begins with <Layout preview="..."> and places modules inside.
 */
export const Layout: React.FC<LayoutProps> = ({
  preview,
  children,
  bodyBg = colors.bg,
}) => (
  <Html lang="en">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
      <Font
        fontFamily="DM Sans"
        fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
        webFont={{
          url: "https://fonts.gstatic.com/s/dmsans/v15/rP2Yp2ywxg089UriI5-g7vF_fAU.woff2",
          format: "woff2",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
      <Font
        fontFamily="DM Sans"
        fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
        webFont={{
          url: "https://fonts.gstatic.com/s/dmsans/v15/rP2Cp2ywxg089UriAWCrCBamC2QX.woff2",
          format: "woff2",
        }}
        fontWeight={500}
        fontStyle="normal"
      />
      <Font
        fontFamily="Playfair Display"
        fallbackFontFamily={["Georgia", "Times New Roman", "serif"]}
        webFont={{
          url: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2",
          format: "woff2",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={bodyStyle(bodyBg)}>
      <Container style={containerStyle}>{children}</Container>
    </Body>
  </Html>
);

const bodyStyle = (bg: string): React.CSSProperties => ({
  backgroundColor: bg,
  fontFamily: fonts.body,
  margin: 0,
  padding: 0,
  color: colors.textPrimary,
  WebkitFontSmoothing: "antialiased",
});

const containerStyle: React.CSSProperties = {
  backgroundColor: colors.white,
  maxWidth: `${layout.containerWidth}px`,
  width: "100%",
  margin: "0 auto",
  padding: 0,
  borderLeft: `1px solid ${colors.borderSubtle}`,
  borderRight: `1px solid ${colors.borderSubtle}`,
};

/**
 * Spacer — invisible vertical rhythm between sections. Preferred over margins
 * because Outlook is unreliable with vertical margins on Section elements.
 */
export const Spacer: React.FC<{ size?: keyof typeof spacing }> = ({
  size = "l",
}) => (
  <Section style={{ height: spacing[size], lineHeight: spacing[size] }}>
    &nbsp;
  </Section>
);
