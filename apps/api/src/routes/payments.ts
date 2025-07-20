import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

// Razorpay webhook event schema
const razorpayWebhookSchema = z.object({
  event: z.string(),
  entity: z.string(),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string().optional(),
        method: z.string(),
        captured: z.boolean(),
        description: z.string().optional(),
        notes: z.record(z.string()).optional(),
        created_at: z.number(),
      }),
    }),
  }),
  created_at: z.number(),
});

// Create payment order
router.post('/create-order', authenticateToken, async (req, res, next) => {
  try {
    const { amount, currency = 'INR', notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // For MVP, we'll create a mock order
    // In production, integrate with Razorpay SDK
    const order = {
      id: `order_${Date.now()}`,
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        user_id: userId,
        ...notes,
      },
    };

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// Razorpay webhook endpoint
router.post('/webhook', async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.error('Razorpay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (!signature) {
      logger.warn('No signature provided in webhook request');
      return res.status(400).json({ error: 'No signature provided' });
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Verify signature
    if (signature !== expectedSignature) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse and validate webhook data
    const webhookData = razorpayWebhookSchema.parse(req.body);
    
    logger.info('Razorpay webhook received', {
      event: webhookData.event,
      paymentId: webhookData.payload.payment.entity.id,
    });

    // Handle different webhook events
    switch (webhookData.event) {
      case 'payment.captured':
        await handlePaymentCaptured(webhookData.payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData.payload.payment.entity);
        break;
      
      default:
        logger.info(`Unhandled webhook event: ${webhookData.event}`);
    }

    // Acknowledge webhook
    res.json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook processing error', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid webhook data', 
        details: error.errors 
      });
    }
    
    next(error);
  }
});

// Handle successful payment
async function handlePaymentCaptured(payment: any) {
  try {
    const { id, amount, notes, order_id } = payment;
    const userId = notes?.user_id;
    
    if (!userId) {
      logger.error('No user ID in payment notes', { paymentId: id });
      return;
    }

    // Update license or generation status
    if (notes?.license_id) {
      const { error } = await supabase
        .from('licenses')
        .update({
          payment_status: 'completed',
          payment_id: id,
          price_paid: amount / 100, // Convert from paise
          updated_at: new Date().toISOString(),
        })
        .eq('id', notes.license_id);

      if (error) {
        logger.error('Failed to update license', { error, licenseId: notes.license_id });
      } else {
        logger.info('License payment completed', { licenseId: notes.license_id });
      }
    }

    // Record transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        payment_id: id,
        order_id,
        amount: amount / 100,
        currency: 'INR',
        status: 'completed',
        metadata: notes,
        created_at: new Date().toISOString(),
      });

    if (txError) {
      logger.error('Failed to record transaction', { error: txError });
    }
  } catch (error) {
    logger.error('Error handling payment captured', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(payment: any) {
  try {
    const { id, notes } = payment;
    const userId = notes?.user_id;
    
    if (!userId) {
      logger.error('No user ID in payment notes', { paymentId: id });
      return;
    }

    // Update license status if applicable
    if (notes?.license_id) {
      const { error } = await supabase
        .from('licenses')
        .update({
          payment_status: 'failed',
          payment_id: id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notes.license_id);

      if (error) {
        logger.error('Failed to update license', { error, licenseId: notes.license_id });
      }
    }

    logger.info('Payment failed', { paymentId: id, userId });
  } catch (error) {
    logger.error('Error handling payment failed', error);
  }
}

// Get payment status
router.get('/status/:paymentId', authenticateToken, async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check transaction status
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new AppError('Payment not found', 404);
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export { router as paymentsRouter };