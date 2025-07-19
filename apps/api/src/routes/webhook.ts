import { Router } from 'express';
import { handleStripeWebhook } from '@/controllers/webhook';

const router = Router();

// Stripe webhook endpoint
// Note: This should be mounted before any body parsing middleware
// for raw buffer access
router.post('/stripe', handleStripeWebhook);

export default router;