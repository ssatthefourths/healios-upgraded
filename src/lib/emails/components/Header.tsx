import { Img, Section } from "@react-email/components";
import * as React from "react";
import { assets, colors, spacing } from "../tokens";

interface HeaderProps {
  /**
   * "dark" shows the dark mark on a light header background (default).
   * "light" shows the cream mark on a dark header background.
   */
  variant?: "dark" | "light";
}

/**
 * Logo header. Sits at the top of every email. Lowercase "healios" serif
 * wordmark, center-aligned, with generous vertical breathing room.
 */
export const Header: React.FC<HeaderProps> = ({ variant = "dark" }) => {
  const isDark = variant === "light";
  const bg = isDark ? colors.black : colors.white;
  const src = isDark ? assets.logoLight : assets.logoDark;

  return (
    <Section
      style={{
        backgroundColor: bg,
        padding: `${spacing.xl} 0`,
        textAlign: "center",
      }}
    >
      <Img
        src={src}
        alt="Healios"
        width="120"
        height="30"
        style={{ margin: "0 auto", display: "block" }}
      />
    </Section>
  );
};
