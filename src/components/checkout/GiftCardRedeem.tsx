import { useState } from "react";
import { Gift, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

interface GiftCardRedeemProps {
  onRedeemChange: (code: string | null, balance: number, amountToApply: number) => void;
  maxRedeemValue: number;
}

interface GiftCardValidation {
  valid: boolean;
  message: string;
  balance: number;
  expires_at: string | null;
}

const GiftCardRedeem = ({ onRedeemChange, maxRedeemValue }: GiftCardRedeemProps) => {
  const { formatPrice } = useCurrency();
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCard, setAppliedCard] = useState<{
    code: string;
    balance: number;
    amountApplied: number;
  } | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      toast.error("Please enter a gift card code");
      return;
    }

    setIsValidating(true);

    try {
      const { data, error } = await supabase.rpc('validate_gift_card', {
        p_code: code.trim()
      });

      if (error) {
        throw error;
      }

      const result = data?.[0] as GiftCardValidation | undefined;

      if (!result || !result.valid) {
        toast.error(result?.message || "Invalid gift card code");
        return;
      }

      // Calculate how much to apply (min of balance and order total)
      const amountToApply = Math.min(result.balance, maxRedeemValue);

      setAppliedCard({
        code: code.trim().toUpperCase(),
        balance: result.balance,
        amountApplied: amountToApply,
      });

      onRedeemChange(code.trim().toUpperCase(), result.balance, amountToApply);
      setShowInput(false);
      
      if (amountToApply < result.balance) {
        toast.success(`Gift card applied! ${formatPrice(result.balance - amountToApply)} remaining balance`);
      } else {
        toast.success("Gift card applied successfully!");
      }
    } catch (error) {
      console.error('Gift card validation error:', error);
      toast.error("Failed to validate gift card");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setAppliedCard(null);
    setCode("");
    setShowInput(false);
    onRedeemChange(null, 0, 0);
  };

  // Update applied amount when maxRedeemValue changes
  if (appliedCard && appliedCard.amountApplied !== Math.min(appliedCard.balance, maxRedeemValue)) {
    const newAmount = Math.min(appliedCard.balance, maxRedeemValue);
    setAppliedCard({
      ...appliedCard,
      amountApplied: newAmount,
    });
    onRedeemChange(appliedCard.code, appliedCard.balance, newAmount);
  }

  if (appliedCard) {
    return (
      <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Gift className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">
                {appliedCard.code}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(appliedCard.amountApplied)} applied
              {appliedCard.balance > appliedCard.amountApplied && (
                <> · {formatPrice(appliedCard.balance - appliedCard.amountApplied)} remaining</>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
      >
        <Gift className="w-4 h-4" />
        <span className="underline hover:no-underline">Have a gift card?</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Gift Card</span>
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="flex-1 font-mono text-sm uppercase"
          disabled={isValidating}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleValidate();
            }
          }}
        />
        <Button
          onClick={handleValidate}
          variant="outline"
          size="sm"
          disabled={isValidating}
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
        <Button
          onClick={() => {
            setShowInput(false);
            setCode("");
          }}
          variant="ghost"
          size="sm"
          className="px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GiftCardRedeem;
