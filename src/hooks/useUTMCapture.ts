import { useEffect } from "react";

const UTM_STORAGE_KEY = "healios_utm_params";
const REFERRAL_STORAGE_KEY = "healios_referral_code";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  captured_at?: string;
}

/**
 * Capture referral code from URL parameters
 * Stores in sessionStorage for checkout
 */
export const captureReferralCode = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref") || urlParams.get("referral");
  
  if (refCode) {
    const code = refCode.toUpperCase().trim();
    sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
    
    // Also store with timestamp for tracking
    localStorage.setItem(`${REFERRAL_STORAGE_KEY}_last`, JSON.stringify({
      code,
      captured_at: new Date().toISOString(),
      landing_page: window.location.pathname
    }));
    
    return code;
  }
  
  return null;
};

/**
 * Get stored referral code from session
 */
export const getStoredReferralCode = (): string | null => {
  return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
};

/**
 * Clear stored referral code (after successful application)
 */
export const clearStoredReferralCode = (): void => {
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
};

/**
 * Capture UTM parameters from URL on first visit
 * Stores in sessionStorage for session attribution
 * Also stores in localStorage for cross-session attribution
 */
export const captureUTMParams = (): UTMParams | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UTMParams = {};
  let hasParams = false;

  UTM_PARAMS.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      utmParams[param as keyof UTMParams] = value;
      hasParams = true;
    }
  });

  if (hasParams) {
    utmParams.landing_page = window.location.pathname;
    utmParams.captured_at = new Date().toISOString();

    // Store in sessionStorage for current session
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));

    // Also store in localStorage as "first touch" attribution
    // Only update if no existing first touch data
    if (!localStorage.getItem(`${UTM_STORAGE_KEY}_first`)) {
      localStorage.setItem(`${UTM_STORAGE_KEY}_first`, JSON.stringify(utmParams));
    }

    // Always update "last touch" attribution
    localStorage.setItem(`${UTM_STORAGE_KEY}_last`, JSON.stringify(utmParams));

    return utmParams;
  }

  return null;
};

/**
 * Get current session UTM params
 */
export const getSessionUTM = (): UTMParams | null => {
  const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

/**
 * Get first touch UTM params (first ever visit with UTM)
 */
export const getFirstTouchUTM = (): UTMParams | null => {
  const stored = localStorage.getItem(`${UTM_STORAGE_KEY}_first`);
  return stored ? JSON.parse(stored) : null;
};

/**
 * Get last touch UTM params (most recent visit with UTM)
 */
export const getLastTouchUTM = (): UTMParams | null => {
  const stored = localStorage.getItem(`${UTM_STORAGE_KEY}_last`);
  return stored ? JSON.parse(stored) : null;
};

/**
 * Get attribution data for orders
 * Returns combined first/last touch data
 */
export const getAttributionData = (): {
  first_touch: UTMParams | null;
  last_touch: UTMParams | null;
  session: UTMParams | null;
} => {
  return {
    first_touch: getFirstTouchUTM(),
    last_touch: getLastTouchUTM(),
    session: getSessionUTM(),
  };
};

/**
 * Hook to capture UTM params and referral codes on component mount
 */
export const useUTMCapture = () => {
  useEffect(() => {
    captureUTMParams();
    captureReferralCode();
  }, []);

  return {
    getSessionUTM,
    getFirstTouchUTM,
    getLastTouchUTM,
    getAttributionData,
    getStoredReferralCode,
  };
};
