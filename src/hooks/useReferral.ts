import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  referral_code: string;
  referred_email: string | null;
  status: string;
  converted_at: string | null;
  created_at: string;
  referrer_reward_points: number;
  referred_reward_points: number;
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
      const { data, error } = await supabase.rpc('get_or_create_referral_code', {
        p_user_id: user.id
      });

      if (error) {
        logger.error('Error fetching referral code', error);
        return;
      }

      setReferralCode(data);
    } catch (err) {
      logger.error('Error in fetchReferralCode', err);
    }
  }, [user]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .neq('referred_email', null)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching referrals', error);
        return;
      }

      // Mask email addresses before storing in state
      const maskedReferrals = (data || []).map(referral => ({
        ...referral,
        referred_email: maskEmail(referral.referred_email),
      }));

      setReferrals(maskedReferrals);

      // Calculate stats
      const converted = data?.filter(r => r.status === 'rewarded' || r.status === 'converted') || [];
      const pointsEarned = converted.reduce((sum, r) => sum + (r.referrer_reward_points || 0), 0);

      setStats({
        totalReferrals: data?.length || 0,
        convertedReferrals: converted.length,
        totalPointsEarned: pointsEarned,
      });
    } catch (err) {
      logger.error('Error in fetchReferrals', err);
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
