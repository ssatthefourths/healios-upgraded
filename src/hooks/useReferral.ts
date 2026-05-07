import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import logger from '@/lib/logger';

// Helper function to mask email addresses for privacy
const maskEmail = (email: string | null): string | null => {
  if (!email) return null;
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = localPart.length <= 2
    ? localPart.charAt(0) + '***'
    : localPart.substring(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
};

interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string | null;
  referred_user_id: string | null;
  status: string;
  reward_points: number;
  order_id: string | null;
  created_at: string;
  converted_at: string | null;
}

interface ReferralStats {
  totalReferrals: number;
  convertedReferrals: number;
  totalPointsEarned: number;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    convertedReferrals: 0,
    totalPointsEarned: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralCode = useCallback(async () => {
    if (!user) return;
    try {
      const { code } = await apiPost<{ code: string }>('/referrals/code');
      setReferralCode(code);
    } catch (err) {
      logger.error('Error fetching referral code', err);
    }
  }, [user]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await apiGet<{ data: Referral[] }>('/referrals');
      const visible = (data || []).filter(r => r.referred_email !== null);
      const masked = visible.map(r => ({ ...r, referred_email: maskEmail(r.referred_email) }));
      setReferrals(masked);

      const converted = visible.filter(r => r.status === 'rewarded' || r.status === 'converted');
      const pointsEarned = converted.reduce((sum, r) => sum + (r.reward_points || 0), 0);
      setStats({
        totalReferrals: visible.length,
        convertedReferrals: converted.length,
        totalPointsEarned: pointsEarned,
      });
    } catch (err) {
      logger.error('Error fetching referrals', err);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReferralCode(), fetchReferrals()]);
      setIsLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, fetchReferralCode, fetchReferrals]);

  const getReferralLink = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/?ref=${referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    if (link) {
      await navigator.clipboard.writeText(link);
      return true;
    }
    return false;
  };

  const copyReferralCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      return true;
    }
    return false;
  };

  return {
    referralCode,
    referrals,
    stats,
    isLoading,
    getReferralLink,
    copyReferralLink,
    copyReferralCode,
    refreshReferrals: fetchReferrals,
  };
};
