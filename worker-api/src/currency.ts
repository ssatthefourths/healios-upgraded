/**
 * Healios Currency Handler
 * Geo-detects the visitor's country via Cloudflare's request.cf.country
 * and returns the appropriate currency with a LIVE exchange rate.
 *
 * Rates are fetched from api.frankfurter.app (free, no API key).
 * Cloudflare caches the upstream response at the edge for 1 hour,
 * so the external call is made at most once per hour per PoP.
 * Hardcoded fallback rates are used if the API is unavailable.
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

// Fallback rates (used only if live fetch fails)
const FALLBACK_RATES: Record<string, number> = {
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

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // South Africa
  ZA: 'ZAR',
  // British Isles
  GB: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  // Eurozone
  IE: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', AT: 'EUR', BE: 'EUR', PT: 'EUR', FI: 'EUR',
  GR: 'EUR', LU: 'EUR', CY: 'EUR', EE: 'EUR', LV: 'EUR',
  LT: 'EUR', MT: 'EUR', SK: 'EUR', SI: 'EUR',
  // North America
  US: 'USD', CA: 'CAD',
  // Oceania
  AU: 'AUD', NZ: 'AUD',
};

/**
 * Fetches live GBP-based exchange rates from frankfurter.app.
 * The request is tagged with Cloudflare cache options so the edge
 * caches the response for 1 hour — the external API is hit at most
 * once per hour per Cloudflare PoP, keeping latency near zero.
 * Falls back to hardcoded rates on any error.
 */
export async function fetchLiveRates(): Promise<Record<string, number>> {
  try {
    const targets = Object.keys(FALLBACK_RATES).filter(c => c !== 'GBP').join(',');
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=GBP&to=${targets}`,
      // Cloudflare-specific: cache the upstream response at the edge
      { cf: { cacheTtl: 3600, cacheEverything: true } } as RequestInit
    );
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = await res.json() as { rates: Record<string, number> };
    return { GBP: 1, ...data.rates };
  } catch (err) {
    console.warn('Live rate fetch failed, using fallback rates:', err);
    return FALLBACK_RATES;
  }
}

/**
 * Returns the exchange rate for a specific currency code using live rates.
 * Falls back to hardcoded value if the code is unknown.
 */
export async function getLiveRate(code: string): Promise<number> {
  const rates = await fetchLiveRates();
  return rates[code.toUpperCase()] ?? FALLBACK_RATES[code.toUpperCase()] ?? 1;
}

/**
 * GET /currency
 * Returns currency info (code, symbol, rate) for the visitor's detected country.
 */
export async function handleCurrency(request: Request, _env: Env): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=3600',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cf = (request as any).cf as { country?: string } | undefined;
  const countryCode = cf?.country?.toUpperCase() ?? '';
  const currencyCode = COUNTRY_CURRENCY_MAP[countryCode] ?? 'GBP';
  const details = CURRENCY_DETAILS[currencyCode];

  // Fetch live rate
  const rates = await fetchLiveRates();
  const rate = rates[currencyCode] ?? FALLBACK_RATES[currencyCode] ?? 1;

  const body: CurrencyInfo = {
    currency: currencyCode,
    symbol: details.symbol,
    name: details.name,
    rate,
    country: countryCode || 'UNKNOWN',
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
