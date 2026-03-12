import { useState } from "react";
import { Gift, Minus, Plus, Star, Award, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoyaltyPoints, POINTS_VALUE, MIN_REDEEM_POINTS } from "@/hooks/useLoyaltyPoints";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface LoyaltyPointsRedeemProps {
  onRedeemChange: (pointsToRedeem: number, discountValue: number) => void;
  maxRedeemValue: number; // Maximum discount based on order total
  orderTotal?: number; // Order total for calculating points to earn
}

const TierBadge = ({ tier, multiplier }: { tier: string; multiplier: number }) => {
  const Icon = tier === 'gold' ? Crown : tier === 'silver' ? Award : Star;
  const colorClass = tier === 'gold' 
    ? 'text-yellow-500' 
    : tier === 'silver' 
    ? 'text-slate-400' 
    : 'text-amber-700';
    
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {multiplier}x
    </span>
  );
};

const LoyaltyPointsRedeem = ({ onRedeemChange, maxRedeemValue, orderTotal = 0 }: LoyaltyPointsRedeemProps) => {
  const { user } = useAuth();
  const { 
    loyaltyPoints, 
    isLoading, 
    getRedemptionValue, 
    calculatePointsToEarn,
    currentTier,
    tierInfo,
  } = useLoyaltyPoints();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const pointsToEarn = calculatePointsToEarn(orderTotal);

  if (!user) {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Loyalty Points</span>
        </div>
        <p className="text-xs text-muted-foreground">
          <Link to="/auth" className="underline hover:no-underline text-primary">Sign in</Link> to earn and redeem loyalty points
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-32 mb-2" />
        <div className="h-3 bg-muted rounded w-48" />
      </div>
    );
  }

  const pointsBalance = loyaltyPoints?.points_balance || 0;
  
  if (pointsBalance < MIN_REDEEM_POINTS) {
    return (
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Loyalty Points</span>
        </div>
        <p className="text-xs text-muted-foreground">
          You have {pointsBalance} points. Earn {MIN_REDEEM_POINTS - pointsBalance} more to redeem!
        </p>
      </div>
    );
  }

  // Calculate max points that can be redeemed (limited by balance and order total)
  const maxPointsByValue = Math.floor(maxRedeemValue / POINTS_VALUE);
  const maxRedeemablePoints = Math.min(pointsBalance, maxPointsByValue);
  const roundedMaxPoints = Math.floor(maxRedeemablePoints / 100) * 100; // Round down to nearest 100

  const handlePointsChange = (delta: number) => {
    const newPoints = Math.max(0, Math.min(pointsToRedeem + delta, roundedMaxPoints));
    setPointsToRedeem(newPoints);
    onRedeemChange(newPoints, getRedemptionValue(newPoints));
  };

  const handleApplyAll = () => {
    setPointsToRedeem(roundedMaxPoints);
    onRedeemChange(roundedMaxPoints, getRedemptionValue(roundedMaxPoints));
  };

  const handleRemove = () => {
    setPointsToRedeem(0);
    onRedeemChange(0, 0);
  };

  const discountValue = getRedemptionValue(pointsToRedeem);

  return (
    <div className={`${tierInfo.bgColor} border ${tierInfo.borderColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Loyalty Points</span>
          <TierBadge tier={currentTier} multiplier={tierInfo.multiplier} />
        </div>
        <span className="text-xs text-muted-foreground">
          Balance: {pointsBalance.toLocaleString()} pts
        </span>
      </div>

      {/* Points to earn display */}
      {orderTotal > 0 && pointsToEarn > 0 && (
        <div className="mb-3 pb-3 border-b border-border/50">
          <p className="text-xs text-muted-foreground">
            You'll earn <span className="font-medium text-foreground">{pointsToEarn} points</span> from this order
            {tierInfo.multiplier > 1 && (
              <span className={tierInfo.color}> ({tierInfo.multiplier}x {tierInfo.name} bonus!)</span>
            )}
          </p>
        </div>
      )}

      {pointsToRedeem === 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Use up to {roundedMaxPoints.toLocaleString()} points (£{getRedemptionValue(roundedMaxPoints).toFixed(2)} off)
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyAll}
            className="text-xs"
          >
            Apply Points
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePointsChange(-100)}
                disabled={pointsToRedeem < 100}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium min-w-[80px] text-center">
                {pointsToRedeem.toLocaleString()} pts
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePointsChange(100)}
                disabled={pointsToRedeem >= roundedMaxPoints}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-xs text-muted-foreground"
            >
              Remove
            </Button>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-primary/20">
            <span className="text-sm text-muted-foreground">Points discount</span>
            <span className="text-sm font-medium text-green-600">-£{discountValue.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyPointsRedeem;
