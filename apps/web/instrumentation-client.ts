import * as Sentry from "@sentry/nextjs";

// Required for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Sentry is already initialized in sentry.client.config.ts
// This file is just for exporting the navigation instrumentation