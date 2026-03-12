/**
 * Microsoft Clarity integration
 * Provides initialization and custom event tracking.
 * Clarity Project ID is read from VITE_CLARITY_ID env variable.
 */

const CLARITY_SCRIPT_ID = 'microsoft-clarity-script';

declare global {
  interface Window {
    clarity: (...args: any[]) => void;
  }
}

/** Load the Clarity tracking script (call once after consent) */
export const initializeClarity = () => {
  const clarityId = import.meta.env.VITE_CLARITY_ID || 'vsma9av1yg';
  if (!clarityId) return;
  if (document.getElementById(CLARITY_SCRIPT_ID)) return;

  // Clarity bootstrap snippet
  (function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.id = CLARITY_SCRIPT_ID;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', 'script', clarityId);
};

/** Fire a Clarity custom event (no-op if Clarity isn't loaded) */
export const trackClarityEvent = (name: string) => {
  if (typeof window.clarity === 'function') {
    window.clarity('event', name);
  }
};

/** Tag a Clarity session with a custom key/value */
export const tagClaritySession = (key: string, value: string) => {
  if (typeof window.clarity === 'function') {
    window.clarity('set', key, value);
  }
};
