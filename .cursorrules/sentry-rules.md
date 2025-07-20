# Sentry Integration Rules for Cultural Sound Lab

These examples should be used as guidance when configuring Sentry functionality within a project.

## Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

## Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

### Custom Span instrumentation in component actions

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

### Custom span instrumentation in API calls

The `name` and `op` properties should be meaningful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

## Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`
Enable logging in Sentry using `Sentry.init({ _experiments: { enableLogs: true } })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

### Configuration

In NextJS the client side Sentry initialization is in `instrumentation-client.ts`, the server initialization is in `sentry.edge.config.ts` and the edge initialization is in `sentry.server.config.ts`
Initialization does not need to be repeated in other files, it only needs to happen the files mentioned above. You should use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality

#### Baseline

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2fddb04e024bb6a7717753ef879c84d9@o4509699240361984.ingest.us.sentry.io/4509699280076800",

  _experiments: {
    enableLogs: true,
  },
});
```

#### Logger Integration

```javascript
Sentry.init({
  dsn: "https://2fddb04e024bb6a7717753ef879c84d9@o4509699240361984.ingest.us.sentry.io/4509699280076800",
  integrations: [
    // send console.log, console.error, and console.warn calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] }),
  ],
});
```

### Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```

## Cultural Sound Lab Specific Examples

### Audio Generation Tracking

```javascript
// Track AI generation requests
async function generateSoundLogo(params) {
  return Sentry.startSpan(
    {
      op: "ai.generate",
      name: "Generate Sound Logo",
    },
    async (span) => {
      span.setAttribute("generation.type", "sound-logo");
      span.setAttribute("generation.duration", params.duration);
      span.setAttribute("generation.style", params.style);
      
      try {
        const result = await aiService.generateSoundLogo(params);
        span.setAttribute("generation.success", true);
        return result;
      } catch (error) {
        span.setAttribute("generation.success", false);
        Sentry.captureException(error);
        throw error;
      }
    },
  );
}
```

### Payment Processing

```javascript
// Track payment events
async function processPayment(paymentData) {
  return Sentry.startSpan(
    {
      op: "payment.process",
      name: "Process Payment",
    },
    async (span) => {
      span.setAttribute("payment.amount", paymentData.amount);
      span.setAttribute("payment.currency", paymentData.currency);
      span.setAttribute("payment.method", paymentData.method);
      
      try {
        const result = await razorpayService.processPayment(paymentData);
        span.setAttribute("payment.status", "success");
        return result;
      } catch (error) {
        span.setAttribute("payment.status", "failed");
        Sentry.captureException(error, {
          contexts: {
            payment: {
              orderId: paymentData.orderId,
              amount: paymentData.amount,
            },
          },
        });
        throw error;
      }
    },
  );
}
```

### Cultural Context Preservation

```javascript
// Log important cultural context access
const { logger } = Sentry;

function accessCulturalContent(contentId, userId) {
  logger.info("Cultural content accessed", {
    contentId,
    userId,
    culture: "mizo",
    timestamp: new Date().toISOString(),
  });
  
  // Track usage for analytics
  Sentry.metrics.increment("cultural_content.access", 1, {
    tags: {
      culture: "mizo",
      contentType: "audio",
    },
  });
}
```