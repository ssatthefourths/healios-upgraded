import { useState } from 'react';
import { useReferral } from '@/hooks/useReferral';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Users, Gift, Check, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ReferralSection = () => {
  const { referralCode, referrals, stats, isLoading, getReferralLink, copyReferralLink, copyReferralCode } = useReferral();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopiedLink(true);
      toast.success('Referral link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      setCopiedCode(true);
      toast.success('Referral code copied');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = async () => {
    const link = getReferralLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Healios',
          text: 'Use my referral code to get bonus points on your first order!',
          url: link,
        });
      } catch (err) {
        // User cancelled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-48"></div>
        <div className="h-24 bg-muted rounded"></div>
        <div className="h-32 bg-muted rounded"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'signed_up':
        return <Badge variant="outline">Signed Up</Badge>;
      case 'converted':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Ordered</Badge>;
      case 'rewarded':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Rewarded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-light text-foreground mb-2">Refer Friends & Earn Rewards</h2>
        <p className="text-muted-foreground text-sm">
          Share your referral code and earn 500 points when your friend makes their first purchase. 
          Your friend gets 250 bonus points too!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium text-foreground">{stats.totalReferrals}</p>
          <p className="text-xs text-muted-foreground">Friends Referred</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <Check className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium text-foreground">{stats.convertedReferrals}</p>
          <p className="text-xs text-muted-foreground">Successful Referrals</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <Gift className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-medium text-foreground">{stats.totalPointsEarned}</p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-secondary/30 rounded-lg p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Your Referral Code
          </label>
          <div className="flex gap-2">
            <Input
              value={referralCode || ''}
              readOnly
              className="font-mono text-lg tracking-wider bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Your Referral Link
          </label>
          <div className="flex gap-2">
            <Input
              value={getReferralLink()}
              readOnly
              className="text-sm bg-background"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={handleShare}
              className="shrink-0"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/20 rounded-lg p-6">
        <h3 className="font-medium text-foreground mb-4">How It Works</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">1</span>
            <span>Share your unique referral code or link with friends</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">2</span>
            <span>Your friend enters the code at checkout or signs up via your link</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">3</span>
            <span>When they make their first purchase, you both earn points!</span>
          </li>
        </ol>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div>
          <h3 className="font-medium text-foreground mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-muted/20 rounded-lg"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {referral.referred_email || 'Pending referral'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {referral.status === 'rewarded' && (
                    <span className="text-xs text-primary">+{referral.referrer_reward_points} pts</span>
                  )}
                  {getStatusBadge(referral.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
