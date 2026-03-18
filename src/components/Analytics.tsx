import { useEffect, useState } from 'react';
import { initializeMetaPixel } from '@/lib/metaPixel';
import { restoreConsentState, hasAnalyticsConsent, hasMarketingConsent } from '@/lib/consentMode';
import { initializeClarity } from '@/lib/clarity';

const GA_SCRIPT_ID = 'google-analytics-script';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const Analytics = () => {
  const [gaInitialized, setGaInitialized] = useState(false);

  const initializeGA = () => {
    const gaId = import.meta.env.VITE_GA_ID;

    if (!gaId || gaInitialized) return;
    if (document.getElementById(GA_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    window.gtag('config', gaId, {
      developer: 'The Fourths Digital Agency',
    });

    setGaInitialized(true);
  };

  const initAnalyticsScripts = () => {
    if (hasAnalyticsConsent()) {
      initializeGA();
      initializeClarity();
    }
  };

  const initMarketingScripts = () => {
    if (hasMarketingConsent()) {
      initializeMetaPixel();
    }
  };

  useEffect(() => {
    // Restore consent signals to gtag from stored preference (before GA fires first hit)
    restoreConsentState();

    initAnalyticsScripts();
    initMarketingScripts();

    const handleConsentEvent = () => {
      initAnalyticsScripts();
      initMarketingScripts();
    };

    window.addEventListener('cookie-consent-accepted', handleConsentEvent);
    return () => window.removeEventListener('cookie-consent-accepted', handleConsentEvent);
  }, [gaInitialized]);

  return null;
};
