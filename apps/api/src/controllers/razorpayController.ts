import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { razorpayService } from '@/services/razorpayService';
import { supabase } from '@/config/supabase';
import { validateRazorpayPayment } from '@/config/razorpay';

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      amount,
      currency = 'INR',
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

    // Create Razorpay order
    const order = await razorpayService.createOrder({
      amount,
      currency,
      description: description || 'Cultural Sound Lab License',
      metadata: {
        userId: user.id,
        licenseId,
        generationId,
        type: licenseId ? 'license' : 'generation',
      },
    });

    res.json({
      id: order.id,
      amount: order.amount / 100, // Convert from paise
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
      key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for integration
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        error: 'Order ID, payment ID, and signature are required'
      });
    }

    // Verify payment signature
    const isValidSignature = validateRazorpayPayment(orderId, paymentId, signature);

    if (!isValidSignature) {
      return res.status(400).json({
        error: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpayService.fetchPayment(paymentId);
    const order = await razorpayService.fetchOrder(orderId);

    // Verify user owns the order
    const { data: orderRecord, error } = await supabase
      .from('payment_orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (error || orderRecord?.user_id !== req.user!.id) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    // Update order status in database
    await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Store payment details
    await supabase
      .from('payments')
      .insert({
        id: paymentId,
        order_id: orderId,
        user_id: req.user!.id,
        amount: payment.amount / 100, // Convert from paise
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        fee: payment.fee ? payment.fee / 100 : 0,
        tax: payment.tax ? payment.tax / 100 : 0,
        created_at: new Date(payment.created_at * 1000).toISOString(),
      });

    res.json({
      success: true,
      orderId,
      paymentId,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      planId,
      totalCount,
      quantity = 1,
      subscriptionType,
      startAt,
    } = req.body;

    if (!planId) {
      return res.status(400).json({
        error: 'Plan ID is required'
      });
    }

    if (!totalCount) {
      return res.status(400).json({
        error: 'Total count is required'
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

    // Get or create Razorpay customer
    const customer = await razorpayService.getOrCreateCustomer(
      user.id,
      user.email,
      user.name
    );

    // Create subscription
    const subscription = await razorpayService.createSubscription({
      planId,
      totalCount,
      quantity,
      customerId: customer.id,
      startAt,
      metadata: {
        userId: user.id,
        subscriptionType,
        type: 'subscription',
      },
    });

    res.status(201).json({
      id: subscription.id,
      status: subscription.status,
      planId: subscription.plan_id,
      customerId: subscription.customer_id,
      quantity: subscription.quantity,
      totalCount: subscription.total_count,
      paidCount: subscription.paid_count,
      remainingCount: subscription.remaining_count,
      currentStart: subscription.current_start,
      currentEnd: subscription.current_end,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      error: 'Failed to create subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { cancelAtCycleEnd = false } = req.body;

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

    const subscription = await razorpayService.cancelSubscription(
      subscriptionId,
      cancelAtCycleEnd
    );

    res.json({
      id: subscription.id,
      status: subscription.status,
      endedAt: subscription.ended_at,
      message: cancelAtCycleEnd 
        ? 'Subscription will cancel at cycle end'
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
    const { paymentId, amount, notes } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Payment ID is required'
      });
    }

    // Verify user owns the payment
    const { data: paymentRecord, error } = await supabase
      .from('payments')
      .select('user_id')
      .eq('id', paymentId)
      .single();

    if (error || paymentRecord?.user_id !== req.user!.id) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    const refund = await razorpayService.refundPayment(paymentId, amount, notes);

    res.json({
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100, // Convert from paise
      currency: refund.currency,
      status: refund.status,
      notes: refund.notes,
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({
      error: 'Failed to create refund',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch orders',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      error: 'Internal server error'
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

export const getUserPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch payments',
        details: error.message
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};