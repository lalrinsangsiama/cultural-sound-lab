import { Router } from 'express';
import { authenticateUser } from '@/middleware/auth';
import {
  createOrder,
  verifyPayment,
  createSubscription,
  cancelSubscription,
  requestRefund,
  getUserOrders,
  getUserSubscriptions,
  getUserPayments,
} from '@/controllers/razorpayController';

const router = Router();

// Order management
router.post('/orders', authenticateUser, createOrder);
router.post('/verify-payment', authenticateUser, verifyPayment);
router.get('/orders', authenticateUser, getUserOrders);

// Subscription management
router.post('/subscriptions', authenticateUser, createSubscription);
router.put('/subscriptions/:subscriptionId/cancel', authenticateUser, cancelSubscription);
router.get('/subscriptions', authenticateUser, getUserSubscriptions);

// Payment management
router.get('/payments', authenticateUser, getUserPayments);
router.post('/refunds', authenticateUser, requestRefund);

export default router;