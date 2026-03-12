import { useEffect, useState } from 'react';
import { initializeMetaPixel } from '@/lib/metaPixel';
import { restoreConsentState, grantAnalyticsConsent } from '@/lib/consentMode';
import { initializeClarity } from '@/lib/clarity';

const COOKIE_CONSENT_KEY = 'healios-cookie-consent';
const GA_SCRIPT_ID = 'google-analytics-script';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const Analytics = () => {
  const [initialized, setInitialized] = useState(false);

  const initializeGA = () => {
    const gaId = import.meta.env.VITE_GA_ID;
    
    if (!gaId || initialized) return;
    
    // Check if script already exists
    if (document.getElementById(GA_SCRIPT_ID)) return;

    // Load GA script
    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    // gtag function is already defined in index.html for Consent Mode
    // Just configure the property
    window.gtag('config', gaId, {
      developer: 'The Fourths Digital Agency'
    });

    setInitialized(true);
  };

  const initializeAllAnalytics = () => {
    initializeGA();
    initializeMetaPixel();
    initializeClarity();
  };

  useEffect(() => {
    // Restore consent state from localStorage on page load
    // This updates Consent Mode based on previous user choice
    restoreConsentState();
    
    // Check if user has already accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === 'accepted') {
      initializeAllAnalytics();
    }

    // Listen for cookie consent acceptance
    const handleConsentAccepted = () => {
      initializeAllAnalytics();
    };

    window.addEventListener('cookie-consent-accepted', handleConsentAccepted);

    return () => {
      window.removeEventListener('cookie-consent-accepted', handleConsentAccepted);
    };
  }, [initialized]);

  return null;
};
