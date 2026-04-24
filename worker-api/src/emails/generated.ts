// AUTO-GENERATED — do not edit by hand. Regenerate via:
//   node scripts/build-emails.mjs
//
// Each renderX(props) returns a full HTML document string suitable for
// Resend's `html` field. The file imports EVERY template; esbuild's
// tree-shaker drops unused renderers from the final Worker bundle.

import { render } from '@react-email/render';
import React from 'react';

import ProductLaunch from '../../../src/lib/emails/emails/campaign/13-product-launch';
import WellnessDrive from '../../../src/lib/emails/emails/campaign/14-wellness-drive';
import Restock from '../../../src/lib/emails/emails/campaign/15-restock';
import Promo from '../../../src/lib/emails/emails/campaign/16-promo';
import Bundle from '../../../src/lib/emails/emails/campaign/17-bundle';
import Welcome1 from '../../../src/lib/emails/emails/lifecycle/07-welcome-1';
import Welcome2 from '../../../src/lib/emails/emails/lifecycle/08-welcome-2';
import Welcome3 from '../../../src/lib/emails/emails/lifecycle/09-welcome-3';
import AbandonedCart from '../../../src/lib/emails/emails/lifecycle/10-abandoned-cart';
import PostPurchase from '../../../src/lib/emails/emails/lifecycle/11-post-purchase';
import Winback from '../../../src/lib/emails/emails/lifecycle/12-winback';
import OrderConfirmation from '../../../src/lib/emails/emails/transactional/01-order-confirmation';
import ShippingConfirmation from '../../../src/lib/emails/emails/transactional/02-shipping-confirmation';
import DeliveryConfirmation from '../../../src/lib/emails/emails/transactional/03-delivery-confirmation';
import PasswordReset from '../../../src/lib/emails/emails/transactional/04-password-reset';
import AccountCreated from '../../../src/lib/emails/emails/transactional/05-account-created';
import SubscriptionReminder from '../../../src/lib/emails/emails/transactional/06-subscription-reminder';

/** Render campaign/13-product-launch as a full HTML document. */
export async function renderProductLaunch(props: Parameters<typeof ProductLaunch>[0] = {} as any): Promise<string> {
  return await render(React.createElement(ProductLaunch, props as any));
}

/** Render campaign/14-wellness-drive as a full HTML document. */
export async function renderWellnessDrive(props: Parameters<typeof WellnessDrive>[0] = {} as any): Promise<string> {
  return await render(React.createElement(WellnessDrive, props as any));
}

/** Render campaign/15-restock as a full HTML document. */
export async function renderRestock(props: Parameters<typeof Restock>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Restock, props as any));
}

/** Render campaign/16-promo as a full HTML document. */
export async function renderPromo(props: Parameters<typeof Promo>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Promo, props as any));
}

/** Render campaign/17-bundle as a full HTML document. */
export async function renderBundle(props: Parameters<typeof Bundle>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Bundle, props as any));
}

/** Render lifecycle/07-welcome-1 as a full HTML document. */
export async function renderWelcome1(props: Parameters<typeof Welcome1>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Welcome1, props as any));
}

/** Render lifecycle/08-welcome-2 as a full HTML document. */
export async function renderWelcome2(props: Parameters<typeof Welcome2>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Welcome2, props as any));
}

/** Render lifecycle/09-welcome-3 as a full HTML document. */
export async function renderWelcome3(props: Parameters<typeof Welcome3>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Welcome3, props as any));
}

/** Render lifecycle/10-abandoned-cart as a full HTML document. */
export async function renderAbandonedCart(props: Parameters<typeof AbandonedCart>[0] = {} as any): Promise<string> {
  return await render(React.createElement(AbandonedCart, props as any));
}

/** Render lifecycle/11-post-purchase as a full HTML document. */
export async function renderPostPurchase(props: Parameters<typeof PostPurchase>[0] = {} as any): Promise<string> {
  return await render(React.createElement(PostPurchase, props as any));
}

/** Render lifecycle/12-winback as a full HTML document. */
export async function renderWinback(props: Parameters<typeof Winback>[0] = {} as any): Promise<string> {
  return await render(React.createElement(Winback, props as any));
}

/** Render transactional/01-order-confirmation as a full HTML document. */
export async function renderOrderConfirmation(props: Parameters<typeof OrderConfirmation>[0] = {} as any): Promise<string> {
  return await render(React.createElement(OrderConfirmation, props as any));
}

/** Render transactional/02-shipping-confirmation as a full HTML document. */
export async function renderShippingConfirmation(props: Parameters<typeof ShippingConfirmation>[0] = {} as any): Promise<string> {
  return await render(React.createElement(ShippingConfirmation, props as any));
}

/** Render transactional/03-delivery-confirmation as a full HTML document. */
export async function renderDeliveryConfirmation(props: Parameters<typeof DeliveryConfirmation>[0] = {} as any): Promise<string> {
  return await render(React.createElement(DeliveryConfirmation, props as any));
}

/** Render transactional/04-password-reset as a full HTML document. */
export async function renderPasswordReset(props: Parameters<typeof PasswordReset>[0] = {} as any): Promise<string> {
  return await render(React.createElement(PasswordReset, props as any));
}

/** Render transactional/05-account-created as a full HTML document. */
export async function renderAccountCreated(props: Parameters<typeof AccountCreated>[0] = {} as any): Promise<string> {
  return await render(React.createElement(AccountCreated, props as any));
}

/** Render transactional/06-subscription-reminder as a full HTML document. */
export async function renderSubscriptionReminder(props: Parameters<typeof SubscriptionReminder>[0] = {} as any): Promise<string> {
  return await render(React.createElement(SubscriptionReminder, props as any));
}

export const EMAIL_TEMPLATES = [
  { id: '13-product-launch', group: 'campaign' as const, component: 'ProductLaunch' },
  { id: '14-wellness-drive', group: 'campaign' as const, component: 'WellnessDrive' },
  { id: '15-restock', group: 'campaign' as const, component: 'Restock' },
  { id: '16-promo', group: 'campaign' as const, component: 'Promo' },
  { id: '17-bundle', group: 'campaign' as const, component: 'Bundle' },
  { id: '07-welcome-1', group: 'lifecycle' as const, component: 'Welcome1' },
  { id: '08-welcome-2', group: 'lifecycle' as const, component: 'Welcome2' },
  { id: '09-welcome-3', group: 'lifecycle' as const, component: 'Welcome3' },
  { id: '10-abandoned-cart', group: 'lifecycle' as const, component: 'AbandonedCart' },
  { id: '11-post-purchase', group: 'lifecycle' as const, component: 'PostPurchase' },
  { id: '12-winback', group: 'lifecycle' as const, component: 'Winback' },
  { id: '01-order-confirmation', group: 'transactional' as const, component: 'OrderConfirmation' },
  { id: '02-shipping-confirmation', group: 'transactional' as const, component: 'ShippingConfirmation' },
  { id: '03-delivery-confirmation', group: 'transactional' as const, component: 'DeliveryConfirmation' },
  { id: '04-password-reset', group: 'transactional' as const, component: 'PasswordReset' },
  { id: '05-account-created', group: 'transactional' as const, component: 'AccountCreated' },
  { id: '06-subscription-reminder', group: 'transactional' as const, component: 'SubscriptionReminder' },
] as const;

export type EmailTemplateId = typeof EMAIL_TEMPLATES[number]['id'];
