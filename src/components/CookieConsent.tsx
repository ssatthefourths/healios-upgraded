import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  readConsent,
  writeConsent,
  applyConsentToGtag,
} from '@/lib/consentMode';

type Phase = 'hidden' | 'banner' | 'modal';

interface DraftCategories {
  analytics: boolean;
  marketing: boolean;
}

interface CategoryRowProps {
  title: string;
  description: string;
  badge?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const CategoryRow = ({
  title,
  description,
  badge,
  checked,
  disabled = false,
  onCheckedChange,
}: CategoryRowProps) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-normal text-foreground">{title}</span>
        {badge && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-light text-muted-foreground leading-relaxed">{description}</p>
    </div>
    <div className="shrink-0 pt-0.5">
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
        className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
      />
    </div>
  </div>
);

export const CookieConsent = () => {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [draft, setDraft] = useState<DraftCategories>({ analytics: false, marketing: false });

  useEffect(() => {
    const stored = readConsent();
    if (!stored) {
      setPhase('banner');
    }

    // Allow footer / other components to re-open preferences
    const handleOpenPreferences = () => {
      const current = readConsent();
      setDraft({
        analytics: current?.categories.analytics ?? false,
        marketing: current?.categories.marketing ?? false,
      });
      setPhase('modal');
    };

    window.addEventListener('open-cookie-preferences', handleOpenPreferences);
    return () => window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
  }, []);

  const saveConsent = (categories: DraftCategories) => {
    const record = writeConsent(categories);
    applyConsentToGtag(record.categories);
    setPhase('hidden');
    // Notify Analytics component to conditionally initialise scripts
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'));
  };

  const openModal = () => {
    const current = readConsent();
    setDraft({
      analytics: current?.categories.analytics ?? false,
      marketing: current?.categories.marketing ?? false,
    });
    setPhase('modal');
  };

  return (
    <>
      {/* ── Cookie Banner ── */}
      {phase === 'banner' && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-50 px-page py-4 bg-background border-t border-border shadow-[var(--shadow-ambient-hover)]"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm font-light text-foreground leading-relaxed flex-1 pr-4">
              We use cookies to measure site performance and personalise your experience. See our{' '}
              <a href="/privacy-policy" className="underline hover:text-muted-foreground transition-colors">
                Privacy Policy
              </a>{' '}
              for details.
            </p>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button variant="ghost" size="sm" onClick={openModal} className="text-xs">
                Manage Preferences
              </Button>
              <Button variant="outline" size="sm" onClick={() => saveConsent({ analytics: false, marketing: false })}>
                Decline All
              </Button>
              <Button size="sm" onClick={() => saveConsent({ analytics: true, marketing: true })}>
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences Modal ── */}
      <Dialog open={phase === 'modal'} onOpenChange={(open) => !open && setPhase('hidden')}>
        <DialogContent className="max-w-md rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)]">
          <DialogHeader>
            <DialogTitle className="text-base font-normal">Cookie Preferences</DialogTitle>
            <DialogDescription className="text-sm font-light text-muted-foreground">
              Choose which cookies you allow us to use. You can change these settings at any time
              via the Cookie Settings link in the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <CategoryRow
              title="Essential Cookies"
              badge="Always on"
              description="Required for core site functionality — secure login, shopping cart, and site preferences. Cannot be disabled."
              checked={true}
              disabled={true}
            />
            <CategoryRow
              title="Analytics Cookies"
              description="Help us understand how visitors use the site so we can improve it. Includes Google Analytics and Microsoft Clarity (session recordings, heatmaps). No personally identifiable information is collected."
              checked={draft.analytics}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
            />
            <CategoryRow
              title="Marketing Cookies"
              description="Used to personalise ads and measure the effectiveness of our marketing campaigns. Includes the Meta (Facebook) Pixel. Data may be shared with advertising partners."
              checked={draft.marketing}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveConsent({ analytics: false, marketing: false })}
            >
              Decline All
            </Button>
            <Button size="sm" onClick={() => saveConsent(draft)}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
