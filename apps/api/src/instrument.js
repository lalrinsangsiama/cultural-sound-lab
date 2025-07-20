// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: "https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640",

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  
  // Additional configuration
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event, hint) {
    if (event.exception && process.env.NODE_ENV === 'development') {
      console.error('Sentry captured error:', hint.originalException);
    }
    return event;
  },
});