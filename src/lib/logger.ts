/**
 * Logging utility for consistent, environment-aware logging
 * Replaces scattered console.log/error statements
 */

const isDev = import.meta.env.DEV;

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Logger utility with environment-aware logging
 * - debug/info: Only log in development
 * - warn/error: Always log (production needs to see errors)
 */
export const logger = {
  /**
   * Debug-level logging - only in development
   */
  debug: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, context || "");
    }
  },

  /**
   * Info-level logging - only in development
   */
  info: (message: string, context?: LogContext) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, context || "");
    }
  },

  /**
   * Warning-level logging - always logs
   */
  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context || "");
  },

  /**
   * Error-level logging - always logs
   * In the future, this could send errors to a tracking service (Sentry, etc.)
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    console.error(`[ERROR] ${message}`, error || "", context || "");
    
    // Future: Send to error tracking service
    // if (!isDev && errorTrackingService) {
    //   errorTrackingService.captureException(error, { extra: context });
    // }
  },

  /**
   * Track analytics events - only in development for debugging
   */
  analytics: (event: string, data?: Record<string, unknown>) => {
    if (isDev) {
      console.log(`[ANALYTICS] ${event}`, data || "");
    }
  },
};

export default logger;
