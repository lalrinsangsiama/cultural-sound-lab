// This file configures the initialization of Sentry on the client side.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Make Sentry available on window for testing
if (typeof window !== 'undefined') {
  (window as any).Sentry = Sentry;
}

Sentry.init({
  dsn: "https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640",

  // Replay
  integrations: [
    Sentry.replayIntegration({
      // Capture 10% of all sessions,
      sessionSampleRate: 0.1,
      // and capture 100% of sessions with an error
      errorSampleRate: 1.0,
    }),
    // Log console messages to Sentry
    Sentry.consoleLoggingIntegration({ 
      levels: ["error", "warn"] 
    }),
  ],

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Error Filtering
  ignoreErrors: [
    // Ignore common browser errors
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Ignore network errors
    "NetworkError",
    "Failed to fetch",
  ],

  // Set environment
  environment: process.env.NODE_ENV,

  // Enable in both development and production for testing
  enabled: true,

  // Enable experimental features
  _experiments: {
    enableLogs: true,
  },
});