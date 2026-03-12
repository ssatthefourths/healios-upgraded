import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { grantAnalyticsConsent, denyAnalyticsConsent } from '@/lib/consentMode';

const COOKIE_CONSENT_KEY = 'healios-cookie-consent';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
    
    // Update Google Consent Mode v2
    grantAnalyticsConsent();
    
    // Dispatch event for analytics initialization
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setShowBanner(false);
    
    // Update Google Consent Mode v2
    denyAnalyticsConsent();
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 pr-8">
          <p className="text-sm text-foreground">
            We use cookies to enhance your browsing experience, analyse site traffic, and personalise content. 
            By clicking "Accept", you consent to our use of cookies in accordance with our{' '}
            <a href="/privacy-policy" className="underline hover:text-primary">
              Privacy Policy
            </a>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 sm:hidden text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
