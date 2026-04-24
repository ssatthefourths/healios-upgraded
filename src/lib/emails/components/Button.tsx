import { Button as REButton } from "@react-email/components";
import * as React from "react";
import { colors, radius, typography } from "../tokens";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  /**
   * Display as block-level (full-width container) vs inline.
   */
  block?: boolean;
}

/**
 * The Healios button. Uppercase label, tight tracking, rounded (16px) — not
 * a full pill. Matches the primary CTA on thehealios.com.
 *
 * Variants:
 *   primary   — dark charcoal fill, cream text. The default call to action.
 *   secondary — white fill, charcoal text, thin border. Softer action.
 *   ghost     — no fill, charcoal text, underline. Inline tertiary action.
 */
export const Button: React.FC<ButtonProps> = ({
  href,
  children,
  variant = "primary",
  block = false,
}) => {
  const style = {
    ...baseStyle,
    ...variantStyle[variant],
    ...(block ? { display: "block", width: "100%", textAlign: "center" as const } : {}),
  };
  return (
    <REButton href={href} style={style}>
      {children}
    </REButton>
  );
};

const baseStyle: React.CSSProperties = {
  ...typography.button,
  color: colors.btnPrimaryText,
  backgroundColor: colors.btnPrimaryBg,
  borderRadius: radius.l,
  padding: "14px 24px",
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid transparent",
};

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors.btnPrimaryBg,
    color: colors.btnPrimaryText,
  },
  secondary: {
    backgroundColor: colors.btnSecondaryBg,
    color: colors.btnSecondaryText,
    border: `1px solid ${colors.btnSecondaryBorder}`,
  },
  ghost: {
    backgroundColor: "transparent",
    color: colors.textPrimary,
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
};
