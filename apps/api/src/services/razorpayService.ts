import { razorpay } from '@/config/razorpay';
import { supabase } from '@/config/supabase';

export interface PaymentMetadata {
  userId: string;
  licenseId?: string;
  generationId?: string;
  subscriptionType?: string;
  type: 'license' | 'subscription' | 'generation';
}

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  metadata: PaymentMetadata;
  description?: string;
}

export interface CreateSubscriptionParams {
  planId: string;
  totalCount: number;
  quantity?: number;
  customerId?: string;
  metadata: PaymentMetadata;
  startAt?: number;
}

export class RazorpayService {
  async createCustomer(
    name: string,
    email: string,
    contact?: string,
    userId?: string
  ): Promise<any> {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact: contact || '',
      notes: {
        userId: userId || '',
      },
    });

    // Store customer ID in database
    if (userId) {
      await supabase
        .from('users')
        .update({ razorpay_customer_id: customer.id })
        .eq('id', userId);
    }

    return customer;
  }

  async getOrCreateCustomer(
    userId: string,
    email: string,
    name?: string,
    contact?: string
  ): Promise<any> {
    // Check if customer already exists in database
    const { data: user } = await supabase
      .from('users')
      .select('razorpay_customer_id')
      .eq('id', userId)
      .single();

    if (user?.razorpay_customer_id) {
      try {
        const customer = await razorpay.customers.fetch(user.razorpay_customer_id);
        return customer;
      } catch (error) {
        console.warn('Failed to retrieve existing customer:', error);
      }
    }

    // Create new customer
    return this.createCustomer(name || email, email, contact, userId);
  }

  async createOrder(params: CreateOrderParams): Promise<any> {
    const {
      amount,
      currency = 'INR',
      metadata,
      description,
    } = params;

    const orderParams = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        ...metadata,
        userId: metadata.userId,
        description: description || 'Cultural Sound Lab License',
      },
    };

    const order = await razorpay.orders.create(orderParams);

    // Store order in database
    await supabase
      .from('payment_orders')
      .insert({
        id: order.id,
        user_id: metadata.userId,
        amount: amount,
        currency,
        status: order.status,
        metadata: metadata,
        receipt: order.receipt,
        created_at: new Date(order.created_at * 1000).toISOString(),
      });

    return order;
  }

  async fetchOrder(orderId: string): Promise<any> {
    return razorpay.orders.fetch(orderId);
  }

  async fetchPayment(paymentId: string): Promise<any> {
    return razorpay.payments.fetch(paymentId);
  }

  async capturePayment(
    paymentId: string,
    amount: number,
    currency: string = 'INR'
  ): Promise<any> {
    return razorpay.payments.capture(paymentId, Math.round(amount * 100), currency);
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    notes?: Record<string, string>
  ): Promise<any> {
    const refundParams: any = {
      payment_id: paymentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to paise
    }

    if (notes) {
      refundParams.notes = notes;
    }

    const refund = await razorpay.payments.refund(paymentId, refundParams);

    // Store refund in database
    await supabase
      .from('refunds')
      .insert({
        id: refund.id,
        payment_id: paymentId,
        amount: (refund.amount || 0) / 100, // Convert back from paise
        currency: refund.currency,
        status: refund.status,
        notes: refund.notes || {},
        created_at: new Date(refund.created_at * 1000).toISOString(),
      });

    return refund;
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<any> {
    const {
      planId,
      totalCount,
      quantity = 1,
      customerId,
      metadata,
      startAt,
    } = params;

    const subscriptionParams: any = {
      plan_id: planId,
      total_count: totalCount,
      quantity,
      notes: {
        ...metadata,
        userId: metadata.userId,
      },
    };

    if (customerId) {
      subscriptionParams.customer_id = customerId;
    }

    if (startAt) {
      subscriptionParams.start_at = startAt;
    }

    const subscription = await razorpay.subscriptions.create(subscriptionParams);

    // Store subscription in database
    await supabase
      .from('subscriptions')
      .insert({
        id: subscription.id,
        user_id: metadata.userId,
        customer_id: customerId || null,
        plan_id: planId,
        status: subscription.status,
        current_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
        current_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        quantity,
        notes: subscription.notes || {},
        created_at: new Date(subscription.created_at * 1000).toISOString(),
      });

    return subscription;
  }

  async fetchSubscription(subscriptionId: string): Promise<any> {
    return razorpay.subscriptions.fetch(subscriptionId);
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = false
  ): Promise<any> {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({
        status: (subscription as any).status,
        ended_at: (subscription as any).ended_at ? new Date((subscription as any).ended_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    return subscription;
  }

  async createPlan(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    interval: number,
    amount: number,
    currency: string = 'INR',
    description?: string
  ): Promise<any> {
    return razorpay.plans.create({
      period,
      interval,
      item: {
        name: description || 'Cultural Sound Lab Subscription',
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        description: description || 'Subscription plan for Cultural Sound Lab',
      },
    });
  }

  async fetchPlan(planId: string): Promise<any> {
    return razorpay.plans.fetch(planId);
  }

  async createInvoice(
    customerId: string,
    amount: number,
    currency: string = 'INR',
    description?: string,
    dueBy?: number
  ): Promise<any> {
    const invoiceParams: any = {
      customer_id: customerId,
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      description: description || 'Cultural Sound Lab Invoice',
    };

    if (dueBy) {
      invoiceParams.due_by = dueBy;
    }

    const invoice = await razorpay.invoices.create(invoiceParams);

    // Store invoice in database
    await supabase
      .from('invoices')
      .insert({
        id: invoice.id,
        customer_id: customerId,
        amount: amount,
        currency,
        status: invoice.status,
        description: invoice.description,
        invoice_number: invoice.invoice_number,
        due_by: dueBy ? new Date(dueBy * 1000).toISOString() : null,
        created_at: new Date(invoice.created_at * 1000).toISOString(),
      });

    return invoice;
  }

  async fetchInvoice(invoiceId: string): Promise<any> {
    return razorpay.invoices.fetch(invoiceId);
  }

  async getPaymentsByOrder(orderId: string): Promise<any[]> {
    const payments = await razorpay.orders.fetchPayments(orderId);
    return payments.items || [];
  }
}

export const razorpayService = new RazorpayService();