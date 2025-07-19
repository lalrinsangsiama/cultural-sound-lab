import Stripe from 'stripe';
import { stripe } from '@/config/stripe';
import { supabase } from '@/config/supabase';

export interface PaymentMetadata {
  userId: string;
  licenseId?: string;
  generationId?: string;
  subscriptionType?: string;
  type: 'license' | 'subscription' | 'generation';
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  metadata: PaymentMetadata;
  customerId?: string;
  description?: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  metadata: PaymentMetadata;
  trialPeriodDays?: number;
}

export class PaymentService {
  async createCustomer(email: string, name?: string, userId?: string): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId || '',
      },
    });

    // Store customer ID in database
    if (userId) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);
    }

    return customer;
  }

  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    // Check if customer already exists in database
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (user?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(user.stripe_customer_id) as Stripe.Customer;
        if (!customer.deleted) {
          return customer;
        }
      } catch (error) {
        console.warn('Failed to retrieve existing customer:', error);
      }
    }

    // Create new customer
    return this.createCustomer(email, name, userId);
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    const {
      amount,
      currency = 'usd',
      metadata,
      customerId,
      description,
    } = params;

    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        ...metadata,
        userId: metadata.userId,
      },
      description,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    if (customerId) {
      paymentIntentParams.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Store payment intent in database
    await supabase
      .from('payment_intents')
      .insert({
        id: paymentIntent.id,
        user_id: metadata.userId,
        amount: amount,
        currency,
        status: paymentIntent.status,
        metadata: metadata,
        created_at: new Date(paymentIntent.created * 1000).toISOString(),
      });

    return paymentIntent;
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    const params: Stripe.PaymentIntentConfirmParams = {};

    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, params);

    // Update payment intent status in database
    await supabase
      .from('payment_intents')
      .update({
        status: paymentIntent.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntentId);

    return paymentIntent;
  }

  async cancelPaymentIntent(paymentIntentId: string, reason?: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: 'requested_by_customer',
    });

    // Update payment intent status in database
    await supabase
      .from('payment_intents')
      .update({
        status: paymentIntent.status,
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntentId);

    return paymentIntent;
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    const {
      customerId,
      priceId,
      metadata,
      trialPeriodDays,
    } = params;

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        ...metadata,
        userId: metadata.userId,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    };

    if (trialPeriodDays) {
      subscriptionParams.trial_period_days = trialPeriodDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Store subscription in database
    await supabase
      .from('subscriptions')
      .insert({
        id: subscription.id,
        user_id: metadata.userId,
        customer_id: customerId,
        price_id: priceId,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        metadata: metadata,
        created_at: new Date(subscription.created * 1000).toISOString(),
      });

    return subscription;
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Stripe.SubscriptionUpdateParams>
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.update(subscriptionId, updates);

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    return subscription;
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = false
  ): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    if (!cancelAtPeriodEnd) {
      const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      await supabase
        .from('subscriptions')
        .update({
          status: canceledSubscription.status,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      return canceledSubscription;
    }

    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    return subscription;
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    if (reason) {
      refundParams.reason = reason;
    }

    const refund = await stripe.refunds.create(refundParams);

    // Store refund in database
    await supabase
      .from('refunds')
      .insert({
        id: refund.id,
        payment_intent_id: paymentIntentId,
        amount: refund.amount / 100, // Convert back from cents
        currency: refund.currency,
        reason: refund.reason,
        status: refund.status,
        created_at: new Date(refund.created * 1000).toISOString(),
      });

    return refund;
  }

  async createInvoice(
    customerId: string,
    items: Array<{
      description: string;
      amount: number;
      quantity?: number;
    }>,
    metadata?: Record<string, string>
  ): Promise<Stripe.Invoice> {
    // Create invoice items
    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(item.amount * 100), // Convert to cents
        currency: 'usd',
        description: item.description,
        quantity: item.quantity || 1,
      });
    }

    // Create and finalize invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      metadata: metadata || {},
    });

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id!);

    // Store invoice in database
    await supabase
      .from('invoices')
      .insert({
        id: finalizedInvoice.id,
        customer_id: customerId,
        amount_due: finalizedInvoice.amount_due / 100, // Convert from cents
        amount_paid: finalizedInvoice.amount_paid / 100,
        currency: finalizedInvoice.currency,
        status: finalizedInvoice.status,
        invoice_url: finalizedInvoice.hosted_invoice_url,
        invoice_pdf: finalizedInvoice.invoice_pdf,
        metadata: metadata || {},
        created_at: new Date(finalizedInvoice.created * 1000).toISOString(),
      });

    return finalizedInvoice;
  }

  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  }

  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.detach(paymentMethodId);
  }
}

export const paymentService = new PaymentService();