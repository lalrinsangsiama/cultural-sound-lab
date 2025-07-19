import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { paymentService } from '@/services/payment';
import { supabase } from '@/config/supabase';
import Stripe from 'stripe';

export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      amount,
      currency = 'usd',
      licenseId,
      generationId,
      description,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Valid amount is required'
      });
    }

    if (!licenseId && !generationId) {
      return res.status(400).json({
        error: 'Either licenseId or generationId is required'
      });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', req.user!.id)
      .single();

    if (userError) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get or create Stripe customer
    const customer = await paymentService.getOrCreateCustomer(
      user.id,
      user.email,
      user.name
    );

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent({
      amount,
      currency,
      customerId: customer.id,
      description: description || 'Cultural Sound Lab License',
      metadata: {
        userId: user.id,
        licenseId,
        generationId,
        type: licenseId ? 'license' : 'generation',
      },
    });

    res.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const confirmPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    // Confirm payment intent
    const paymentIntent = await paymentService.confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId
    );

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const cancelPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentIntentId } = req.params;
    const { reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    // Verify user owns the payment intent
    const { data: paymentRecord, error } = await supabase
      .from('payment_intents')
      .select('user_id')
      .eq('id', paymentIntentId)
      .single();

    if (error || paymentRecord?.user_id !== req.user!.id) {
      return res.status(404).json({
        error: 'Payment intent not found'
      });
    }

    const paymentIntent = await paymentService.cancelPaymentIntent(paymentIntentId, reason);

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      message: 'Payment canceled successfully'
    });
  } catch (error) {
    console.error('Error canceling payment:', error);
    res.status(500).json({
      error: 'Failed to cancel payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      priceId,
      subscriptionType,
      trialPeriodDays,
    } = req.body;

    if (!priceId) {
      return res.status(400).json({
        error: 'Price ID is required'
      });
    }

    if (!subscriptionType) {
      return res.status(400).json({
        error: 'Subscription type is required'
      });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', req.user!.id)
      .single();

    if (userError) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get or create Stripe customer
    const customer = await paymentService.getOrCreateCustomer(
      user.id,
      user.email,
      user.name
    );

    // Create subscription
    const subscription = await paymentService.createSubscription({
      customerId: customer.id,
      priceId,
      trialPeriodDays,
      metadata: {
        userId: user.id,
        subscriptionType,
        type: 'subscription',
      },
    });

    res.status(201).json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
      trialEnd: subscription.trial_end,
      clientSecret: ((subscription as any).latest_invoice as Stripe.Invoice)?.payment_intent
        ? ((subscription as any).latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent
        : null,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const updates = req.body;

    // Verify user owns the subscription
    const { data: subscriptionRecord, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (error || subscriptionRecord?.user_id !== req.user!.id) {
      return res.status(404).json({
        error: 'Subscription not found'
      });
    }

    const subscription = await paymentService.updateSubscription(subscriptionId, updates);

    res.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: (subscription as any).current_period_start,
      currentPeriodEnd: (subscription as any).current_period_end,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtPeriodEnd = false } = req.body;

    // Verify user owns the subscription
    const { data: subscriptionRecord, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (error || subscriptionRecord?.user_id !== req.user!.id) {
      return res.status(404).json({
        error: 'Subscription not found'
      });
    }

    const subscription = await paymentService.cancelSubscription(
      subscriptionId,
      cancelAtPeriodEnd
    );

    res.json({
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      message: cancelAtPeriodEnd 
        ? 'Subscription will cancel at period end'
        : 'Subscription canceled immediately'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const requestRefund = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent ID is required'
      });
    }

    // Verify user owns the payment intent
    const { data: paymentRecord, error } = await supabase
      .from('payment_intents')
      .select('user_id')
      .eq('id', paymentIntentId)
      .single();

    if (error || paymentRecord?.user_id !== req.user!.id) {
      return res.status(404).json({
        error: 'Payment intent not found'
      });
    }

    const refund = await paymentService.createRefund(paymentIntentId, amount, reason);

    res.json({
      id: refund.id,
      amount: refund.amount / 100, // Convert from cents
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      error: 'Failed to create refund',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's Stripe customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.user!.id)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return res.json([]);
    }

    const paymentMethods = await paymentService.getPaymentMethods(user.stripe_customer_id);

    res.json(paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : null,
    })));
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      error: 'Failed to fetch payment methods',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, metadata } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Items array is required'
      });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, stripe_customer_id')
      .eq('id', req.user!.id)
      .single();

    if (userError) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    let customerId = user.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await paymentService.getOrCreateCustomer(
        user.id,
        user.email,
        user.name
      );
      customerId = customer.id;
    }

    const invoice = await paymentService.createInvoice(
      customerId,
      items,
      { ...metadata, userId: user.id }
    );

    res.status(201).json({
      id: invoice.id,
      amountDue: invoice.amount_due / 100, // Convert from cents
      amountPaid: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status,
      invoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserSubscriptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch subscriptions',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

export const getUserInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's customer ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.user!.id)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', user.stripe_customer_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch invoices',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};