#!/usr/bin/env ts-node

import crypto from 'crypto';
import axios from 'axios';

// Test script for Razorpay webhook integration
// Usage: npx ts-node scripts/test-razorpay-webhook.ts

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/api/webhooks/razorpay';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'BuildCSL4ppl';

// Sample webhook payloads
const samplePayloads = {
  paymentCaptured: {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000, // Amount in paise (500 INR)
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          invoice_id: null,
          international: false,
          method: 'card',
          amount_refunded: 0,
          refund_status: null,
          captured: true,
          description: 'Test payment for webhook',
          card_id: 'card_test123',
          card: {
            id: 'card_test123',
            entity: 'card',
            name: 'Test User',
            last4: '1234',
            network: 'Visa',
            type: 'credit',
            issuer: null,
            international: false,
            emi: false,
            sub_type: 'consumer'
          },
          bank: null,
          wallet: null,
          vpa: null,
          email: 'test@example.com',
          contact: '+919876543210',
          notes: {
            license_type: 'commercial',
            generation_id: 'gen_test123'
          },
          fee: 1180,
          tax: 180,
          error_code: null,
          error_description: null,
          error_source: null,
          error_step: null,
          error_reason: null,
          acquirer_data: {
            auth_code: '123456'
          },
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  },
  
  orderPaid: {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'order.paid',
    contains: ['order', 'payment'],
    payload: {
      order: {
        entity: {
          id: 'order_test123',
          entity: 'order',
          amount: 50000,
          amount_paid: 50000,
          amount_due: 0,
          currency: 'INR',
          receipt: 'receipt_test123',
          offer_id: null,
          status: 'paid',
          attempts: 1,
          notes: {
            user_id: 'user_test123',
            license_type: 'commercial',
            generation_id: 'gen_test123'
          },
          created_at: Math.floor(Date.now() / 1000)
        }
      },
      payment: {
        entity: {
          id: 'pay_test123',
          entity: 'payment',
          amount: 50000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          method: 'card',
          captured: true,
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  },
  
  subscriptionActivated: {
    entity: 'event',
    account_id: 'acc_test123',
    event: 'subscription.activated',
    contains: ['subscription'],
    payload: {
      subscription: {
        entity: {
          id: 'sub_test123',
          entity: 'subscription',
          plan_id: 'plan_monthly_pro',
          customer_id: 'cust_test123',
          status: 'active',
          current_start: Math.floor(Date.now() / 1000),
          current_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
          ended_at: null,
          quantity: 1,
          notes: {
            user_id: 'user_test123'
          },
          charge_at: Math.floor(Date.now() / 1000) + 2592000,
          start_at: Math.floor(Date.now() / 1000),
          end_at: Math.floor(Date.now() / 1000) + 31536000, // 1 year
          auth_attempts: 0,
          total_count: 12,
          paid_count: 1,
          customer_notify: true,
          created_at: Math.floor(Date.now() / 1000),
          expire_by: null,
          short_url: null,
          has_scheduled_changes: false,
          change_scheduled_at: null,
          source: 'api',
          remaining_count: 11
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  }
};

function generateWebhookSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

async function sendWebhookRequest(eventType: string, payload: any) {
  const payloadString = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadString, WEBHOOK_SECRET);
  
  console.log(`\n📤 Sending ${eventType} webhook...`);
  console.log(`URL: ${WEBHOOK_URL}`);
  console.log(`Signature: ${signature}`);
  
  try {
    const response = await axios.post(WEBHOOK_URL, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Event-Id': `evt_${Date.now()}`,
        'X-Razorpay-Signature': signature
      }
    });
    
    console.log(`✅ Success! Status: ${response.status}`);
    console.log(`Response:`, response.data);
  } catch (error: any) {
    console.error(`❌ Error! Status: ${error.response?.status || 'Network Error'}`);
    console.error(`Response:`, error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🧪 Razorpay Webhook Testing Script');
  console.log('==================================');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Webhook Secret: ${WEBHOOK_SECRET.substring(0, 4)}...`);
  
  // Test payment captured
  await sendWebhookRequest('payment.captured', samplePayloads.paymentCaptured);
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test order paid
  await sendWebhookRequest('order.paid', samplePayloads.orderPaid);
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test subscription activated
  await sendWebhookRequest('subscription.activated', samplePayloads.subscriptionActivated);
  
  console.log('\n✅ All webhook tests completed!');
}

// Run the tests
runTests().catch(console.error);