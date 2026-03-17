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

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    saveCurrencyToStorage(newCurrency);
  }, []);

  // Detect user's currency on first visit via Cloudflare Worker geo-detection
  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!stored) {
      const workerBase =
        import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

      fetch(`${workerBase}/currency`)
        .then(res => {
          if (!res.ok) throw new Error(`Currency API returned ${res.status}`);
          return res.json();
        })
        .then((data: { currency?: string }) => {
          if (data?.currency) {
            const found = SUPPORTED_CURRENCIES.find(c => c.code === data.currency);
            if (found) {
              setCurrency(found);
            }
          }
        })
        .catch(() => {
          // Fall back silently — GBP default already set by loadCurrencyFromStorage
        });
    }
  }, [setCurrency]);

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
