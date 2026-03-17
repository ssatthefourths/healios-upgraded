/**
 * Healios Currency Handler
 * Geo-detects the visitor's country via Cloudflare's request.cf.country
 * and returns the appropriate currency for the storefront.
 *
 * Base currency: GBP (all D1 product prices are stored in GBP)
 */

import { Env } from './index';

interface CurrencyInfo {
  currency: string;
  symbol: string;
  name: string;
  rate: number;
  country: string;
}

// All rates are relative to GBP (base = 1)
export const CURRENCY_RATES: Record<string, number> = {
  GBP: 1,
  ZAR: 23.5,
  EUR: 1.17,
  USD: 1.27,
  CAD: 1.72,
  AUD: 1.93,
};

const CURRENCY_DETAILS: Record<string, { symbol: string; name: string }> = {
  GBP: { symbol: '£', name: 'British Pound' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
};

// Country → currency code mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // South Africa
  ZA: 'ZAR',

  // British Isles / Crown Dependencies
  GB: 'GBP',
  IM: 'GBP', // Isle of Man
  JE: 'GBP', // Jersey
  GG: 'GBP', // Guernsey

  // Eurozone
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  LU: 'EUR',
  CY: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  MT: 'EUR',
  SK: 'EUR',
  SI: 'EUR',

  // North America
  US: 'USD',
  CA: 'CAD',

  // Oceania
  AU: 'AUD',
  NZ: 'AUD',
};

/**
 * Returns the exchange rate for a given currency code.
 * Falls back to 1 (GBP parity) if the code is unknown.
 * Used by the checkout handler to convert basket totals.
 */
export function getRateForCurrency(code: string): number {
  return CURRENCY_RATES[code.toUpperCase()] ?? 1;
}

/**
 * GET /currency
 * Reads Cloudflare's cf.country property from the incoming request and
 * returns a JSON payload describing the appropriate currency.
 */
export async function handleCurrency(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600',
  };

  const cf = (request as any).cf as { country?: string } | undefined;
  const countryCode = cf?.country?.toUpperCase() ?? '';

  const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] ?? 'GBP';
  const details = CURRENCY_DETAILS[currencyCode];
  const rate = CURRENCY_RATES[currencyCode];

  const body: CurrencyInfo = {
    currency: currencyCode,
    symbol: details.symbol,
    name: details.name,
    rate,
    country: countryCode || 'UNKNOWN',
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
