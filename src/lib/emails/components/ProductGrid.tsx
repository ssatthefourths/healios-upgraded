import {
  Column,
  Heading,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, radius, spacing, typography } from "../tokens";

export interface ProductGridItem {
  name: string;
  category?: string;
  price: string;
  imageUrl?: string;
  href: string;
}

interface ProductGridProps {
  title?: string;
  subtitle?: string;
  products: ProductGridItem[];
}

/**
 * ProductGrid — 2×2 (or 2×N) grid of product tiles. Each tile is a square
 * pack shot on warm surface with category eyebrow, product name, and price.
 * Clicking anywhere on a tile follows the product href.
 *
 * Pass 2–6 products. For 4+ products the grid wraps to a second row.
 */
export const ProductGrid: React.FC<ProductGridProps> = ({
  title = "BESTSELLERS",
  subtitle = "Our most-loved supplements",
  products,
}) => {
  // Chunk into rows of 2
  const rows: ProductGridItem[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  return (
    <Section
      style={{
        padding: `${spacing.xxl} ${layout.contentPaddingX}`,
      }}
    >
      {title && (
        <Text
          style={{
            ...typography.sectionLabel,
            color: colors.textPrimary,
            margin: `0 0 ${spacing.xs} 0`,
          }}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={{
            ...typography.bodyM,
            color: colors.textSecondary,
            margin: `0 0 ${spacing.xl} 0`,
          }}
        >
          {subtitle}
        </Text>
      )}

      {rows.map((row, rowIdx) => (
        <Row
          key={rowIdx}
          style={{ marginBottom: spacing.l }}
        >
          {row.map((p) => (
            <Column
              key={p.href}
              style={{
                width: "50%",
                padding: `0 ${spacing.s}`,
                verticalAlign: "top",
              }}
            >
              <Link href={p.href} style={{ textDecoration: "none" }}>
                <Section
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radius.l,
                    padding: spacing.m,
                    textAlign: "center",
                  }}
                >
                  <Img
                    src={
                      p.imageUrl ??
                      assets.placeholder(560, 560, `${p.name} pack shot`)
                    }
                    alt={p.name}
                    width="240"
                    height="240"
                    style={{
                      width: "100%",
                      maxWidth: "240px",
                      height: "auto",
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                </Section>
                {p.category && (
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.textSecondary,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      margin: `${spacing.m} 0 ${spacing.xs} 0`,
                    }}
                  >
                    {p.category}
                  </Text>
                )}
                <Heading
                  as="h3"
                  style={{
                    ...typography.productTitle,
                    color: colors.textPrimary,
                    margin: `0 0 ${spacing.xs} 0`,
                  }}
                >
                  {p.name}
                </Heading>
                <Text
                  style={{
                    ...typography.productPrice,
                    color: colors.textPrimary,
                    margin: 0,
                  }}
                >
                  {p.price}
                </Text>
              </Link>
            </Column>
          ))}
          {/* If odd number of products on final row, pad the last cell */}
          {row.length === 1 && <Column style={{ width: "50%" }} />}
        </Row>
      ))}
    </Section>
  );
};
