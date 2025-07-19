"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { usePaymentProcessing, PaymentMethod } from '@/hooks/usePaymentProcessing';
import { 
  AlertTriangle, 
  CreditCard, 
  RefreshCw, 
  MessageCircle, 
  Save,
  CheckCircle2,
  XCircle 
} from 'lucide-react';

interface PaymentErrorHandlerProps {
  error: string;
  errorCode?: string;
  canRetry: boolean;
  onRetry: () => void;
  onChangePaymentMethod: () => void;
  onContactSupport: () => void;
  onSaveForLater?: () => void;
  alternativePaymentMethods?: PaymentMethod[];
  isRetrying?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export function PaymentErrorHandler({
  error,
  errorCode,
  canRetry,
  onRetry,
  onChangePaymentMethod,
  onContactSupport,
  onSaveForLater,
  alternativePaymentMethods = [],
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
}: PaymentErrorHandlerProps) {
  const { getFailureReason } = usePaymentProcessing();
  const failureReason = errorCode ? getFailureReason(errorCode) : null;

  const getErrorSeverity = (code?: string) => {
    const highSeverity = ['card_declined', 'insufficient_funds', 'expired_card'];
    const mediumSeverity = ['incorrect_cvc', 'authentication_required'];
    
    if (!code) return 'low';
    if (highSeverity.includes(code)) return 'high';
    if (mediumSeverity.includes(code)) return 'medium';
    return 'low';
  };

  const severity = getErrorSeverity(errorCode);

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Payment Failed</CardTitle>
          {errorCode && (
            <Badge variant={severity === 'high' ? 'destructive' : 'secondary'}>
              {errorCode.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </div>
        <CardDescription>{error}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {failureReason && (
          <Alert>
            <AlertDescription>
              <strong>What happened:</strong> {failureReason.suggestedAction}
            </AlertDescription>
          </Alert>
        )}

        {retryCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span>Failed {retryCount} of {maxRetries} attempts</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {canRetry && retryCount < maxRetries && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              className="flex items-center gap-2"
            >
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onChangePaymentMethod}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Try Different Payment Method
          </Button>

          {onSaveForLater && (
            <Button
              variant="outline"
              onClick={onSaveForLater}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Generation & Pay Later
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onContactSupport}
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </Button>
        </div>

        {alternativePaymentMethods.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Payment Methods:</h4>
            <div className="grid gap-2">
              {alternativePaymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => onChangePaymentMethod()}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm">
                      {method.brand?.toUpperCase()} •••• {method.last4}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {method.expiryMonth}/{method.expiryYear}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {retryCount >= maxRetries && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Maximum retry attempts reached. Your generation has been saved for later.</p>
                <p className="text-sm">
                  You can complete the payment from your dashboard or contact support for assistance.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentSuccessProps {
  paymentIntentId: string;
  amount: number;
  currency: string;
  onContinue: () => void;
  onDownload?: () => void;
}

export function PaymentSuccess({
  paymentIntentId,
  amount,
  currency,
  onContinue,
  onDownload,
}: PaymentSuccessProps) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-800">Payment Successful!</CardTitle>
        </div>
        <CardDescription>
          Your payment of {currency.toUpperCase()} ${(amount / 100).toFixed(2)} has been processed successfully.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-3 bg-white rounded border">
          <div className="text-xs text-muted-foreground">Transaction ID</div>
          <div className="font-mono text-sm">{paymentIntentId}</div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onContinue} className="flex-1">
            Continue
          </Button>
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SavedGenerationNoticeProps {
  generation: {
    id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
    parameters?: Record<string, unknown>;
  };
  onPayNow: () => void;
  onViewDashboard: () => void;
}

export function SavedGenerationNotice({
  generation,
  onPayNow,
  onViewDashboard,
}: SavedGenerationNoticeProps) {
  return (
    <Alert>
      <Save className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <p className="font-medium">Generation Saved Successfully</p>
            <p className="text-sm text-muted-foreground">
              Your audio generation has been saved and you can complete the payment later.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" onClick={onPayNow}>
              Complete Payment Now
            </Button>
            <Button size="sm" variant="outline" onClick={onViewDashboard}>
              View in Dashboard
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}