import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LoyaltyPoints {
  points_balance: number;
  lifetime_points_earned: number;
}

interface LoyaltyTransaction {
  id: string;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjustment';
  points: number;
  description: string;
  created_at: string;
}

// Loyalty program constants
export const POINTS_PER_POUND = 1; // Base earn rate: 1 point per £1 spent
export const POINTS_VALUE = 0.01; // 1 point = £0.01 (100 points = £1)
export const MIN_REDEEM_POINTS = 100; // Minimum points to redeem

// Loyalty tiers based on lifetime points earned
export const LOYALTY_TIERS = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    multiplier: 1.0,
    color: 'text-amber-700',
    bgColor: 'bg-amber-700/10',
    borderColor: 'border-amber-700/30',
  },
  silver: {
    name: 'Silver',
    minPoints: 500, // £500 lifetime spend
    multiplier: 1.5,
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    borderColor: 'border-slate-400/30',
  },
  gold: {
    name: 'Gold',
    minPoints: 1500, // £1500 lifetime spend
    multiplier: 2.0,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
} as const;

export type TierName = keyof typeof LOYALTY_TIERS;

export const getTierByPoints = (lifetimePoints: number): TierName => {
  if (lifetimePoints >= LOYALTY_TIERS.gold.minPoints) return 'gold';
  if (lifetimePoints >= LOYALTY_TIERS.silver.minPoints) return 'silver';
  return 'bronze';
};

export const getNextTier = (currentTier: TierName): TierName | null => {
  if (currentTier === 'bronze') return 'silver';
  if (currentTier === 'silver') return 'gold';
  return null;
};

export const useLoyaltyPoints = () => {
  const { user } = useAuth();
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoyaltyData = useCallback(async () => {
    if (!user) {
      setLoyaltyPoints(null);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch points balance
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('points_balance, lifetime_points_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      setLoyaltyPoints(pointsData || { points_balance: 0, lifetime_points_earned: 0 });

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('loyalty_transactions')
        .select('id, transaction_type, points, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions((transactionsData as LoyaltyTransaction[]) || []);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  // Get current tier based on lifetime points
  const currentTier = getTierByPoints(loyaltyPoints?.lifetime_points_earned || 0);
  const tierInfo = LOYALTY_TIERS[currentTier];
  const nextTierName = getNextTier(currentTier);
  const nextTierInfo = nextTierName ? LOYALTY_TIERS[nextTierName] : null;

  // Calculate progress to next tier
  const getProgressToNextTier = useCallback((): { progress: number; pointsNeeded: number } => {
    const lifetime = loyaltyPoints?.lifetime_points_earned || 0;
    if (!nextTierInfo) return { progress: 100, pointsNeeded: 0 };
    
    const currentTierMin = tierInfo.minPoints;
    const nextTierMin = nextTierInfo.minPoints;
    const pointsInRange = lifetime - currentTierMin;
    const rangeSize = nextTierMin - currentTierMin;
    
    return {
      progress: Math.min(100, (pointsInRange / rangeSize) * 100),
      pointsNeeded: nextTierMin - lifetime,
    };
  }, [loyaltyPoints, tierInfo, nextTierInfo]);

  // Calculate redemption value in GBP
  const getRedemptionValue = useCallback((points: number): number => {
    return points * POINTS_VALUE;
  }, []);

  // Calculate points that would be earned for a given order total (with tier multiplier)
  const calculatePointsToEarn = useCallback((orderTotalGBP: number): number => {
    const basePoints = Math.floor(orderTotalGBP * POINTS_PER_POUND);
    return Math.floor(basePoints * tierInfo.multiplier);
  }, [tierInfo]);

  // Check if user can redeem a specific amount of points
  const canRedeem = useCallback((points: number): boolean => {
    if (!loyaltyPoints) return false;
    return points >= MIN_REDEEM_POINTS && points <= loyaltyPoints.points_balance;
  }, [loyaltyPoints]);

  return {
    loyaltyPoints,
    transactions,
    isLoading,
    getRedemptionValue,
    calculatePointsToEarn,
    canRedeem,
    refetch: fetchLoyaltyData,
    // Tier info
    currentTier,
    tierInfo,
    nextTierName,
    nextTierInfo,
    getProgressToNextTier,
    // Constants
    POINTS_PER_POUND,
    POINTS_VALUE,
    MIN_REDEEM_POINTS,
    LOYALTY_TIERS,
  };
};
