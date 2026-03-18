// Google Consent Mode v2 + first-party cookie consent management

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// --- Types ---

export interface ConsentCategories {
  essential: true;
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  version: number;
  timestamp: string;
  categories: ConsentCategories;
}

// --- Constants ---

const CONSENT_COOKIE_NAME = 'healios-consent';
const CONSENT_LS_KEY = 'healios-consent';
const LEGACY_LS_KEY = 'healios-cookie-consent'; // old binary string key
const CONSENT_VERSION = 1; // bump to force re-consent on policy change
const CONSENT_TTL = 31536000; // 365 days in seconds

// --- Cookie I/O ---

/**
 * Write consent decision as a first-party browser cookie + localStorage mirror.
 * The browser cookie makes consent visible in DevTools → Application → Cookies.
 */
export function writeConsent(
  categories: Omit<ConsentCategories, 'essential'>
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: { essential: true, ...categories },
  };

  const json = JSON.stringify(record);
  const encoded = encodeURIComponent(json);
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  document.cookie = `${CONSENT_COOKIE_NAME}=${encoded}; Max-Age=${CONSENT_TTL}; Path=/; SameSite=Strict${secureFlag}`;
  localStorage.setItem(CONSENT_LS_KEY, json);

  // Clean up legacy key
  localStorage.removeItem(LEGACY_LS_KEY);

  return record;
}

/**
 * Read stored consent. Returns null if:
 * - no consent recorded yet
 * - stored version is older than CONSENT_VERSION (forces re-consent)
 *
 * Reads from document.cookie first, falls back to localStorage mirror.
 */
export function readConsent(): ConsentRecord | null {
  let json: string | null = null;

  // Try cookie first
  if (typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
    if (match) {
      try {
        json = decodeURIComponent(match.split('=').slice(1).join('='));
      } catch {
        json = null;
      }
    }
  }

  // Fall back to localStorage mirror
  if (!json) {
    json = localStorage.getItem(CONSENT_LS_KEY);
  }

  // Legacy migration: if old binary key exists, treat "accepted" as all-true
  if (!json) {
    const legacy = localStorage.getItem(LEGACY_LS_KEY);
    if (legacy === 'accepted') {
      // Migrate to new format — write proper record
      const migrated = writeConsent({ analytics: true, marketing: true });
      return migrated;
    } else if (legacy === 'declined') {
      const migrated = writeConsent({ analytics: false, marketing: false });
      return migrated;
    }
  }

  if (!json) return null;

  try {
    const record: ConsentRecord = JSON.parse(json);
    if (record.version < CONSENT_VERSION) return null; // version mismatch → re-consent
    return record;
  } catch {
    return null;
  }
}

/**
 * Clear stored consent (delete cookie + localStorage).
 * Used when user wants to reset preferences.
 */
export function clearConsent(): void {
  document.cookie = `${CONSENT_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Strict`;
  localStorage.removeItem(CONSENT_LS_KEY);
  localStorage.removeItem(LEGACY_LS_KEY);
}

// --- Google Consent Mode v2 ---

/**
 * Push granular consent signals to gtag.
 * - analytics → analytics_storage
 * - marketing → ad_storage, ad_user_data, ad_personalization
 * - functionality & personalization always granted (essential UX: cart, preferences)
 */
export function applyConsentToGtag(categories: ConsentCategories): void {
  if (typeof window.gtag !== 'function') return;

  window.gtag('consent', 'update', {
    analytics_storage: categories.analytics ? 'granted' : 'denied',
    ad_storage: categories.marketing ? 'granted' : 'denied',
    ad_user_data: categories.marketing ? 'granted' : 'denied',
    ad_personalization: categories.marketing ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  });
}

/**
 * Restore consent state from storage on page load.
 * Call this early in App mount so gtag signals are updated before GA fires its first hit.
 */
export function restoreConsentState(): void {
  const record = readConsent();
  if (record) {
    applyConsentToGtag(record.categories);
  }
}

// --- Predicates (fast synchronous reads from localStorage mirror) ---

export function hasAnalyticsConsent(): boolean {
  try {
    const json = localStorage.getItem(CONSENT_LS_KEY);
    if (!json) return false;
    const record: ConsentRecord = JSON.parse(json);
    return record.version >= CONSENT_VERSION && record.categories.analytics === true;
  } catch {
    return false;
  }
}

export function hasMarketingConsent(): boolean {
  try {
    const json = localStorage.getItem(CONSENT_LS_KEY);
    if (!json) return false;
    const record: ConsentRecord = JSON.parse(json);
    return record.version >= CONSENT_VERSION && record.categories.marketing === true;
  } catch {
    return false;
  }
}

export function hasAnyConsent(): boolean {
  return readConsent() !== null;
}

// --- Legacy shims (kept for backward compat with existing call sites) ---

/** @deprecated Use hasAnalyticsConsent() from consentMode directly */
export const grantAnalyticsConsent = (): void => {
  const record = writeConsent({ analytics: true, marketing: true });
  applyConsentToGtag(record.categories);
};

/** @deprecated Use writeConsent + applyConsentToGtag directly */
export const denyAnalyticsConsent = (): void => {
  const record = writeConsent({ analytics: false, marketing: false });
  applyConsentToGtag(record.categories);
};
