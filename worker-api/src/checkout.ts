/**
 * Checkout Session Handler
 * Ported from Supabase edge function — creates a Stripe Checkout session
 * with server-side price validation against D1 products table.
 * Supports multi-currency: pass currency code in request body.
 */

import { Env } from './index';
import { fetchLiveRates } from './currency';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  isSubscription?: boolean;
}

interface CheckoutRequest {
  cartItems: CartItem[];
  customerEmail: string;
  customerDetails: { firstName: string; lastName: string; phone?: string };
  shippingAddress: { address: string; city: string; postalCode: string; country: string };
  billingAddress?: { address: string; city: string; postalCode: string; country: string };
  discountCode?: string;
  discountAmount?: number;
  shippingMethod?: string;
  shippingCost?: number;
  userId?: string;
  currency?: string; // ISO 4217 code e.g. 'GBP', 'ZAR', 'USD'
}

// Stripe REST API base (no npm package in Workers)
async function stripePost(path: string, body: Record<string, unknown>, stripeKey: string) {
  // Encode as x-www-form-urlencoded recursively
  const encode = (obj: Record<string, unknown>, prefix = ''): string => {
    return Object.entries(obj)
      .flatMap(([k, v]) => {
        const key = prefix ? `${prefix}[${k}]` : k;
        if (v === null || v === undefined) return [];
        if (typeof v === 'object' && !Array.isArray(v)) return [encode(v as Record<string, unknown>, key)];
        if (Array.isArray(v)) return v.flatMap((item, i) => typeof item === 'object' ? [encode(item as Record<string, unknown>, `${key}[${i}]`)] : [`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`]);
        return [`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`];
      })
      .join('&');
  };

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encode(body),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe error');
  return data;
}

async function stripeGet(path: string, params: Record<string, string>, stripeKey: string) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe error');
  return data;
}

export async function handleCheckout(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeKey = (env as any).STRIPE_KEY;
  if (!stripeKey) return json({ error: 'Payment not configured' }, 503);

  let body: CheckoutRequest;
  try {
    body = await request.json() as CheckoutRequest;
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { cartItems, customerEmail, customerDetails, shippingAddress, billingAddress, discountAmount, shippingMethod, shippingCost = 0, userId, currency: rawCurrency } = body;

  if (!Array.isArray(cartItems) || cartItems.length === 0) return json({ error: 'Cart cannot be empty' }, 400);
  if (!customerEmail || !customerEmail.includes('@')) return json({ error: 'Valid email required' }, 400);
  if (!customerDetails?.firstName || !customerDetails?.lastName) return json({ error: 'Customer name required' }, 400);

  // Resolve currency using live exchange rates
  const requestedCurrency = (rawCurrency || 'GBP').toUpperCase();
  const liveRates = await fetchLiveRates();
  const currencyCode = liveRates[requestedCurrency] !== undefined ? requestedCurrency : 'GBP';
  const currencyRate = liveRates[currencyCode]; // GBP = 1, ZAR = live rate, etc.

  // Server-side price validation against D1 (products priced in GBP)
  const productIds = cartItems.map(i => i.id);
  const placeholders = productIds.map(() => '?').join(',');
  const { results: dbProducts } = await env.DB.prepare(
    `SELECT id, price, name, image, category, is_published, stock_quantity, track_inventory FROM products WHERE id IN (${placeholders})`
  ).bind(...productIds).all();

  const productMap = new Map((dbProducts || []).map((p: any) => [p.id, p]));
  const validatedItems: CartItem[] = [];
  const errors: string[] = [];

  for (const item of cartItems) {
    const product = productMap.get(item.id) as any;
    if (!product) { errors.push(`Product not found: ${item.id}`); continue; }
    if (!product.is_published) { errors.push(`${product.name} is unavailable`); continue; }
    if (product.track_inventory && product.stock_quantity < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}`);
      continue;
    }
    // Price in GBP (base), apply subscription discount, then convert to target currency
    const gbpPrice = item.isSubscription ? Number(product.price) * 0.85 : Number(product.price);
    const displayPrice = gbpPrice * currencyRate;
    validatedItems.push({ ...item, price: displayPrice, name: product.name, image: product.image, category: product.category });
  }

  if (errors.length > 0) return json({ error: 'Cart validation failed', details: errors }, 400);

  const origin = request.headers.get('origin') || 'https://www.thehealios.com';
  const hasSubscriptions = validatedItems.some(i => i.isSubscription);
  const stripeCurrency = currencyCode.toLowerCase();

  // Stripe shipping countries by currency
  const shippingCountriesByCurrency: Record<string, string[]> = {
    gbp: ['GB', 'IE'],
    zar: ['ZA'],
    usd: ['US'],
    eur: ['DE', 'FR', 'IT', 'ES', 'NL', 'AT', 'BE', 'PT', 'FI', 'GR', 'IE'],
    cad: ['CA'],
    aud: ['AU', 'NZ'],
  };
  const allowedShippingCountries = shippingCountriesByCurrency[stripeCurrency] || ['GB', 'ZA', 'US'];

  // Build flat params for Stripe
  const params: Record<string, unknown> = {
    mode: hasSubscriptions ? 'subscription' : 'payment',
    success_url: `${origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?cancelled=true`,
    customer_email: customerEmail,
    'metadata[user_id]': userId || '',
    'metadata[customer_email]': customerEmail,
    'metadata[customer_first_name]': customerDetails.firstName,
    'metadata[customer_last_name]': customerDetails.lastName,
    'metadata[customer_phone]': customerDetails.phone || '',
    'metadata[shipping_address]': shippingAddress?.address || '',
    'metadata[shipping_city]': shippingAddress?.city || '',
    'metadata[shipping_postal_code]': shippingAddress?.postalCode || '',
    'metadata[shipping_country]': shippingAddress?.country || '',
    'metadata[shipping_method]': shippingMethod || '',
    'metadata[shipping_cost]': String(shippingCost * currencyRate),
    'metadata[cart_items]': JSON.stringify(validatedItems.map(i => ({ id: i.id, name: i.name, image: i.image, category: i.category, quantity: i.quantity, price: i.price, isSubscription: i.isSubscription }))),
    'metadata[discount_code]': body.discountCode || '',
    'metadata[currency]': currencyCode,
  };

  // Add allowed shipping countries
  allowedShippingCountries.forEach((country, i) => {
    params[`shipping_address_collection[allowed_countries][${i}]`] = country;
  });

  // Flatten line items into params
  validatedItems.forEach((item, idx) => {
    params[`line_items[${idx}][quantity]`] = item.quantity;
    params[`line_items[${idx}][price_data][currency]`] = stripeCurrency;
    params[`line_items[${idx}][price_data][product_data][name]`] = item.name;
    params[`line_items[${idx}][price_data][unit_amount]`] = Math.round(item.price * 100);
    if (item.isSubscription) {
      params[`line_items[${idx}][price_data][recurring][interval]`] = 'month';
    }
  });

  // Add shipping as a line item
  const shippingInCurrency = shippingCost * currencyRate;
  if (shippingInCurrency > 0) {
    const idx = validatedItems.length;
    params[`line_items[${idx}][quantity]`] = 1;
    params[`line_items[${idx}][price_data][currency]`] = stripeCurrency;
    params[`line_items[${idx}][price_data][product_data][name]`] = shippingMethod || 'Shipping';
    params[`line_items[${idx}][price_data][unit_amount]`] = Math.round(shippingInCurrency * 100);
  }

  // Apply discount coupon if provided
  if (discountAmount && discountAmount > 0) {
    try {
      const coupon = await stripePost('/coupons', {
        amount_off: Math.round(discountAmount * currencyRate * 100),
        currency: stripeCurrency,
        duration: 'once',
        name: body.discountCode || 'Discount',
      }, stripeKey);
      params['discounts[0][coupon]'] = coupon.id;
    } catch (e: any) {
      console.warn('Coupon creation failed, skipping discount:', e.message);
    }
  }

  try {
    const session = await stripePost('/checkout/sessions', params as Record<string, unknown>, stripeKey);
    return json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe error:', err.message);
    return json({ error: err.message || 'Payment processing failed' }, 500);
  }
}
