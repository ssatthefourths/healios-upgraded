import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

const CURRENCY_STORAGE_KEY = 'healios_currency';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to GBP (base currency)
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 23.5 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.27 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 1.17 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.72 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.93 },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInGBP: number) => string;
  convertPrice: (priceInGBP: number) => number;
  detectedCurrency: string; // Currency code geo-detected from worker, '' until resolved
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const loadCurrencyFromStorage = (): Currency => {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const found = SUPPORTED_CURRENCIES.find(c => c.code === parsed.code);
      if (found) return found;
    }
  } catch {
    // Ignore errors
  }
  return SUPPORTED_CURRENCIES[0]; // Default to GBP
};

const saveCurrencyToStorage = (currency: Currency) => {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify({ code: currency.code }));
  } catch {
    // Storage might be unavailable
  }
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => loadCurrencyFromStorage());
  const [detectedCurrency, setDetectedCurrency] = useState<string>('');

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveCurrencyToStorage(newCurrency);
  }, []);

  // Detect user's currency on first visit via Cloudflare Worker geo-detection.
  // The worker returns a live exchange rate — we update the matched currency's
  // rate so display prices are always current, even if the user has a stored
  // preference (we refresh their stored entry's rate on every session start).
  useEffect(() => {
    const workerBase =
      import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

    fetch(`${workerBase}/currency`)
      .then(res => {
        if (!res.ok) throw new Error(`Currency API returned ${res.status}`);
        return res.json();
      })
      .then((data: { currency?: string; rate?: number }) => {
        if (!data?.currency) return;
        setDetectedCurrency(data.currency);
        const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
        // Only auto-set the currency if the user hasn't chosen one yet
        const targetCode = stored
          ? JSON.parse(stored).code
          : data.currency;
        const found = SUPPORTED_CURRENCIES.find(c => c.code === targetCode);
        if (found) {
          // Patch in the live rate if the worker returned one for this currency
          const liveRate = targetCode === data.currency ? (data.rate ?? found.rate) : found.rate;
          setCurrency({ ...found, rate: liveRate });
        }
      })
      .catch(() => {
        // Fall back silently — stored or default GBP already set
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convertPrice = useCallback((priceInGBP: number): number => {
    return priceInGBP * currency.rate;
  }, [currency.rate]);

  const formatPrice = useCallback((priceInGBP: number): string => {
    const converted = convertPrice(priceInGBP);
    return `${currency.symbol}${converted.toFixed(2)}`;
  }, [currency.symbol, convertPrice]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      detectedCurrency,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
