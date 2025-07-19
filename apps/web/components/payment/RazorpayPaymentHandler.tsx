"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useRazorpayProcessing } from '@/hooks/useRazorpayProcessing';
import { 
  CreditCard, 
  Loader2, 
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  Save 
} from 'lucide-react';

interface RazorpayPaymentHandlerProps {
  amount: number;
  currency?: string;
  userDetails: {
    name: string;
    email: string;
    contact?: string;
  };
  generationData?: any;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  onSaveForLater?: () => void;
}

// Load Razorpay script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function RazorpayPaymentHandler({
  amount,
  currency = 'INR',
  userDetails,
  generationData,
  onSuccess,
  onError,
  onSaveForLater,
}: RazorpayPaymentHandlerProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  
  const {
    isProcessing,
    error,
    order,
    retryCount,
    createOrder,
    processPayment,
    retryPayment,
    getFailureReason,
    canRetry,
    maxRetriesReached,
    reset,
  } = useRazorpayProcessing();

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setScriptLoaded(loaded);
      if (!loaded) {
        setScriptError(true);
      }
    });
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) {
      setScriptError(true);
      return;
    }

    try {
      // Create order first
      const orderData = await createOrder(amount, generationData);
      
      // Process payment
      const response = await processPayment(orderData, userDetails, generationData);
      onSuccess(response);
    } catch (error) {
      onError(error);
    }
  };

  const handleRetry = async () => {
    try {
      const response = await retryPayment(userDetails, generationData);
      onSuccess(response);
    } catch (error) {
      onError(error);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  if (scriptError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Payment Service Unavailable</CardTitle>
          </div>
          <CardDescription>
            Unable to load payment service. Please try again later or contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            {onSaveForLater && (
              <Button
                variant="outline"
                onClick={onSaveForLater}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save for Later
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !maxRetriesReached) {
    const failureReason = getFailureReason(error);
    
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Payment Failed</CardTitle>
            {retryCount > 0 && (
              <Badge variant="destructive">
                Attempt {retryCount} of 3
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

          <div className="flex flex-col gap-3">
            {canRetry && (
              <Button
                onClick={handleRetry}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isProcessing ? 'Retrying...' : 'Try Again'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => reset()}
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
              onClick={() => window.open('/support', '_blank')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (maxRetriesReached) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Payment Attempts Exceeded</CardTitle>
          </div>
          <CardDescription>
            Maximum retry attempts reached. Your generation has been saved for later.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p>You can complete the payment from your dashboard or contact support for assistance.</p>
                <p className="text-sm text-muted-foreground">
                  We've saved your generation so you won't lose your work.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/support', '_blank')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          Secure payment powered by Razorpay
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="font-semibold">{formatAmount(amount, currency)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Payment Method:</span>
            <span className="text-sm">Card / UPI / NetBanking / Wallet</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button
            onClick={handlePayment}
            disabled={isProcessing || !scriptLoaded}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : `Pay ${formatAmount(amount, currency)}`}
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          <p>
            Your payment is secured by Razorpay with 256-bit SSL encryption.
          </p>
          <p className="mt-1">
            We accept all major credit/debit cards, UPI, NetBanking & wallets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface PaymentSuccessProps {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  onContinue: () => void;
  onDownload?: () => void;
}

export function PaymentSuccess({
  paymentId,
  orderId,
  amount,
  currency,
  onContinue,
  onDownload,
}: PaymentSuccessProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-800">Payment Successful!</CardTitle>
        </div>
        <CardDescription>
          Your payment of {formatAmount(amount, currency)} has been processed successfully.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="p-3 bg-white rounded border">
            <div className="text-xs text-muted-foreground">Payment ID</div>
            <div className="font-mono text-sm">{paymentId}</div>
          </div>
          <div className="p-3 bg-white rounded border">
            <div className="text-xs text-muted-foreground">Order ID</div>
            <div className="font-mono text-sm">{orderId}</div>
          </div>
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