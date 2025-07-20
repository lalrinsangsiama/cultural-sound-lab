/**
 * Example component showing how to use Sentry in Cultural Sound Lab
 * This demonstrates proper error tracking and performance monitoring
 */

"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { 
  trackGeneration, 
  trackApiCall, 
  trackUserAction,
  trackCulturalAccess,
  capturePaymentError,
  logger 
} from "@/lib/sentry-helpers";

export function GenerationExampleWithSentry() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Example 1: Track button clicks with Sentry
  const handleGenerateClick = async () => {
    // Track the user action
    trackUserAction("generate_sound_logo_click", {
      source: "example_page",
      timestamp: new Date().toISOString(),
    });

    setIsGenerating(true);

    try {
      // Example 2: Track AI generation with performance monitoring
      const result = await trackGeneration(
        "sound-logo",
        {
          duration: 15,
          style: "corporate",
          mood: "energetic",
        },
        async () => {
          // Simulate API call
          const response = await trackApiCall(
            "POST",
            "/api/generate/sound-logo",
            async () => {
              const res = await fetch("/api/generate/sound-logo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  duration: 15,
                  style: "corporate",
                  mood: "energetic",
                }),
              });

              if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
              }

              return res.json();
            }
          );

          return response;
        }
      );

      // Example 3: Track cultural content access
      trackCulturalAccess(
        result.id,
        "generated-sound-logo",
        "mizo",
        "user-123"
      );

      // Log success
      logger.info("Sound logo generated successfully", {
        generationId: result.id,
        duration: 15,
      });

    } catch (error) {
      // Example 4: Capture exceptions with context
      Sentry.captureException(error, {
        tags: {
          component: "GenerationExample",
          action: "generate_sound_logo",
        },
        contexts: {
          generation: {
            type: "sound-logo",
            requestedDuration: 15,
            style: "corporate",
          },
        },
      });

      // Log the error
      logger.error("Failed to generate sound logo", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

    } finally {
      setIsGenerating(false);
    }
  };

  // Example 5: Handle payment errors
  const handlePayment = async () => {
    try {
      const paymentData = {
        orderId: "order_123",
        amount: 999,
        currency: "INR",
        method: "razorpay",
      };

      // Track payment attempt
      Sentry.startSpan(
        {
          op: "payment.process",
          name: "Process Razorpay Payment",
        },
        async (span) => {
          span.setAttribute("payment.amount", paymentData.amount);
          span.setAttribute("payment.currency", paymentData.currency);
          span.setAttribute("payment.method", paymentData.method);

          // Simulate payment processing
          const result = await processPayment(paymentData);
          
          span.setAttribute("payment.status", "success");
          return result;
        }
      );

    } catch (error) {
      // Use the helper to capture payment errors with full context
      capturePaymentError(error as Error, {
        orderId: "order_123",
        amount: 999,
        currency: "INR",
        method: "razorpay",
      });
    }
  };

  return (
    <div className="p-4">
      <h2>Sentry Integration Example</h2>
      
      <button
        onClick={handleGenerateClick}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isGenerating ? "Generating..." : "Generate Sound Logo"}
      </button>

      <button
        onClick={handlePayment}
        className="ml-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Test Payment
      </button>
    </div>
  );
}

// Mock payment function for example
async function processPayment(data: any) {
  // Simulate random payment failure
  if (Math.random() > 0.5) {
    throw new Error("Payment gateway timeout");
  }
  return { success: true, transactionId: "txn_123" };
}