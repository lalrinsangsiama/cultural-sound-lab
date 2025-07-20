# Razorpay Webhook Configuration Guide

## Overview

The Cultural Sound Lab platform has a complete Razorpay webhook integration that handles:
- Payment captures
- Order fulfillment
- Subscription management
- Refund processing

## Webhook Endpoint

**Production URL**: `https://api.culturalsoundlab.com/api/webhooks/razorpay`

## Configuration Steps

### 1. Set Environment Variables

Add these to your Vercel environment variables:

```env
RAZORPAY_KEY_ID=rzp_live_IkKLQEcs0DcLzW
RAZORPAY_KEY_SECRET=<your-key-secret>
RAZORPAY_WEBHOOK_SECRET=<your-webhook-secret>
```

### 2. Configure Webhook in Razorpay Dashboard

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **Webhooks**
3. Click **Add New Webhook**
4. Configure as follows:

   - **Webhook URL**: `https://api.culturalsoundlab.com/api/webhooks/razorpay`
   - **Secret**: Generate a strong secret (this becomes your `RAZORPAY_WEBHOOK_SECRET`)
   - **Alert Email**: Your admin email for webhook failures
   
5. **Select Events** (check all of these):
   
   **Payment Events**:
   - ✅ payment.authorized
   - ✅ payment.captured
   - ✅ payment.failed
   
   **Order Events**:
   - ✅ order.paid
   
   **Subscription Events**:
   - ✅ subscription.activated
   - ✅ subscription.charged
   - ✅ subscription.cancelled
   - ✅ subscription.completed
   - ✅ subscription.updated
   - ✅ subscription.pending
   - ✅ subscription.halted
   
   **Refund Events**:
   - ✅ refund.created
   - ✅ refund.processed
   - ✅ refund.failed

6. Click **Create Webhook**

### 3. Test Webhook Integration

#### Local Testing with ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start your API server: `npm run dev:api`
3. Expose local server: `ngrok http 3001`
4. Use the ngrok URL for webhook testing

#### Using the Test Script

```bash
cd apps/api
npx ts-node scripts/test-razorpay-webhook.ts
```

This will send sample webhook payloads to test:
- Payment capture
- Order fulfillment
- Subscription activation

### 4. Verify Webhook Security

The webhook implementation includes:
- ✅ Signature verification using HMAC-SHA256
- ✅ Raw body parsing for signature validation
- ✅ Event ID tracking to prevent duplicates
- ✅ Comprehensive error handling
- ✅ Transaction support for database operations

## Webhook Event Handlers

### Payment Events

**payment.captured**
- Updates payment status in database
- Triggers license creation for one-time purchases
- Sends confirmation email to user

**payment.failed**
- Updates payment status to failed
- Notifies user of payment failure
- Logs failure reason for debugging

### Order Events

**order.paid**
- Marks order as fulfilled
- Creates license based on order metadata
- Triggers generation process if applicable
- Sends order confirmation email

### Subscription Events

**subscription.activated**
- Creates user subscription record
- Grants access to subscription features
- Sends welcome email

**subscription.charged**
- Records successful subscription payment
- Updates subscription period
- Sends payment receipt

**subscription.cancelled**
- Revokes subscription access
- Sends cancellation confirmation
- Schedules data retention as per policy

### Refund Events

**refund.processed**
- Updates payment and order status
- Revokes associated licenses
- Sends refund confirmation email

## Testing Checklist

- [ ] Webhook URL is accessible from internet
- [ ] Environment variables are set correctly
- [ ] Signature verification passes
- [ ] Database operations complete successfully
- [ ] Email notifications are sent
- [ ] Error responses are properly formatted
- [ ] Duplicate events are handled correctly

## Monitoring

### Health Check
Monitor webhook health at: `https://api.culturalsoundlab.com/health`

### Webhook Failures
Razorpay will retry failed webhooks with exponential backoff:
- 1st retry: After 1 minute
- 2nd retry: After 5 minutes
- 3rd retry: After 10 minutes
- 4th retry: After 30 minutes
- 5th retry: After 1 hour
- 6th retry: After 3 hours
- 7th retry: After 6 hours

### Debugging

Check webhook logs:
```bash
# View recent webhook events
npm run logs:webhook --workspace=@cultural-sound-lab/api

# Check for signature verification failures
grep "Webhook signature verification failed" logs/api.log
```

## Security Best Practices

1. **Never expose webhook secret**: Keep `RAZORPAY_WEBHOOK_SECRET` secure
2. **Validate all data**: Don't trust webhook payload without validation
3. **Use HTTPS only**: Webhook endpoint must use SSL/TLS
4. **Implement idempotency**: Handle duplicate webhook deliveries
5. **Log all events**: Maintain audit trail for compliance
6. **Monitor failures**: Set up alerts for webhook failures

## Troubleshooting

### Common Issues

**Signature Verification Failed**
- Check if webhook secret matches in Razorpay dashboard and environment
- Ensure raw body is used for signature calculation
- Verify Content-Type header is `application/json`

**404 Not Found**
- Verify webhook URL is correct
- Check if API server is running
- Ensure route is properly registered

**Database Errors**
- Check database connection
- Verify migrations are up to date
- Check for transaction deadlocks

**Network Timeouts**
- Webhook handler must respond within 10 seconds
- Move heavy processing to background jobs
- Return 200 OK immediately after validation

## Production Readiness

✅ **Implemented**:
- Signature verification
- Event handling for all payment flows
- Database transaction support
- Error handling and logging
- Idempotency for critical operations

⚠️ **Recommended Additions**:
- Event deduplication table
- Webhook event audit log
- Monitoring dashboard
- Alert system for failures
- Rate limiting for webhook endpoint

## Contact Support

For Razorpay webhook issues:
- Technical documentation: https://razorpay.com/docs/webhooks/
- Support: https://dashboard.razorpay.com/support