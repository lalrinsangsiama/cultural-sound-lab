// This file configures the initialization of Sentry on the edge runtime.
// The config you add here will be used whenever a edge function is invoked.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Set environment
  environment: process.env.NODE_ENV,

  // Disable in development
  enabled: process.env.NODE_ENV === "production",

  // Enable experimental features
  _experiments: {
    enableLogs: true,
  },
});