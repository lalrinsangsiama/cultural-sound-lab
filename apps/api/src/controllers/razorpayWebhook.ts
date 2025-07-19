import { Request, Response } from 'express';
import { validateRazorpayWebhook } from '@/config/razorpay';
import { supabase } from '@/config/supabase';

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const payload = JSON.stringify(req.body);

    if (!signature) {
      return res.status(400).json({
        error: 'Missing webhook signature'
      });
    }

    // Validate webhook signature
    const isValid = validateRazorpayWebhook(payload, signature);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        error: 'Invalid webhook signature'
      });
    }

    const event = req.body;
    const eventType = event.event;

    console.log(`Processing Razorpay webhook: ${eventType}`);

    switch (eventType) {
      case 'payment.authorized':
        await handlePaymentAuthorized(event);
        break;
      
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event);
        break;
      
      case 'subscription.activated':
        await handleSubscriptionActivated(event);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event);
        break;
      
      case 'subscription.completed':
        await handleSubscriptionCompleted(event);
        break;
      
      case 'refund.created':
        await handleRefundCreated(event);
        break;
      
      case 'refund.processed':
        await handleRefundProcessed(event);
        break;
      
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const handlePaymentAuthorized = async (event: any) => {
  const payment = event.payload.payment.entity;
  
  // Update payment status in database
  await supabase
    .from('payments')
    .upsert({
      id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      fee: payment.fee ? payment.fee / 100 : 0,
      tax: payment.tax ? payment.tax / 100 : 0,
      created_at: new Date(payment.created_at * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    });

  console.log(`Payment authorized: ${payment.id}`);
};

const handlePaymentCaptured = async (event: any) => {
  const payment = event.payload.payment.entity;
  
  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: payment.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  // Update associated order
  if (payment.order_id) {
    await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id);
  }

  // Process fulfillment logic here (e.g., grant license access)
  await processOrderFulfillment(payment.order_id, payment.id);

  console.log(`Payment captured: ${payment.id}`);
};

const handlePaymentFailed = async (event: any) => {
  const payment = event.payload.payment.entity;
  
  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: payment.status,
      error_code: payment.error_code,
      error_description: payment.error_description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  // Update associated order
  if (payment.order_id) {
    await supabase
      .from('payment_orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.order_id);
  }

  console.log(`Payment failed: ${payment.id}, Error: ${payment.error_description}`);
};

const handleOrderPaid = async (event: any) => {
  const order = event.payload.order.entity;
  
  // Update order status
  await supabase
    .from('payment_orders')
    .update({
      status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  console.log(`Order paid: ${order.id}`);
};

const handleSubscriptionActivated = async (event: any) => {
  const subscription = event.payload.subscription.entity;
  
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
      current_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  console.log(`Subscription activated: ${subscription.id}`);
};

const handleSubscriptionCharged = async (event: any) => {
  const subscription = event.payload.subscription.entity;
  const payment = event.payload.payment?.entity;
  
  // Update subscription
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      paid_count: subscription.paid_count,
      remaining_count: subscription.remaining_count,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  // Record payment if present
  if (payment) {
    await supabase
      .from('payments')
      .upsert({
        id: payment.id,
        subscription_id: subscription.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        created_at: new Date(payment.created_at * 1000).toISOString(),
      });
  }

  console.log(`Subscription charged: ${subscription.id}`);
};

const handleSubscriptionCancelled = async (event: any) => {
  const subscription = event.payload.subscription.entity;
  
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  console.log(`Subscription cancelled: ${subscription.id}`);
};

const handleSubscriptionCompleted = async (event: any) => {
  const subscription = event.payload.subscription.entity;
  
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  console.log(`Subscription completed: ${subscription.id}`);
};

const handleRefundCreated = async (event: any) => {
  const refund = event.payload.refund.entity;
  
  // Update refund in database
  await supabase
    .from('refunds')
    .upsert({
      id: refund.id,
      payment_id: refund.payment_id,
      amount: refund.amount / 100,
      currency: refund.currency,
      status: refund.status,
      notes: refund.notes || {},
      created_at: new Date(refund.created_at * 1000).toISOString(),
    });

  console.log(`Refund created: ${refund.id}`);
};

const handleRefundProcessed = async (event: any) => {
  const refund = event.payload.refund.entity;
  
  // Update refund status
  await supabase
    .from('refunds')
    .update({
      status: refund.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refund.id);

  console.log(`Refund processed: ${refund.id}`);
};

const processOrderFulfillment = async (orderId: string, paymentId: string) => {
  try {
    // Get order details
    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('metadata, user_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Order not found for fulfillment:', orderId);
      return;
    }

    const metadata = order.metadata as any;

    // Process based on order type
    if (metadata?.type === 'license' && metadata?.licenseId) {
      // Grant license access
      await supabase
        .from('user_licenses')
        .insert({
          user_id: order.user_id,
          license_id: metadata.licenseId,
          status: 'active',
          payment_id: paymentId,
          granted_at: new Date().toISOString(),
        });

      console.log(`License granted: ${metadata.licenseId} to user ${order.user_id}`);
    } else if (metadata?.type === 'generation' && metadata?.generationId) {
      // Update generation access
      await supabase
        .from('generations')
        .update({
          payment_status: 'paid',
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', metadata.generationId);

      console.log(`Generation access granted: ${metadata.generationId}`);
    }
  } catch (error) {
    console.error('Error processing order fulfillment:', error);
  }
};