import { useState, useCallback, useRef } from "react";

interface UseRateLimitedActionOptions {
  cooldownMs?: number;
}

/**
 * Hook to rate-limit user actions (prevent rapid clicks)
 * @param action - The async action function to execute
 * @param options - Configuration options including cooldown period
 * @returns { execute, isBlocked, isExecuting }
 */
export function useRateLimitedAction<T extends (...args: any[]) => Promise<void>>(
  action: T,
  options: UseRateLimitedActionOptions = {}
) {
  const { cooldownMs = 1000 } = options;
  const [isBlocked, setIsBlocked] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const lastExecutionRef = useRef<number>(0);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      const now = Date.now();
      
      // Check if we're still in cooldown period
      if (now - lastExecutionRef.current < cooldownMs) {
        setIsBlocked(true);
        return;
      }

      // Reset blocked state and start execution
      setIsBlocked(false);
      setIsExecuting(true);
      lastExecutionRef.current = now;

      try {
        await action(...args);
      } finally {
        setIsExecuting(false);
      }
    },
    [action, cooldownMs]
  );

  return { execute, isBlocked, isExecuting };
}

/**
 * Simple synchronous rate limiter for click handlers
 * @param handler - The handler function
 * @param cooldownMs - Minimum time between executions
 */
export function useThrottledClick(
  handler: (e?: React.MouseEvent) => void,
  cooldownMs: number = 500
) {
  const lastClickRef = useRef<number>(0);
  const [isThrottled, setIsThrottled] = useState(false);

  const throttledHandler = useCallback(
    (e?: React.MouseEvent) => {
      const now = Date.now();
      
      if (now - lastClickRef.current < cooldownMs) {
        setIsThrottled(true);
        e?.preventDefault();
        return;
      }

      setIsThrottled(false);
      lastClickRef.current = now;
      handler(e);
    },
    [handler, cooldownMs]
  );

  return { handler: throttledHandler, isThrottled };
}
