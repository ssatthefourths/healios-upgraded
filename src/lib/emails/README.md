# Healios Email System

A modular, design-token-driven email template library built with [React Email](https://react.email) for use with [Resend](https://resend.com) and the custom Healios portal.

**Built for:** Servaas (dev) · **Brand owner:** The Fourths / Healios · **Approach:** AG1-inspired 4-module editorial rhythm, Healios visual language (bone-and-charcoal palette, serif-accent typography, photography-driven colour).

---

## Quick start

```bash
cd email-system
npm install
npm run dev
```

Opens the React Email preview at **http://localhost:3000** with all 17 templates in the sidebar. Live-reloads on edit. No real send happens — it's a pure preview.

To export static HTML for any template:

```bash
npm run export
```

Writes HTML files to `./out/`.

---

## How it's organised

```
email-system/
├── tokens.ts                  ← design system (colours, fonts, spacing, brand constants)
├── components/                ← 10 reusable modules
│   ├── Layout.tsx             ← Html/Head/Body wrapper with fonts
│   ├── Header.tsx             ← logo header
│   ├── Button.tsx             ← pill CTA (primary/secondary/ghost)
│   ├── Hero.tsx               ← big editorial hero block
│   ├── EditorialCard.tsx      ← white card overlay ("The thinking behind it")
│   ├── PillarStrip.tsx        ← PREMIUM QUALITY · UK MADE · SCIENCE-BACKED
│   ├── ProductCallout.tsx     ← single product feature
│   ├── ProductGrid.tsx        ← 2×N product grid
│   ├── IngredientCallout.tsx  ← ingredient/feature attributes
│   ├── BigCTA.tsx             ← closing CTA (dark panel or image variant)
│   ├── OrderSummary.tsx       ← line items + totals (+ AddressBlock)
│   ├── Footer.tsx             ← legal footer with unsubscribe
│   └── index.ts               ← barrel exports
├── data/
│   └── sampleProducts.ts      ← sample product data for previews (replace with live data)
├── emails/
│   ├── transactional/         ← 6 templates
│   ├── lifecycle/             ← 6 templates
│   └── campaign/              ← 5 templates
├── package.json
├── tsconfig.json
└── README.md
```

**Everything cascades from `tokens.ts`.** Change a colour value there and it propagates to every component and template. Do not hard-code colours, fonts, or spacing in individual files.

---

## The 17 templates

### Transactional (6)
| # | File | Trigger |
|---|---|---|
| 01 | `transactional/01-order-confirmation.tsx` | Customer places an order |
| 02 | `transactional/02-shipping-confirmation.tsx` | Order ships from the warehouse |
| 03 | `transactional/03-delivery-confirmation.tsx` | Carrier marks as delivered |
| 04 | `transactional/04-password-reset.tsx` | Customer requests password reset |
| 05 | `transactional/05-account-created.tsx` | New account registered |
| 06 | `transactional/06-subscription-reminder.tsx` | 3 days before next subscription charge |

### Lifecycle (6)
| # | File | Trigger |
|---|---|---|
| 07 | `lifecycle/07-welcome-1.tsx` | Day 0 — brand intro |
| 08 | `lifecycle/08-welcome-2.tsx` | Day 2 — formulation story |
| 09 | `lifecycle/09-welcome-3.tsx` | Day 5 — first-order incentive |
| 10 | `lifecycle/10-abandoned-cart.tsx` | 2 hours after cart abandonment |
| 11 | `lifecycle/11-post-purchase.tsx` | 7–10 days after delivery (review request) |
| 12 | `lifecycle/12-winback.tsx` | 60–90 days since last order |

### Campaign (5)
| # | File | Use case |
|---|---|---|
| 13 | `campaign/13-product-launch.tsx` | New SKU launch — the closest to the AG1 reference |
| 14 | `campaign/14-wellness-drive.tsx` | Editorial / ingredient spotlights |
| 15 | `campaign/15-restock.tsx` | Back-in-stock notification |
| 16 | `campaign/16-promo.tsx` | Seasonal / sitewide promotional offer |
| 17 | `campaign/17-bundle.tsx` | Bundle / routine pairing feature |

---

## Sending via Resend

Install the Resend SDK (already in devDependencies):

```ts
import { Resend } from "resend";
import OrderConfirmation from "./emails/transactional/01-order-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "Healios <hello@thehealios.com>",
  to: customer.email,
  subject: `Order confirmed — ${order.number}`,
  react: OrderConfirmation({
    customerName: customer.firstName,
    orderNumber: order.number,
    orderDate: formatDate(order.createdAt),
    items: order.lineItems,
    subtotal: formatPrice(order.subtotal),
    shipping: formatPrice(order.shipping),
    total: formatPrice(order.total),
    shippingAddress: {
      name: order.shippingAddress.fullName,
      lines: [
        order.shippingAddress.line1,
        `${order.shippingAddress.city}, ${order.shippingAddress.postalCode}`,
        order.shippingAddress.country,
      ],
    },
    trackingUrl: `https://www.thehealios.com/account/orders/${order.number}`,
    unsubscribeUrl: buildUnsubscribeUrl(customer),
    preferencesUrl: buildPreferencesUrl(customer),
  }),
});
```

### Unsubscribe and preferences

Every template accepts `unsubscribeUrl` and `preferencesUrl` props. These MUST be populated per-recipient at send time. Failing to do so is a CAN-SPAM and GDPR violation. If you pass them in, the Footer uses them directly; if you omit them, the Footer falls back to `{{unsubscribe_url}}` and `{{preferences_url}}` placeholder tokens (useful if Resend substitutes these, or if you're using a merge-variable flow).

---

## Image assets

All templates currently use placeholder images from `placehold.co` at the correct dimensions. Replace them with real imagery when the photo shoot wraps.

### Where to host
Host the final image library on a CDN (Cloudflare R2, AWS CloudFront, or Shopify's CDN if the store runs on Shopify). Reference by absolute URL in templates.

### Image spec

Email rendering width is **600px**. Every image is supplied at **2×** for retina sharpness.

| Where | Render size | Supply size (2×) | Aspect | Notes |
|---|---|---|---|---|
| Hero block | 600 × 700 | **1200 × 1400** | 6:7 | Editorial / lifestyle mood. Bottom third should be visually quieter for headline overlay flexibility. |
| Editorial card backdrop | 600 × 500 | **1200 × 1000** | 6:5 | Soft texture — herbs, linen, skin. Shouldn't fight the overlaid card. |
| Ingredient callout | 600 × 600 | **1200 × 1200** | 1:1 | Single product, warm neutral surface, space for label grid below. |
| Closing CTA image | 600 × 400 | **1200 × 800** | 3:2 | Secondary lifestyle moment or abstract texture. |
| Product pack shot | 280 × 280 | **560 × 560** | 1:1 | On `#F1F0EE` surface. Consistent angle + lighting across set. |
| Logo (dark) | 160 × 40 | **320 × 80** | — | Transparent PNG, `#242428` mark on transparent. |
| Logo (light) | 160 × 40 | **320 × 80** | — | Transparent PNG, `#FBFAF9` mark on transparent. |
| Social icon | 24 × 24 | **48 × 48** | 1:1 | Transparent PNG, single-colour `#242428`. |

**Format:** JPG for photography, PNG for logos/icons. **Weight:** under 200KB each, ideally under 100KB. **Colour profile:** sRGB.

### How to swap in real images

Once images are hosted:

1. Update `tokens.ts` — replace `assets.logoDark`, `assets.logoLight`, `assets.iconInstagram`, etc.
2. For per-template imagery, pass the `imageUrl` prop directly when sending:

```ts
Hero({
  headline: "Wellness, elevated.",
  imageUrl: "https://cdn.thehealios.com/emails/hero-ashwagandha.jpg",
  ...
});
```

Or set defaults in a template's default-props block by swapping the placeholder URL.

---

## Design tokens

The system is entirely driven by `tokens.ts`:

- **`colors`** — text, surface, border, and button colours. Healios is a monochromatic warm-neutral system. No brand accent — colour comes from photography.
- **`fonts`** — Playfair Display (serif display) and DM Sans (body/UI), loaded via Google Fonts with woff2 fallbacks in the `<Layout>` head.
- **`typography`** — all type styles (display XL/L/M, eyebrow, section label, body L/M/S, caption, button, product title/price). Import and spread these; don't author inline.
- **`spacing`** — 4/8/16/24/32/48/64 scale (xs through xxxl).
- **`radius`** — 8/12/16 + pill.
- **`layout`** — container width (600px), content padding.
- **`assets`** — image URLs + a `placeholder(w, h, label)` helper.
- **`brand`** — brand constants (name, tagline, pillars, support email, legal address).

### Adding a new template

1. Create `emails/<category>/<NN>-<name>.tsx`.
2. Import from `../../components` (barrel) and `../../tokens`.
3. Wrap in `<Layout preview="...">`.
4. Compose modules — **do not write new styled HTML**. If you find you need a new pattern, build it as a shared component in `components/` and use it.
5. Export a default component with sensible default props so the preview server can render it without runtime data.

### Changing the palette

Edit `tokens.ts`. All components inherit automatically. Don't hard-code hex values in components.

---

## The headline italic treatment

Across every template you'll see `italicWord` props on `Hero`, `EditorialCard`, and `BigCTA`. This renders exactly one word inside the headline in italic Playfair Display — the signature Healios typographic move that mirrors "Wellness, *Elevated.*" on the website.

```tsx
<Hero
  headline="It's arrived, Monique."
  italicWord="arrived"
/>
```

If the italicWord isn't found in the headline, the headline renders unchanged — safe fallback.

---

## Testing

Before sending anything real:

1. **Preview in the dev server** (`npm run dev`) — visual check on all templates.
2. **Test across clients** — paste the exported HTML into [Email on Acid](https://www.emailonacid.com) or [Litmus](https://www.litmus.com) to verify rendering in Outlook, Gmail, Apple Mail, Yahoo, and mobile clients. Outlook's Word-based renderer is the usual source of pain.
3. **Send a test** via Resend to your own inbox across at least: Gmail (web + iOS), Apple Mail (macOS + iOS), Outlook (desktop).
4. **Dark mode** — Gmail and Apple Mail auto-invert colours. The `<Head>` includes `color-scheme: light only` meta which helps, but visually inspect anyway.

---

## Known defaults to review before going live

- **Legal address** in `tokens.ts` (`brand.legalAddress`) is a placeholder. Replace with the real Healios Ltd registered address.
- **Social handles** in `components/Footer.tsx` — verify `/healios` is the correct Instagram/TikTok/YouTube handle.
- **Support email** in `tokens.ts` (`brand.supportEmail`) is `hello@thehealios.com` — confirm that's the inbox to route support to.
- **Currency defaults** across transactional templates are GBP. Multi-currency support needs a `currency` prop passed in from the order record.
- **Discount codes** referenced in welcome/winback/promo templates (`WELCOME10`, `BACK15`, `SPRING20`) are examples. Set real codes at send time.

---

## Contact

Questions or brand direction: **ms@thefourths.com** (Monique, The Fourths).
Technical questions: open an issue in the Healios repo and tag Servaas.
