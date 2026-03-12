import { useState } from "react";
import { Gift, Star, History, ChevronDown, ChevronUp, Crown, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useLoyaltyPoints, LOYALTY_TIERS } from "@/hooks/useLoyaltyPoints";
import { format } from "date-fns";

const TierIcon = ({ tier }: { tier: string }) => {
  if (tier === 'gold') return <Crown className="h-4 w-4" />;
  if (tier === 'silver') return <Award className="h-4 w-4" />;
  return <Star className="h-4 w-4" />;
};

const LoyaltyPointsSection = () => {
  const { 
    loyaltyPoints, 
    transactions, 
    isLoading, 
    getRedemptionValue,
    MIN_REDEEM_POINTS,
    currentTier,
    tierInfo,
    nextTierName,
    nextTierInfo,
    getProgressToNextTier,
  } = useLoyaltyPoints();
  
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const pointsBalance = loyaltyPoints?.points_balance || 0;
  const lifetimePoints = loyaltyPoints?.lifetime_points_earned || 0;
  const redemptionValue = getRedemptionValue(pointsBalance);
  const { progress, pointsNeeded } = getProgressToNextTier();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-light text-foreground">Loyalty Points</h2>
      </div>

      {/* Points Balance Card */}
      <div className={`${tierInfo.bgColor} border ${tierInfo.borderColor} rounded-lg p-6`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-light text-foreground">{pointsBalance.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">points</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Worth <span className="font-medium text-foreground">£{redemptionValue.toFixed(2)}</span> off your next order
            </p>
          </div>
          <div className={`text-right ${tierInfo.color}`}>
            <div className="flex items-center gap-1">
              <TierIcon tier={currentTier} />
              <span className="text-xs font-medium">{tierInfo.name}</span>
            </div>
            <p className="text-xs mt-1">{tierInfo.multiplier}x points</p>
          </div>
        </div>
        
        <div className={`mt-4 pt-4 border-t ${tierInfo.borderColor}`}>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lifetime points earned</span>
            <span className="text-foreground">{lifetimePoints.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      {nextTierInfo && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-foreground">Progress to {nextTierInfo.name}</h3>
            <span className={`text-xs font-medium ${nextTierInfo.color}`}>
              {pointsNeeded.toLocaleString()} points away
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Reach {nextTierInfo.name} tier to earn <span className="font-medium">{nextTierInfo.multiplier}x points</span> on every purchase
          </p>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Tier Benefits</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(LOYALTY_TIERS).map(([key, tier]) => (
            <div 
              key={key}
              className={`p-3 rounded-lg border text-center ${
                currentTier === key 
                  ? `${tier.bgColor} ${tier.borderColor}` 
                  : 'border-border bg-background'
              }`}
            >
              <div className={`flex justify-center mb-1 ${tier.color}`}>
                <TierIcon tier={key} />
              </div>
              <p className={`text-xs font-medium ${currentTier === key ? tier.color : 'text-muted-foreground'}`}>
                {tier.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{tier.multiplier}x points</p>
              <p className="text-[10px] text-muted-foreground">
                {tier.minPoints === 0 ? 'Start' : `${tier.minPoints}+ pts`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">How it works</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">•</span>
            <span>Earn 1 point for every £1 you spend (multiplied by your tier)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">•</span>
            <span>Redeem 100 points for £1 off your order</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-medium">•</span>
            <span>Points are added after your order is delivered</span>
          </li>
        </ul>
        {pointsBalance < MIN_REDEEM_POINTS && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            You need at least {MIN_REDEEM_POINTS} points to redeem. Keep shopping to earn more!
          </p>
        )}
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div>
          <Button
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full justify-between px-0 hover:bg-transparent"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <History className="h-4 w-4" />
              Recent Activity
            </span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showHistory && (
            <div className="mt-3 space-y-2">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${
                    tx.points > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LoyaltyPointsSection;
