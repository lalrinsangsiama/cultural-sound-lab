"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bug, CheckCircle2, Zap } from "lucide-react";

export default function SentryExamplePage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const triggerError = () => {
    addResult("Triggering a test error...");
    throw new Error("This is a test error from Sentry example page!");
  };

  const triggerAsyncError = async () => {
    addResult("Triggering an async error...");
    await new Promise((resolve) => setTimeout(resolve, 100));
    throw new Error("This is an async test error!");
  };

  const triggerTypeError = () => {
    addResult("Triggering a TypeError...");
    // @ts-ignore - Intentionally calling undefined function
    myUndefinedFunction();
  };

  const triggerRejectedPromise = () => {
    addResult("Triggering an unhandled promise rejection...");
    Promise.reject(new Error("This is an unhandled promise rejection!"));
  };

  const captureMessage = () => {
    addResult("Sending a test message to Sentry...");
    if (typeof window !== "undefined" && window.Sentry) {
      window.Sentry.captureMessage("Test message from Cultural Sound Lab", "info");
      addResult("Message sent successfully!");
    } else {
      addResult("Sentry not initialized");
    }
  };

  const captureException = () => {
    addResult("Capturing a handled exception...");
    try {
      throw new Error("This is a handled exception!");
    } catch (error) {
      if (typeof window !== "undefined" && window.Sentry) {
        window.Sentry.captureException(error);
        addResult("Exception captured successfully!");
      } else {
        addResult("Sentry not initialized");
      }
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Sentry Integration Test Page
          </CardTitle>
          <CardDescription>
            Test your Sentry error tracking integration by triggering various types of errors.
            Check your Sentry dashboard to see if these errors are being captured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={triggerError}
              variant="destructive"
              className="w-full"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Trigger Error
            </Button>
            
            <Button
              onClick={triggerAsyncError}
              variant="destructive"
              className="w-full"
            >
              <Zap className="mr-2 h-4 w-4" />
              Trigger Async Error
            </Button>
            
            <Button
              onClick={triggerTypeError}
              variant="destructive"
              className="w-full"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Trigger TypeError
            </Button>
            
            <Button
              onClick={triggerRejectedPromise}
              variant="destructive"
              className="w-full"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Trigger Unhandled Promise
            </Button>
            
            <Button
              onClick={captureMessage}
              variant="secondary"
              className="w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Send Test Message
            </Button>
            
            <Button
              onClick={captureException}
              variant="secondary"
              className="w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Capture Exception
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Test Results:</h3>
              <div className="bg-muted rounded-lg p-4 space-y-1 max-h-60 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click any button above to trigger an error</li>
              <li>Check your browser console for error messages</li>
              <li>Visit your Sentry dashboard at sentry.io</li>
              <li>Verify that the errors appear in your project&apos;s issues list</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add Sentry to window type
declare global {
  interface Window {
    Sentry: any;
  }
}