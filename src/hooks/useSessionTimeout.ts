import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
}

/**
 * Session timeout hook for admin users
 * Shows warning dialog before logout and auto-logs out after inactivity
 */
export const useSessionTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  enabled = true,
}: UseSessionTimeoutOptions = {}) => {
  const { user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timeoutRef.current = null;
    warningRef.current = null;
    countdownRef.current = null;
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    await supabase.auth.signOut();
  }, [clearAllTimers]);

  const resetTimer = useCallback(() => {
    if (!enabled || !user) return;

    clearAllTimers();
    setShowWarning(false);

    // Set warning timer (fires before timeout)
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(warningMinutes * 60);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeoutMs - warningMs);

    // Set final timeout (backup in case countdown fails)
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMs);
  }, [enabled, user, timeoutMs, warningMs, warningMinutes, clearAllTimers, handleLogout]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled || !user) {
      clearAllTimers();
      return;
    }

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    // Throttle activity detection to avoid excessive resets
    let lastActivity = Date.now();
    const throttleMs = 30000; // Only reset timer every 30 seconds of activity

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > throttleMs && !showWarning) {
        lastActivity = now;
        resetTimer();
      }
    };

    // Initial timer setup
    resetTimer();

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearAllTimers();
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, user, resetTimer, clearAllTimers, showWarning]);

  // Format remaining time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    showWarning,
    secondsRemaining,
    formattedTime: formatTime(secondsRemaining),
    extendSession,
    logout: handleLogout,
  };
};
