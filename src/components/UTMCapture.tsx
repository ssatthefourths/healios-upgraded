import { useEffect } from "react";
import { captureUTMParams, captureReferralCode } from "@/hooks/useUTMCapture";

/**
 * Component to capture UTM parameters and referral codes on app load
 * Should be placed near the top of the app component tree
 */
export const UTMCapture = () => {
  useEffect(() => {
    captureUTMParams();
    captureReferralCode();
  }, []);

  return null;
};
