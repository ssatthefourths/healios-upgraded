/**
 * Editor field metadata for the email-template preview editor (Phase 8b.1).
 *
 * Each entry maps a template id to the props Monique can edit *live* in the
 * preview dialog. Edits flow through to the iframe via @react-email/render
 * but are NOT persisted — this is a UX prototype to validate the editor
 * model before we commit to the runtime template engine (Phase 8b.3).
 *
 * Field types are deliberately limited to text + textarea to keep the
 * prototype contained. List-shaped props (items[], launchIngredients[],
 * shippingAddress.lines) are not editable here yet — they'd need
 * specialised composite editors.
 */

export type EditorFieldType = 'text' | 'textarea' | 'url';

export interface EditorField {
  /** Prop key on the template component. */
  key: string;
  /** Human-friendly label shown above the input. */
  label: string;
  /** Field render hint. */
  type: EditorFieldType;
  /** One-line tooltip explaining what this field does. */
  hint?: string;
  /** Default value if the template has one — filled when opening the editor. */
  defaultValue?: string;
}

export const EDITOR_FIELDS: Record<string, EditorField[]> = {
  // ── Transactional ─────────────────────────────────────────────────────────
  '01-order-confirmation': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text',
      hint: 'Stub for preview only — at send time the real name is injected.', defaultValue: 'Monique' },
    { key: 'orderNumber', label: 'Order number (preview)', type: 'text', defaultValue: 'HLS-10482' },
    { key: 'orderDate', label: 'Order date (preview)', type: 'text', defaultValue: '23 April 2026' },
    { key: 'subtotal', label: 'Subtotal', type: 'text', defaultValue: '£43.98' },
    { key: 'shipping', label: 'Shipping', type: 'text', defaultValue: '£3.99' },
    { key: 'total', label: 'Total', type: 'text', defaultValue: '£47.97' },
    { key: 'trackingUrl', label: 'Tracking URL', type: 'url',
      hint: 'Linked from the "View order" CTA. Per-customer at send.' },
  ],

  '02-shipping-confirmation': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'orderNumber', label: 'Order number (preview)', type: 'text', defaultValue: 'HLS-10482' },
    { key: 'carrier', label: 'Carrier', type: 'text', defaultValue: 'Royal Mail Tracked 48' },
    { key: 'trackingNumber', label: 'Tracking number', type: 'text', defaultValue: 'AB123456789GB' },
    { key: 'trackingUrl', label: 'Tracking URL', type: 'url',
      defaultValue: 'https://track.royalmail.com/AB123456789GB' },
    { key: 'estimatedDelivery', label: 'Estimated delivery', type: 'text', defaultValue: 'Tue 28 April' },
  ],

  '03-delivery-confirmation': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'orderNumber', label: 'Order number (preview)', type: 'text', defaultValue: 'HLS-10482' },
    { key: 'reviewUrl', label: 'Review URL', type: 'url',
      hint: 'Where the "Leave a review" CTA links to.' },
  ],

  '04-password-reset': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'resetUrl', label: 'Reset URL', type: 'url',
      hint: 'Per-recipient signed token URL at send time.' },
    { key: 'expiryHours', label: 'Expiry hours', type: 'text', defaultValue: '24' },
  ],

  '05-account-created': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'accountUrl', label: 'Account URL', type: 'url',
      defaultValue: 'https://www.thehealios.com/account' },
  ],

  '06-subscription-reminder': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'productName', label: 'Product name', type: 'text', defaultValue: 'Magnesium Gummies' },
    { key: 'nextDeliveryDate', label: 'Next delivery date', type: 'text', defaultValue: '28 April 2026' },
    { key: 'manageUrl', label: 'Manage subscription URL', type: 'url' },
  ],

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  '07-welcome-1': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
  ],
  '08-welcome-2': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
  ],
  '09-welcome-3': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'discountCode', label: 'Discount code', type: 'text', defaultValue: 'WELCOME10' },
    { key: 'discountPct', label: 'Discount %', type: 'text', defaultValue: '10' },
  ],
  '10-abandoned-cart': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'cartUrl', label: 'Resume cart URL', type: 'url' },
  ],
  '11-post-purchase': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'reviewUrl', label: 'Review URL', type: 'url' },
  ],
  '12-winback': [
    { key: 'customerName', label: 'Customer name (preview)', type: 'text', defaultValue: 'Monique' },
    { key: 'discountCode', label: 'Discount code', type: 'text', defaultValue: 'COMEBACK15' },
    { key: 'discountPct', label: 'Discount %', type: 'text', defaultValue: '15' },
  ],

  // ── Campaign ──────────────────────────────────────────────────────────────
  '13-product-launch': [
    { key: 'productName', label: 'Product name', type: 'text', defaultValue: 'Deep Sleep Gummies' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Rest, rebuilt.' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '£22.99' },
    { key: 'productUrl', label: 'Product URL', type: 'url',
      defaultValue: 'https://www.thehealios.com/product/deep-sleep' },
  ],

  '14-wellness-drive': [
    { key: 'storyTitle', label: 'Story title', type: 'text' },
    { key: 'storyExcerpt', label: 'Story excerpt', type: 'textarea' },
    { key: 'storyUrl', label: 'Story URL', type: 'url' },
  ],

  '15-restock': [
    { key: 'productName', label: 'Product name', type: 'text', defaultValue: 'Magnesium Gummies' },
    { key: 'productUrl', label: 'Product URL', type: 'url' },
  ],

  '16-promo': [
    { key: 'discountCode', label: 'Discount code', type: 'text', defaultValue: 'SPRING25' },
    { key: 'discountPct', label: 'Discount %', type: 'text', defaultValue: '25' },
    { key: 'expiresOn', label: 'Expires on', type: 'text', defaultValue: '30 April 2026' },
    { key: 'shopUrl', label: 'Shop URL', type: 'url',
      defaultValue: 'https://www.thehealios.com/shop' },
  ],

  '17-bundle': [
    { key: 'bundleName', label: 'Bundle name', type: 'text', defaultValue: 'Morning Energy Stack' },
    { key: 'bundlePrice', label: 'Bundle price', type: 'text', defaultValue: '£49.99' },
    { key: 'bundleSavings', label: 'Savings vs individual', type: 'text', defaultValue: '£12.99' },
    { key: 'bundleUrl', label: 'Bundle URL', type: 'url' },
  ],
};
