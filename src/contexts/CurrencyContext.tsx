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

  // Detect user's locale on first visit
  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!stored) {
      // Try to detect currency based on locale
      const locale = navigator.language || 'en-GB';
      const countryCode = locale.split('-')[1]?.toUpperCase();
      
      const currencyMap: Record<string, string> = {
        'US': 'USD',
        'CA': 'CAD',
        'AU': 'AUD',
        'GB': 'GBP',
        'DE': 'EUR',
        'FR': 'EUR',
        'IT': 'EUR',
        'ES': 'EUR',
        'NL': 'EUR',
        'AT': 'EUR',
        'BE': 'EUR',
        'IE': 'EUR',
      };
      
      const detectedCode = currencyMap[countryCode];
      if (detectedCode) {
        const found = SUPPORTED_CURRENCIES.find(c => c.code === detectedCode);
        if (found) {
          setCurrency(found);
        }
      }
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
