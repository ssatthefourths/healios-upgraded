// Google Consent Mode v2 utilities

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const COOKIE_CONSENT_KEY = "healios-cookie-consent";

/**
 * Update Google Consent Mode when user accepts cookies
 */
export const grantAnalyticsConsent = (): void => {
  if (typeof window.gtag !== "function") return;

  window.gtag("consent", "update", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
  });
};

/**
 * Update Google Consent Mode when user declines cookies
 */
export const denyAnalyticsConsent = (): void => {
  if (typeof window.gtag !== "function") return;

  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
  });
};

/**
 * Check stored consent and update Consent Mode accordingly
 * Call this on page load to restore previous consent state
 */
export const restoreConsentState = (): void => {
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (consent === "accepted") {
    grantAnalyticsConsent();
  } else if (consent === "declined") {
    denyAnalyticsConsent();
  }
  // If no consent recorded, defaults (denied) remain in effect
};

/**
 * Check if user has granted analytics consent
 */
export const hasAnalyticsConsent = (): boolean => {
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
};
