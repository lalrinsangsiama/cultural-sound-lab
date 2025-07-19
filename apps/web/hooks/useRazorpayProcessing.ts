import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { captureApiError } from '@/lib/api/error-handling';
import type { GenerationResult } from './useGeneration';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'netbanking' | 'wallet' | 'upi';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid';
  receipt?: string;
  key: string; // Razorpay key for frontend
}

export interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  order: RazorpayOrder | null;
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useRazorpayProcessing() {
  const [state, setState] = useState<PaymentState>({
    isProcessing: false,
    error: null,
    order: null,
    retryCount: 0,
    savedGeneration: null,
  });

  const getFailureReason = (errorCode: string): PaymentFailureReason => {
    const reasons: Record<string, PaymentFailureReason> = {
      BAD_REQUEST_ERROR: {
        code: 'BAD_REQUEST_ERROR',
        message: 'Invalid payment request.',
        canRetry: true,
        suggestedAction: 'Please check your payment details and try again.',
      },
      GATEWAY_ERROR: {
        code: 'GATEWAY_ERROR',
        message: 'Payment gateway error.',
        canRetry: true,
        suggestedAction: 'Please try again in a few moments.',
      },
      NETWORK_ERROR: {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed.',
        canRetry: true,
        suggestedAction: 'Please check your internet connection and try again.',
      },
      SERVER_ERROR: {
        code: 'SERVER_ERROR',
        message: 'Server error occurred.',
        canRetry: true,
        suggestedAction: 'Please try again later.',
      },
      payment_failed: {
        code: 'payment_failed',
        message: 'Payment failed.',
        canRetry: true,
        suggestedAction: 'Please try a different payment method.',
      },
      payment_cancelled: {
        code: 'payment_cancelled',
        message: 'Payment was cancelled.',
        canRetry: true,
        suggestedAction: 'You can try again when ready.',
      },
      insufficient_funds: {
        code: 'insufficient_funds',
        message: 'Insufficient funds.',
        canRetry: true,
        suggestedAction: 'Please check your account balance or use a different payment method.',
      },
      card_declined: {
        code: 'card_declined',
        message: 'Card was declined.',
        canRetry: true,
        suggestedAction: 'Please try a different card or contact your bank.',
      },
      expired_card: {
        code: 'expired_card',
        message: 'Card has expired.',
        canRetry: false,
        suggestedAction: 'Please use a different card with a valid expiry date.',
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

      setState(prev => ({ ...prev, savedGeneration: saved as GenerationResult }));
      return saved;
    } catch (error) {
      console.error('Failed to save generation:', error);
      return null;
    }
  }, []);

  const createOrder = useCallback(async (amount: number, generationData?: GenerationResult) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const order = await apiClient.post<RazorpayOrder>('/razorpay/orders', {
        amount,
        currency: 'INR',
        generationId: generationData?.id,
        description: 'Cultural Sound Lab Generation',
      });

      setState(prev => ({ ...prev, order, isProcessing: false }));
      return order;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isProcessing: false 
      }));
      
      captureApiError(error, { amount, generationData });
      
      // Save generation if order creation fails
      if (generationData) {
        await saveGenerationForLater(generationData);
      }
      
      throw error;
    }
  }, [saveGenerationForLater]);

  const openPaymentModal = useCallback((
    order: RazorpayOrder,
    userDetails: { name: string; email: string; contact?: string },
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ) => {
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded');
    }

    const options = {
      key: order.key,
      amount: order.amount,
      currency: order.currency,
      name: 'Cultural Sound Lab',
      description: 'AI-Generated Cultural Music',
      order_id: order.id,
      prefill: {
        name: userDetails.name,
        email: userDetails.email,
        contact: userDetails.contact || '',
      },
      theme: {
        color: '#F37254'
      },
      handler: async (response: any) => {
        try {
          // Verify payment on server
          const verification = await apiClient.post('/razorpay/verify-payment', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            retryCount: 0,
            error: null 
          }));

          onSuccess(verification);
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            error: 'Payment verification failed', 
            isProcessing: false 
          }));
          onError(error);
        }
      },
      modal: {
        ondismiss: () => {
          setState(prev => ({ ...prev, isProcessing: false }));
          onError(new Error('Payment cancelled by user'));
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }, []);

  const processPayment = useCallback(async (
    order: RazorpayOrder,
    userDetails: { name: string; email: string; contact?: string },
    generationData?: GenerationResult
  ) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    return new Promise((resolve, reject) => {
      openPaymentModal(
        order,
        userDetails,
        (response) => {
          resolve(response);
        },
        async (error) => {
          const retryCount = state.retryCount + 1;
          const failureReason = getFailureReason(error?.code || 'payment_failed');
          
          setState(prev => ({ 
            ...prev, 
            error: failureReason.message, 
            isProcessing: false,
            retryCount 
          }));

          captureApiError(error, { 
            orderId: order.id,
            retryCount,
            generationData 
          });

          // Save generation if payment fails and we've exceeded retry limit
          if (retryCount >= 3 && generationData) {
            await saveGenerationForLater(generationData);
          }

          reject({
            ...error,
            failureReason,
            canRetry: failureReason.canRetry && retryCount < 3,
          });
        }
      );
    });
  }, [state.retryCount, openPaymentModal, saveGenerationForLater]);

  const retryPayment = useCallback(async (
    userDetails: { name: string; email: string; contact?: string },
    generationData?: GenerationResult
  ) => {
    if (!state.order || state.retryCount >= 3) {
      throw new Error('Cannot retry payment');
    }

    return processPayment(state.order, userDetails, generationData);
  }, [state.order, state.retryCount, processPayment]);

  const requestRefund = useCallback(async (paymentId: string, reason: string) => {
    try {
      const refund = await apiClient.post('/razorpay/refunds', {
        paymentId,
        notes: { reason },
      });
      return refund;
    } catch (error) {
      captureApiError(error, { paymentId, reason });
      throw error;
    }
  }, []);

  const fetchUserOrders = useCallback(async () => {
    try {
      const orders = await apiClient.get('/razorpay/orders');
      return orders;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }, []);

  const fetchUserSubscriptions = useCallback(async () => {
    try {
      const subscriptions = await apiClient.get('/razorpay/subscriptions');
      return subscriptions;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      return [];
    }
  }, []);

  const createSubscription = useCallback(async (planId: string, totalCount: number) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const subscription = await apiClient.post('/razorpay/subscriptions', {
        planId,
        totalCount,
        subscriptionType: 'premium',
      });

      setState(prev => ({ ...prev, isProcessing: false }));
      return subscription;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to create subscription', 
        isProcessing: false 
      }));
      throw error;
    }
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    try {
      const result = await apiClient.put(`/razorpay/subscriptions/${subscriptionId}/cancel`);
      return result;
    } catch (error) {
      captureApiError(error, { subscriptionId });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      order: null,
      retryCount: 0,
      savedGeneration: null,
    });
  }, []);

  return {
    ...state,
    createOrder,
    processPayment,
    retryPayment,
    openPaymentModal,
    requestRefund,
    fetchUserOrders,
    fetchUserSubscriptions,
    createSubscription,
    cancelSubscription,
    saveGenerationForLater,
    getFailureReason,
    reset,
    canRetry: state.retryCount < 3,
    maxRetriesReached: state.retryCount >= 3,
  };
}