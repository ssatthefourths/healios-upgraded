import {
  Column,
  Hr,
  Img,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { assets, colors, layout, radius, spacing, typography } from "../tokens";

export interface LineItem {
  name: string;
  quantity: number;
  price: string;
  imageUrl?: string;
  variant?: string;
}

interface OrderSummaryProps {
  items: LineItem[];
  subtotal: string;
  shipping: string;
  discount?: string;
  total: string;
  orderNumber?: string;
}

/**
 * OrderSummary — used in order confirmation, shipping confirmation, and
 * abandoned cart templates. Renders line items with pack shot + name +
 * quantity, followed by subtotal / shipping / total rows.
 */
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  discount,
  total,
  orderNumber,
}) => (
  <Section
    style={{
      padding: `${spacing.xl} ${layout.contentPaddingX}`,
      backgroundColor: colors.bg,
    }}
  >
    <Section
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.l,
        padding: spacing.xl,
      }}
    >
      {orderNumber && (
        <Text
          style={{
            ...typography.eyebrow,
            color: colors.textSecondary,
            margin: `0 0 ${spacing.m} 0`,
          }}
        >
          ORDER {orderNumber}
        </Text>
      )}

      {items.map((item, idx) => (
        <Row key={idx} style={{ marginBottom: spacing.m }}>
          <Column style={{ width: "72px", verticalAlign: "top" }}>
            <Img
              src={
                item.imageUrl ??
                assets.placeholder(128, 128, item.name.slice(0, 12))
              }
              alt={item.name}
              width="64"
              height="64"
              style={{
                borderRadius: radius.s,
                backgroundColor: colors.surface,
                display: "block",
              }}
            />
          </Column>
          <Column style={{ verticalAlign: "top", paddingLeft: spacing.m }}>
            <Text
              style={{
                ...typography.productTitle,
                color: colors.textPrimary,
                margin: `0 0 ${spacing.xs} 0`,
              }}
            >
              {item.name}
            </Text>
            {item.variant && (
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                  margin: `0 0 ${spacing.xs} 0`,
                }}
              >
                {item.variant}
              </Text>
            )}
            <Text
              style={{
                ...typography.caption,
                color: colors.textSecondary,
                margin: 0,
              }}
            >
              Qty {item.quantity}
            </Text>
          </Column>
          <Column
            style={{
              width: "80px",
              verticalAlign: "top",
              textAlign: "right",
            }}
          >
            <Text
              style={{
                ...typography.productPrice,
                color: colors.textPrimary,
                margin: 0,
              }}
            >
              {item.price}
            </Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: colors.border, margin: `${spacing.l} 0` }} />

      <TotalRow label="Subtotal" value={subtotal} />
      <TotalRow label="Shipping" value={shipping} />
      {discount && <TotalRow label="Discount" value={discount} />}
      <TotalRow label="Total" value={total} emphasize />
    </Section>
  </Section>
);

const TotalRow: React.FC<{
  label: string;
  value: string;
  emphasize?: boolean;
}> = ({ label, value, emphasize }) => (
  <Row style={{ marginBottom: spacing.xs }}>
    <Column>
      <Text
        style={{
          ...(emphasize ? typography.productTitle : typography.bodyS),
          color: colors.textPrimary,
          margin: 0,
        }}
      >
        {label}
      </Text>
    </Column>
    <Column style={{ textAlign: "right" }}>
      <Text
        style={{
          ...(emphasize ? typography.productTitle : typography.bodyS),
          color: colors.textPrimary,
          margin: 0,
        }}
      >
        {value}
      </Text>
    </Column>
  </Row>
);

/**
 * AddressBlock — small reusable block rendering a postal address. Used
 * alongside OrderSummary in shipping / delivery confirmations.
 */
export const AddressBlock: React.FC<{
  title: string;
  name: string;
  lines: string[];
}> = ({ title, name, lines }) => (
  <Section style={{ padding: `0 0 ${spacing.m} 0` }}>
    <Text
      style={{
        ...typography.eyebrow,
        color: colors.textSecondary,
        margin: `0 0 ${spacing.s} 0`,
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        ...typography.bodyM,
        color: colors.textPrimary,
        margin: 0,
      }}
    >
      {name}
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          <br />
          {line}
        </React.Fragment>
      ))}
    </Text>
  </Section>
);
