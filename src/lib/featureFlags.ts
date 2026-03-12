import { ReactNode } from "react";

/**
 * Feature flag system for runtime feature toggling
 * Allows enabling/disabling features without code changes
 */

export type FeatureFlag =
  | "chatbot"
  | "referralProgram"
  | "giftCards"
  | "subscriptions"
  | "wellnessDrive"
  | "loyaltyPoints";

/**
 * Feature flag configuration
 * In the future, these could be fetched from a database or remote config
 */
const FLAGS: Record<FeatureFlag, boolean> = {
  chatbot: false, // Wellness chatbot is disabled
  referralProgram: true,
  giftCards: true,
  subscriptions: true,
  wellnessDrive: true,
  loyaltyPoints: true,
};

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag] ?? false;
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...FLAGS };
}

/**
 * FeatureGate component - conditionally renders children based on feature flag
 */
interface FeatureGateProps {
  flag: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  flag,
  children,
  fallback = null,
}: FeatureGateProps): ReactNode {
  if (isFeatureEnabled(flag)) {
    return children;
  }
  return fallback;
}
