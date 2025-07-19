import { Router } from 'express';
import { handleRazorpayWebhook } from '@/controllers/razorpayWebhook';

const router = Router();

// Razorpay webhook endpoint - no authentication needed
router.post('/razorpay', handleRazorpayWebhook);

export default router;