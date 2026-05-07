import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiPost } from '@/lib/api';
import { toast } from 'sonner';
import { Users, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStoredReferralCode, clearStoredReferralCode } from '@/hooks/useUTMCapture';

interface ReferralCodeInputProps {
  customerEmail: string;
  onReferralApplied: (code: string, referrerName: string) => void;
  appliedCode: string | null;
  onRemoveReferral: () => void;
}

const ReferralCodeInput = ({
  customerEmail,
  onReferralApplied,
  appliedCode,
  onRemoveReferral,
}: ReferralCodeInputProps) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [autoApplyAttempted, setAutoApplyAttempted] = useState(false);

  // Auto-apply referral code from URL if present
  useEffect(() => {
    const storedCode = getStoredReferralCode();
    if (storedCode && customerEmail && !appliedCode && !autoApplyAttempted) {
      setCode(storedCode);
      setAutoApplyAttempted(true);
      // Auto-apply after a short delay to ensure email is set
      const timer = setTimeout(() => {
        handleApplyCode(storedCode);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [customerEmail, appliedCode, autoApplyAttempted]);

  const handleApplyCode = async (codeToApply: string) => {
    if (!codeToApply.trim()) {
      toast.error('Please enter a referral code');
      return;
    }

    if (!customerEmail) {
      toast.error('Please enter your email first');
      return;
    }

    setIsValidating(true);

    try {
      // Auth-gated endpoint: requires the customer to be signed in. The
      // checkout flow already prompts sign-in before reaching the referral
      // section, so unauthenticated requests fall through with a 401 the
      // catch handler converts to a user-friendly toast.
      if (!user) {
        toast.error('Please sign in to apply a referral code');
        return;
      }

      const result = await apiPost<{ id: string; referrerId: string; status: string }>(
        '/referrals/apply',
        {
          code: codeToApply.trim().toUpperCase(),
          referredEmail: customerEmail,
        },
      );

      const friendlyName = 'A friend'; // Worker does not yet expose referrer name; preserve UX copy.
      setReferrerName(friendlyName);
      onReferralApplied(codeToApply.trim().toUpperCase(), friendlyName);
      toast.success('Referral code applied!');
      setIsExpanded(false);
      clearStoredReferralCode();
    } catch (err: any) {
      console.error('Error applying referral:', err);
      toast.error(err?.message || 'Invalid referral code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApply = () => handleApplyCode(code);

  const handleRemove = () => {
    setCode('');
    setReferrerName(null);
    onRemoveReferral();
    setIsExpanded(false);
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Referred by {referrerName || 'a friend'}
            </p>
            <p className="text-xs text-muted-foreground">
              You'll earn 250 bonus points on your first order!
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
      >
        <Users className="w-4 h-4" />
        Have a referral code?
      </button>
    );
  }

  return (
    <div className="space-y-3 border border-border p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          Enter Referral Code
        </span>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code (e.g., JANE1A2B)"
          className="font-mono tracking-wider"
          disabled={isValidating}
        />
        <Button
          onClick={handleApply}
          disabled={isValidating || !code.trim()}
          className="shrink-0"
        >
          {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Earn 250 bonus points when you use a friend's referral code!
      </p>
    </div>
  );
};

export default ReferralCodeInput;
