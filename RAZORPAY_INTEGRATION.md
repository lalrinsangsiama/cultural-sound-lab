# Razorpay Integration for Cultural Sound Lab

This document outlines the complete Razorpay integration setup for the Cultural Sound Lab platform, replacing the previous Stripe implementation.

## Summary of Changes

### 🔧 Backend Changes (API)

1. **Installed Razorpay SDK**
   - Added `razorpay` package to `apps/api/package.json`

2. **Created Razorpay Configuration**
   - `apps/api/src/config/razorpay.ts` - Razorpay client setup with validation and webhook verification

3. **Implemented Razorpay Services**
   - `apps/api/src/services/razorpayService.ts` - Complete service layer for orders, payments, subscriptions, refunds

4. **Added Controllers**
   - `apps/api/src/controllers/razorpayController.ts` - API endpoints for payment operations
   - `apps/api/src/controllers/razorpayWebhook.ts` - Webhook handler for Razorpay events

5. **Created Routes**
   - `apps/api/src/routes/razorpay.ts` - Payment endpoints under `/api/razorpay`
   - `apps/api/src/routes/razorpayWebhook.ts` - Webhook endpoints under `/api/webhooks/razorpay`

6. **Updated Environment Configuration**
   - Added Razorpay environment variables to `env-validation.ts`
   - Updated `.env` and `.env.example` files

7. **Database Schema Updates**
   - Created migration `002_razorpay_tables.sql` with new tables:
     - `payment_orders` - Razorpay orders
     - `payments` - Payment records
     - Updated `subscriptions`, `refunds`, `invoices` tables
     - `user_licenses` - License grants tracking
     - `subscription_plans` - Razorpay plans

### 🎨 Frontend Changes (Web)

1. **Created Razorpay Hook**
   - `apps/web/hooks/useRazorpayProcessing.ts` - React hook for payment processing

2. **Built Payment Components**
   - `apps/web/components/payment/RazorpayPaymentHandler.tsx` - Complete payment UI

3. **Updated Environment Configuration**
   - Added `NEXT_PUBLIC_RAZORPAY_KEY_ID` to web environment variables
   - Updated environment validation in `lib/env-validation.ts`

## Environment Variables Required

### Backend (.env)
```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Frontend (.env)
```bash
# Payment Configuration
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

## API Endpoints Created

### Payment Operations
- `POST /api/razorpay/orders` - Create payment order
- `POST /api/razorpay/verify-payment` - Verify payment signature
- `GET /api/razorpay/orders` - Get user orders
- `GET /api/razorpay/payments` - Get user payments

### Subscriptions
- `POST /api/razorpay/subscriptions` - Create subscription
- `PUT /api/razorpay/subscriptions/:id/cancel` - Cancel subscription
- `GET /api/razorpay/subscriptions` - Get user subscriptions

### Refunds
- `POST /api/razorpay/refunds` - Request refund

### Webhooks
- `POST /api/webhooks/razorpay` - Handle Razorpay webhooks

## Usage Example

### Frontend Integration
```tsx
import { RazorpayPaymentHandler } from '@/components/payment/RazorpayPaymentHandler';

function PaymentPage() {
  const handleSuccess = (response) => {
    console.log('Payment successful:', response);
  };

  const handleError = (error) => {
    console.error('Payment failed:', error);
  };

  return (
    <RazorpayPaymentHandler
      amount={5000} // Amount in paise (₹50.00)
      currency="INR"
      userDetails={{
        name: "John Doe",
        email: "john@example.com",
        contact: "+919999999999"
      }}
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### Backend API Usage
```typescript
// Create order
const order = await razorpayService.createOrder({
  amount: 50, // Amount in rupees
  currency: 'INR',
  metadata: {
    userId: 'user-id',
    type: 'license'
  }
});

// Verify payment
const isValid = validateRazorpayPayment(
  orderId,
  paymentId,
  signature
);
```

## Database Migration

Run the database migration to create required tables:

```bash
# Apply migration (adjust command based on your migration system)
psql $DATABASE_URL -f apps/api/src/migrations/002_razorpay_tables.sql
```

## Webhook Configuration

1. **Set up webhook endpoint in Razorpay Dashboard:**
   - URL: `https://your-domain.com/api/webhooks/razorpay`
   - Events: Select all payment and subscription events

2. **Configure webhook secret:**
   - Copy webhook secret from Razorpay dashboard
   - Add to `RAZORPAY_WEBHOOK_SECRET` environment variable

## Testing

### Test Mode Setup
1. Use test API keys from Razorpay dashboard
2. Test with Razorpay test card numbers:
   - **Success**: 4111 1111 1111 1111
   - **Failure**: 4000 0000 0000 0002

### Integration Testing
```bash
# Test API endpoints
curl -X POST http://localhost:3001/api/razorpay/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 100, "currency": "INR"}'
```

## Key Features Implemented

### ✅ Payment Processing
- Order creation and management
- Payment verification with signature validation
- Multiple payment methods (Cards, UPI, NetBanking, Wallets)
- Automatic payment status updates

### ✅ Subscription Management
- Plan-based subscriptions
- Automatic billing cycles
- Subscription lifecycle management
- Prorated billing support

### ✅ Refund Processing
- Full and partial refunds
- Automatic refund status tracking
- Refund webhook handling

### ✅ Security
- Webhook signature verification
- Payment signature validation
- Secure API key management
- CSRF protection

### ✅ Error Handling
- Comprehensive error codes
- Retry mechanisms
- Fallback scenarios
- User-friendly error messages

## Currency Support

The integration is configured for **Indian Rupees (INR)** by default, as required by Razorpay. All amounts are handled in paise (smallest currency unit).

**Conversion:**
- ₹1.00 = 100 paise
- Frontend displays: ₹50.00
- API processes: 5000 paise

## Production Deployment

### Required Steps:
1. **Replace test keys with live keys**
2. **Configure production webhook URLs**
3. **Set up proper SSL certificates**
4. **Enable audit logging**
5. **Configure monitoring alerts**

### Environment Variables for Production:
```bash
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_live_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
```

## Migration from Stripe

The implementation maintains API compatibility where possible. Key differences:

1. **Payment Flow**: Orders → Payments (vs PaymentIntents)
2. **Currency**: INR focus (vs multi-currency)
3. **Webhooks**: Different event structure
4. **UI**: Indian payment methods included

## Support & Documentation

- **Razorpay Docs**: https://razorpay.com/docs/
- **API Reference**: https://razorpay.com/docs/api/
- **Webhook Guide**: https://razorpay.com/docs/webhooks/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/

## Troubleshooting

### Common Issues:

1. **"Razorpay SDK not loaded"**
   - Ensure internet connection for CDN script
   - Check browser console for script loading errors

2. **"Invalid signature" errors**
   - Verify webhook secret configuration
   - Check server time synchronization

3. **Payment failures**
   - Verify API key configuration
   - Check Razorpay dashboard for error details

4. **Database errors**
   - Ensure migration is applied
   - Check table permissions and constraints

For additional support, refer to the Razorpay documentation or contact their support team.