import { Router } from 'express';
import { requireAuth } from '@/middleware/auth';
import {
  createPaymentIntent,
  confirmPayment,
  cancelPayment,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  requestRefund,
  getPaymentMethods,
  createInvoice,
  getUserSubscriptions,
  getUserInvoices,
} from '@/controllers/payment';

const router = Router();

// Payment Intent routes
router.post('/create-intent', requireAuth, createPaymentIntent);
router.post('/confirm', requireAuth, confirmPayment);
router.post('/:paymentIntentId/cancel', requireAuth, cancelPayment);
router.post('/refund', requireAuth, requestRefund);

// Payment Methods
router.get('/methods', requireAuth, getPaymentMethods);

// Subscription routes
router.post('/subscriptions', requireAuth, createSubscription);
router.get('/subscriptions', requireAuth, getUserSubscriptions);
router.put('/subscriptions/:subscriptionId', requireAuth, updateSubscription);
router.post('/subscriptions/:subscriptionId/cancel', requireAuth, cancelSubscription);

// Invoice routes
router.post('/invoices', requireAuth, createInvoice);
router.get('/invoices', requireAuth, getUserInvoices);

export default router;