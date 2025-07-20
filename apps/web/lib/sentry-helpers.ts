/**
 * Sentry helper functions for Cultural Sound Lab
 * This file provides reusable functions for error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";

// Get the logger instance
export const { logger } = Sentry;

/**
 * Track AI generation events with Sentry
 */
export async function trackGeneration<T>(
  type: "sound-logo" | "playlist" | "social-clip" | "long-form",
  params: Record<string, any>,
  generationFn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: "ai.generate",
      name: `Generate ${type}`,
    },
    async (span) => {
      span.setAttribute("generation.type", type);
      Object.entries(params).forEach(([key, value]) => {
        span.setAttribute(`generation.${key}`, value);
      });

      try {
        const startTime = Date.now();
        const result = await generationFn();
        const duration = Date.now() - startTime;

        span.setAttribute("generation.success", true);
        span.setAttribute("generation.duration_ms", duration);

        logger.info(`${type} generation completed`, {
          type,
          duration,
          params,
        });

        return result;
      } catch (error) {
        span.setAttribute("generation.success", false);
        
        logger.error(`${type} generation failed`, {
          type,
          params,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        Sentry.captureException(error, {
          tags: {
            generationType: type,
          },
          contexts: {
            generation: {
              type,
              params,
            },
          },
        });
        
        throw error;
      }
    }
  );
}

/**
 * Track API calls with Sentry
 */
export async function trackApiCall<T>(
  method: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `${method} ${endpoint}`,
    },
    async (span) => {
      span.setAttribute("http.method", method);
      span.setAttribute("http.url", endpoint);

      try {
        const result = await fn();
        span.setAttribute("http.status_code", 200);
        return result;
      } catch (error: any) {
        const statusCode = error?.response?.status || 500;
        span.setAttribute("http.status_code", statusCode);
        
        logger.warn(`API call failed: ${method} ${endpoint}`, {
          method,
          endpoint,
          statusCode,
          error: error?.message,
        });

        Sentry.captureException(error, {
          tags: {
            httpMethod: method,
            httpEndpoint: endpoint,
            httpStatus: statusCode,
          },
        });
        
        throw error;
      }
    }
  );
}

/**
 * Track user interactions with Sentry
 */
export function trackUserAction(
  action: string,
  details?: Record<string, any>
): void {
  Sentry.startSpan(
    {
      op: "ui.action",
      name: action,
    },
    (span) => {
      if (details) {
        Object.entries(details).forEach(([key, value]) => {
          span.setAttribute(`action.${key}`, value);
        });
      }

      logger.info(`User action: ${action}`, details);
    }
  );
}

/**
 * Track cultural content access
 */
export function trackCulturalAccess(
  contentId: string,
  contentType: string,
  culture: string,
  userId?: string
): void {
  logger.info("Cultural content accessed", {
    contentId,
    contentType,
    culture,
    userId,
    timestamp: new Date().toISOString(),
  });

  // Increment metrics
  Sentry.metrics.increment("cultural_content.access", 1, {
    tags: {
      culture,
      contentType,
    },
  });
}

/**
 * Capture payment errors with context
 */
export function capturePaymentError(
  error: Error,
  paymentData: {
    orderId?: string;
    amount?: number;
    currency?: string;
    method?: string;
  }
): void {
  Sentry.captureException(error, {
    level: "error",
    tags: {
      category: "payment",
      paymentMethod: paymentData.method,
    },
    contexts: {
      payment: {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        method: paymentData.method,
      },
    },
  });

  logger.error("Payment processing failed", {
    ...paymentData,
    error: error.message,
  });
}