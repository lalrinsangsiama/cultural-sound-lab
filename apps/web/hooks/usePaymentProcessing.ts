import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { captureApiError } from '@/lib/api/error-handling';
import type { GenerationResult } from './useGeneration';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
  clientSecret?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  paymentIntent: PaymentIntent | null;
  retryCount: number;
  savedGeneration: GenerationResult | null;
}

export interface PaymentFailureReason {
  code: string;
  message: string;
  canRetry: boolean;
  suggestedAction: string;
  alternativePaymentMethods?: PaymentMethod[];
}

export function usePaymentProcessing() {
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    paymentIntent: null,
    retryCount: 0,
    savedGeneration: null,
  });

  const getFailureReason = (errorCode: string): PaymentFailureReason => {
    const reasons: Record<string, PaymentFailureReason> = {
      card_declined: {
        code: 'card_declined',
        message: 'Your card was declined.',
        canRetry: true,
        suggestedAction: 'Please try a different payment method or contact your bank.',
      },
      insufficient_funds: {
        code: 'insufficient_funds',
        message: 'Insufficient funds on your card.',
        canRetry: true,
        suggestedAction: 'Please use a different card or add funds to your account.',
      },
      expired_card: {
        code: 'expired_card',
        message: 'Your card has expired.',
        canRetry: false,
        suggestedAction: 'Please use a different card with a valid expiry date.',
      },
      incorrect_cvc: {
        code: 'incorrect_cvc',
        message: 'Your card\'s security code is incorrect.',
        canRetry: true,
        suggestedAction: 'Please check your card\'s security code and try again.',
      },
      processing_error: {
        code: 'processing_error',
        message: 'We encountered an error processing your payment.',
        canRetry: true,
        suggestedAction: 'Please try again in a few moments.',
      },
      authentication_required: {
        code: 'authentication_required',
        message: 'Additional authentication is required.',
        canRetry: true,
        suggestedAction: 'Please complete the authentication with your bank.',
      },
      rate_limit: {
        code: 'rate_limit',
        message: 'Too many payment attempts.',
        canRetry: false,
        suggestedAction: 'Please wait a few minutes before trying again.',
      },
    };

    return reasons[errorCode] || {
      code: 'unknown',
      message: 'An unexpected error occurred.',
      canRetry: true,
      suggestedAction: 'Please try again or contact support.',
    };
  };

  const saveGenerationForLater = useCallback(async (generationData: GenerationResult) => {
    try {
      const saved = await apiClient.post('/generations/save-draft', {
        ...generationData,
        savedAt: new Date().toISOString(),
        reason: 'payment_failed',
      });

      setState(prev => ({ ...prev, savedGeneration: saved }));
      return saved;
    } catch (error) {
      console.error('Failed to save generation:', error);
      return null;
    }
  }, []);

  const createPaymentIntent = useCallback(async (amount: number, generationData?: GenerationResult) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const paymentIntent = await apiClient.post<PaymentIntent>('/payments/create-intent', {
        amount,
        currency: 'usd',
        metadata: {
          generationId: generationData?.id,
          type: 'generation_payment',
        },
      });

      setState(prev => ({ ...prev, paymentIntent, isProcessing: false }));
      return paymentIntent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      
      captureApiError(error, { amount, generationData });
      
      // Save generation if payment intent creation fails
      if (generationData) {
        await saveGenerationForLater(generationData);
      }
      
      throw error;
    }
  }, [saveGenerationForLater]);

  const confirmPayment = useCallback(async (
    paymentMethodId: string, 
    paymentIntentId: string,
    generationData?: GenerationResult
  ) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await apiClient.post('/payments/confirm', {
        paymentMethodId,
        paymentIntentId,
      });

      setState(prev => ({ 
        ...prev, 
        paymentIntent: result, 
        isProcessing: false,
        retryCount: 0 
      }));

      return result;
    } catch (error: unknown) {
      const retryCount = state.retryCount + 1;
      const failureReason = getFailureReason((error as { code?: string }).code || 'processing_error');
      
      setState(prev => ({ 
        ...prev, 
        error: failureReason.message, 
        isProcessing: false,
        retryCount 
      }));

      captureApiError(error, { 
        paymentMethodId, 
        paymentIntentId, 
        retryCount,
        generationData 
      });

      // Save generation if payment fails and we've exceeded retry limit
      if (retryCount >= 3 && generationData) {
        await saveGenerationForLater(generationData);
      }

      throw {
        ...error,
        failureReason,
        canRetry: failureReason.canRetry && retryCount < 3,
      };
    }
  }, [state.retryCount, saveGenerationForLater]);

  const retryPayment = useCallback(async (paymentMethodId?: string) => {
    if (!state.paymentIntent || state.retryCount >= 3) {
      throw new Error('Cannot retry payment');
    }

    return confirmPayment(
      paymentMethodId || '', 
      state.paymentIntent.id
    );
  }, [state.paymentIntent, state.retryCount, confirmPayment]);

  const getAlternativePaymentMethods = useCallback(async () => {
    try {
      const methods = await apiClient.get<PaymentMethod[]>('/payments/methods');
      return methods;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  }, []);

  const cancelPayment = useCallback(async (reason: string = 'user_cancelled') => {
    if (!state.paymentIntent) return;

    try {
      await apiClient.post(`/payments/${state.paymentIntent.id}/cancel`, { reason });
      setState(prev => ({ 
        ...prev, 
        paymentIntent: null, 
        error: null,
        retryCount: 0 
      }));
    } catch (error) {
      console.error('Failed to cancel payment:', error);
    }
  }, [state.paymentIntent]);

  const requestRefund = useCallback(async (paymentIntentId: string, reason: string) => {
    try {
      const refund = await apiClient.post('/payments/refund', {
        paymentIntentId,
        reason,
      });
      return refund;
    } catch (error) {
      captureApiError(error, { paymentIntentId, reason });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      paymentIntent: null,
      retryCount: 0,
      savedGeneration: null,
    });
  }, []);

  return {
    ...state,
    createPaymentIntent,
    confirmPayment,
    retryPayment,
    getAlternativePaymentMethods,
    cancelPayment,
    requestRefund,
    saveGenerationForLater,
    getFailureReason,
    reset,
    canRetry: state.retryCount < 3,
    maxRetriesReached: state.retryCount >= 3,
  };
}