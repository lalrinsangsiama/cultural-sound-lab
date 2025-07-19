import { Request, Response } from 'express';
import Stripe from 'stripe';
import { validateStripeWebhook } from '@/config/stripe';
import { supabase } from '@/config/supabase';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({
      error: 'Missing Stripe signature'
    });
  }

  let event: Stripe.Event;

  try {
    event = validateStripeWebhook(req.body, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return res.status(400).json({
      error: 'Invalid webhook signature'
    });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleSubscriptionTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice);
        break;

      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook'
    });
  }
};

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  // Update payment intent status in database
  await supabase
    .from('payment_intents')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentIntent.id);

  // If this payment is for a license, activate it
  const metadata = paymentIntent.metadata;
  if (metadata.licenseId) {
    await supabase
      .from('licenses')
      .update({
        payment_status: 'completed',
        payment_intent_id: paymentIntent.id,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.licenseId);

    // Log the license activation
    await supabase
      .from('license_events')
      .insert({
        license_id: metadata.licenseId,
        event_type: 'activated',
        event_data: { payment_intent_id: paymentIntent.id },
        created_at: new Date().toISOString(),
      });
  }

  // Send confirmation email (implement email service)
  // await emailService.sendPaymentConfirmation(metadata.userId, paymentIntent);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  // Update payment intent status in database
  await supabase
    .from('payment_intents')
    .update({
      status: 'failed',
      failure_reason: paymentIntent.last_payment_error?.message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentIntent.id);

  // If this payment is for a license, mark it as failed
  const metadata = paymentIntent.metadata;
  if (metadata.licenseId) {
    await supabase
      .from('licenses')
      .update({
        payment_status: 'failed',
        payment_intent_id: paymentIntent.id,
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.licenseId);

    // Log the license failure
    await supabase
      .from('license_events')
      .insert({
        license_id: metadata.licenseId,
        event_type: 'payment_failed',
        event_data: { 
          payment_intent_id: paymentIntent.id,
          failure_reason: paymentIntent.last_payment_error?.message
        },
        created_at: new Date().toISOString(),
      });
  }

  // Send failure notification email
  // await emailService.sendPaymentFailure(metadata.userId, paymentIntent);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent canceled:', paymentIntent.id);

  // Update payment intent status in database
  await supabase
    .from('payment_intents')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentIntent.id);

  // If this payment is for a license, mark it as canceled
  const metadata = paymentIntent.metadata;
  if (metadata.licenseId) {
    await supabase
      .from('licenses')
      .update({
        payment_status: 'failed',
        payment_intent_id: paymentIntent.id,
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', metadata.licenseId);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  // Update invoice status in database
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid: invoice.amount_paid / 100, // Convert from cents
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  // If this is a subscription invoice, handle subscription activation
  if (invoice.subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.subscription as string);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  // Update invoice status in database
  await supabase
    .from('invoices')
    .update({
      status: 'payment_failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);

  // Handle subscription payment failure
  if (invoice.subscription) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id, status')
      .eq('id', invoice.subscription as string)
      .single();

    if (subscription) {
      // Send payment failure notification
      // await emailService.sendSubscriptionPaymentFailure(subscription.user_id, invoice);
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  // Subscription should already be in database from creation, but update status
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  // Update subscription in database
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  // If subscription was canceled, send notification
  if (subscription.status === 'canceled') {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscription.id)
      .single();

    if (sub) {
      // await emailService.sendSubscriptionCanceled(sub.user_id, subscription);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  // Update subscription status to canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscription.id);

  // Revoke any subscription-based access
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('id', subscription.id)
    .single();

  if (sub) {
    // Revoke premium features
    await supabase
      .from('users')
      .update({
        subscription_status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.user_id);
  }
}

async function handleSubscriptionTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Subscription trial will end:', subscription.id);

  // Get subscription details
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('id', subscription.id)
    .single();

  if (sub) {
    // Send trial ending notification
    // await emailService.sendTrialEndingNotification(sub.user_id, subscription);
  }
}

async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log('Invoice created:', invoice.id);

  // Store invoice if it doesn't exist (for subscription invoices)
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', invoice.id)
    .single();

  if (!existingInvoice && invoice.customer) {
    await supabase
      .from('invoices')
      .insert({
        id: invoice.id,
        customer_id: invoice.customer as string,
        amount_due: invoice.amount_due / 100,
        amount_paid: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status || 'draft',
        subscription_id: invoice.subscription as string || null,
        created_at: new Date(invoice.created * 1000).toISOString(),
      });
  }
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log('Invoice finalized:', invoice.id);

  // Update invoice with finalized details
  await supabase
    .from('invoices')
    .update({
      status: 'open',
      invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Charge dispute created:', dispute.id);

  // Store dispute information
  await supabase
    .from('disputes')
    .insert({
      id: dispute.id,
      charge_id: dispute.charge as string,
      amount: dispute.amount / 100,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000).toISOString() : null,
      created_at: new Date(dispute.created * 1000).toISOString(),
    });

  // Notify admin team about dispute
  // await emailService.sendDisputeNotification(dispute);
}