/**
 * Production-aware logger for the test-app
 * 
 * In production (when NEXT_PUBLIC_DISABLE_LOGS is set), only errors are logged.
 * In development, all logs are shown.
 */

const isProduction = process.env.NEXT_PUBLIC_DISABLE_LOGS === 'true' || 
                     process.env.NODE_ENV === 'production';

/**
 * Logger that respects production environment
 * Only logs errors in production, all levels in development
 */
export const logger = {
  /**
   * Log debug information - only in development
   */
  debug: (...args: unknown[]) => {
    if (!isProduction) {
      console.debug('[Veridex]', ...args);
    }
  },

  /**
   * Log general information - only in development
   */
  log: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[Veridex]', ...args);
    }
  },

  /**
   * Log warnings - only in development
   */
  warn: (...args: unknown[]) => {
    if (!isProduction) {
      console.warn('[Veridex]', ...args);
    }
  },

  /**
   * Log errors - always logged (even in production)
   * These are important for debugging production issues
   */
  error: (...args: unknown[]) => {
    console.error('[Veridex]', ...args);
  },

  /**
   * Log critical info that should appear even in production
   * Use sparingly - only for essential user-facing info
   */
  info: (...args: unknown[]) => {
    console.info('[Veridex]', ...args);
  },
};

export default logger;
