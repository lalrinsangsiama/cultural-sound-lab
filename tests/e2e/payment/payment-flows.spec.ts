import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/helpers';
import { testUsers, paymentData, licenseTypes } from '../utils/test-data';

test.describe('Payment Flow Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.existingUser.email, testUsers.existingUser.password);
    
    // Mock Stripe integration for testing
    await page.addInitScript(() => {
      // Mock Stripe object
      window.Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: () => {},
            on: () => {},
            update: () => {},
            unmount: () => {},
            destroy: () => {},
            focus: () => {},
            blur: () => {},
            clear: () => {}
          }),
          getElement: () => null
        }),
        createToken: () => Promise.resolve({
          token: { id: 'tok_test_123' },
          error: null
        }),
        createPaymentMethod: () => Promise.resolve({
          paymentMethod: { id: 'pm_test_123' },
          error: null
        }),
        confirmCardPayment: () => Promise.resolve({
          paymentIntent: { status: 'succeeded' },
          error: null
        })
      });
    });
  });

  test('Successful payment flow', async ({ page }) => {
    await test.step('Select item for purchase', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      await expect(page.locator('[data-testid="audio-detail-view"]')).toBeVisible();
      await helpers.takeScreenshot('01-item-selected');
    });

    await test.step('Choose commercial license', async () => {
      await page.click('[data-testid="purchase-license"]');
      await expect(page.locator('[data-testid="license-selection"]')).toBeVisible();
      
      // Select commercial license
      await page.click('[data-testid="license-commercial"]');
      
      // Verify price and features display
      await expect(page.locator('[data-testid="license-price"]')).toContainText('$29');
      await expect(page.locator('[data-testid="license-features"]')).toContainText('Commercial use');
      
      await page.click('[data-testid="proceed-to-payment"]');
      await helpers.takeScreenshot('02-license-selected');
    });

    await test.step('Fill payment information', async () => {
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
      
      // Fill billing information
      await page.fill('[data-testid="billing-name"]', testUsers.existingUser.name);
      await page.fill('[data-testid="billing-email"]', testUsers.existingUser.email);
      await page.fill('[data-testid="billing-address"]', '123 Test Street');
      await page.fill('[data-testid="billing-city"]', 'Test City');
      await page.selectOption('[data-testid="billing-country"]', 'US');
      await page.fill('[data-testid="billing-zip"]', '12345');
      
      // Fill card information (mock)
      await page.fill('[data-testid="card-number"]', paymentData.validCard.number);
      await page.fill('[data-testid="card-expiry"]', paymentData.validCard.expiry);
      await page.fill('[data-testid="card-cvc"]', paymentData.validCard.cvc);
      
      await helpers.takeScreenshot('03-payment-form-filled');
    });

    await test.step('Process payment', async () => {
      // Mock successful payment response
      await page.route('/api/payments/process', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            paymentId: 'pi_test_123',
            licenseId: 'lic_test_123',
            downloadUrl: '/api/download/lic_test_123'
          })
        });
      });

      await page.click('[data-testid="complete-payment"]');
      
      // Wait for payment processing
      await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
      await page.waitForSelector('[data-testid="payment-success"]', { timeout: 30000 });
      
      await helpers.takeScreenshot('04-payment-success');
    });

    await test.step('Verify license creation', async () => {
      // Check success message
      await expect(page.locator('[data-testid="payment-success"]')).toContainText('Payment successful');
      
      // Verify download link
      await expect(page.locator('[data-testid="download-link"]')).toBeVisible();
      
      // Verify license details
      await expect(page.locator('[data-testid="license-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="license-type"]')).toContainText('Commercial');
      
      await helpers.takeScreenshot('05-license-created');
    });

    await test.step('Verify invoice generation', async () => {
      await page.click('[data-testid="view-invoice"]');
      await expect(page.locator('[data-testid="invoice-modal"]')).toBeVisible();
      
      // Check invoice details
      await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-amount"]')).toContainText('$29.00');
      await expect(page.locator('[data-testid="invoice-date"]')).toBeVisible();
      
      // Test invoice download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-invoice"]');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf$/);
      
      await helpers.takeScreenshot('06-invoice-generated');
    });
  });

  test('Failed payment recovery', async ({ page }) => {
    await test.step('Setup failed payment scenario', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      await page.click('[data-testid="purchase-license"]');
      await page.click('[data-testid="license-commercial"]');
      await page.click('[data-testid="proceed-to-payment"]');
      
      await helpers.takeScreenshot('01-payment-setup');
    });

    await test.step('Attempt payment with declined card', async () => {
      // Fill form with declined card
      await helpers.fillPaymentForm(paymentData.declinedCard);
      
      // Mock payment failure
      await page.route('/api/payments/process', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Your card was declined',
            code: 'card_declined'
          })
        });
      });

      await page.click('[data-testid="complete-payment"]');
      
      // Verify error message
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('card was declined');
      
      await helpers.takeScreenshot('02-payment-failed');
    });

    await test.step('Retry with valid card', async () => {
      // Clear error and retry
      await page.click('[data-testid="retry-payment"]');
      await expect(page.locator('[data-testid="payment-error"]')).not.toBeVisible();
      
      // Update with valid card
      await page.fill('[data-testid="card-number"]', paymentData.validCard.number);
      
      // Mock successful payment for retry
      await page.route('/api/payments/process', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            paymentId: 'pi_test_retry_123',
            licenseId: 'lic_test_retry_123'
          })
        });
      });

      await page.click('[data-testid="complete-payment"]');
      await page.waitForSelector('[data-testid="payment-success"]');
      
      await helpers.takeScreenshot('03-payment-retry-success');
    });

    await test.step('Test multiple failure recovery', async () => {
      // Navigate to another purchase
      await page.goto('/library');
      const anotherCard = page.locator('[data-testid="audio-card-strings"]').first();
      await anotherCard.click();
      
      await page.click('[data-testid="purchase-license"]');
      await page.click('[data-testid="license-enterprise"]');
      await page.click('[data-testid="proceed-to-payment"]');
      
      // Simulate multiple failures
      let failureCount = 0;
      await page.route('/api/payments/process', route => {
        failureCount++;
        if (failureCount <= 2) {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: failureCount === 1 ? 'Insufficient funds' : 'Processing error',
              code: failureCount === 1 ? 'insufficient_funds' : 'processing_error'
            })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              paymentId: 'pi_test_final_123'
            })
          });
        }
      });

      // First failure
      await helpers.fillPaymentForm(paymentData.validCard);
      await page.click('[data-testid="complete-payment"]');
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('Insufficient funds');
      
      // Second failure
      await page.click('[data-testid="retry-payment"]');
      await page.click('[data-testid="complete-payment"]');
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('Processing error');
      
      // Final success
      await page.click('[data-testid="retry-payment"]');
      await page.click('[data-testid="complete-payment"]');
      await page.waitForSelector('[data-testid="payment-success"]');
      
      await helpers.takeScreenshot('04-multiple-retry-success');
    });
  });

  test('Subscription upgrade flow', async ({ page }) => {
    await test.step('Access subscription settings', async () => {
      await page.goto('/settings');
      await page.click('[data-testid="subscription-tab"]');
      
      await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Free');
      
      await helpers.takeScreenshot('01-current-subscription');
    });

    await test.step('Select upgrade plan', async () => {
      await page.click('[data-testid="upgrade-subscription"]');
      await expect(page.locator('[data-testid="subscription-plans"]')).toBeVisible();
      
      // View plan comparison
      const plans = ['basic', 'pro', 'enterprise'];
      for (const plan of plans) {
        await expect(page.locator(`[data-testid="plan-${plan}"]`)).toBeVisible();
      }
      
      // Select Pro plan
      await page.click('[data-testid="select-pro-plan"]');
      await expect(page.locator('[data-testid="selected-plan"]')).toContainText('Pro - $29/month');
      
      await helpers.takeScreenshot('02-plan-selected');
    });

    await test.step('Process subscription payment', async () => {
      await page.click('[data-testid="proceed-to-subscription-payment"]');
      
      // Fill payment details for subscription
      await helpers.fillPaymentForm(paymentData.validCard);
      await page.check('[data-testid="agree-subscription-terms"]');
      
      // Mock subscription creation
      await page.route('/api/subscriptions/create', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            subscriptionId: 'sub_test_123',
            customerId: 'cus_test_123',
            plan: 'pro',
            status: 'active'
          })
        });
      });

      await page.click('[data-testid="start-subscription"]');
      await page.waitForSelector('[data-testid="subscription-success"]');
      
      await helpers.takeScreenshot('03-subscription-created');
    });

    await test.step('Verify subscription benefits', async () => {
      // Check updated plan status
      await page.goto('/settings');
      await page.click('[data-testid="subscription-tab"]');
      
      await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro');
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Active');
      
      // Verify increased limits
      await expect(page.locator('[data-testid="generation-limit"]')).toContainText('100 per month');
      await expect(page.locator('[data-testid="download-limit"]')).toContainText('Unlimited');
      
      await helpers.takeScreenshot('04-subscription-active');
    });

    await test.step('Test subscription cancellation', async () => {
      await page.click('[data-testid="manage-subscription"]');
      await page.click('[data-testid="cancel-subscription"]');
      
      // Confirmation dialog
      await expect(page.locator('[data-testid="cancel-confirmation"]')).toBeVisible();
      await page.click('[data-testid="confirm-cancellation"]');
      
      // Mock cancellation
      await page.route('/api/subscriptions/cancel', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            subscriptionId: 'sub_test_123',
            status: 'canceled',
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });
      });

      await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Canceling');
      
      await helpers.takeScreenshot('05-subscription-canceled');
    });
  });

  test('License verification system', async ({ page }) => {
    await test.step('Purchase license for verification test', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      await page.click('[data-testid="purchase-license"]');
      await page.click('[data-testid="license-commercial"]');
      await page.click('[data-testid="proceed-to-payment"]');
      
      await helpers.fillPaymentForm(paymentData.validCard);
      
      // Mock successful license creation
      await page.route('/api/payments/process', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            paymentId: 'pi_test_verification',
            licenseId: 'lic_verify_123',
            verificationCode: 'CSL-VERIFY-123'
          })
        });
      });

      await page.click('[data-testid="complete-payment"]');
      await page.waitForSelector('[data-testid="payment-success"]');
      
      await helpers.takeScreenshot('01-license-purchased');
    });

    await test.step('Test license verification', async () => {
      // Navigate to verification page
      await page.goto('/verify-license');
      
      // Test valid license verification
      await page.fill('[data-testid="license-code"]', 'CSL-VERIFY-123');
      
      // Mock verification response
      await page.route('/api/license/verify', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: true,
            license: {
              id: 'lic_verify_123',
              type: 'Commercial',
              audioTitle: 'Traditional Mizo Flute',
              purchaseDate: new Date().toISOString(),
              expiryDate: null,
              usageRights: ['Commercial use', 'Download rights', 'Attribution required']
            }
          })
        });
      });

      await page.click('[data-testid="verify-license"]');
      
      // Check verification results
      await expect(page.locator('[data-testid="verification-result"]')).toBeVisible();
      await expect(page.locator('[data-testid="license-status"]')).toContainText('Valid');
      await expect(page.locator('[data-testid="license-details"]')).toContainText('Commercial');
      
      await helpers.takeScreenshot('02-license-verified');
    });

    await test.step('Test invalid license verification', async () => {
      // Test with invalid code
      await page.fill('[data-testid="license-code"]', 'INVALID-CODE-123');
      
      await page.route('/api/license/verify', route => {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            valid: false,
            error: 'License not found'
          })
        });
      });

      await page.click('[data-testid="verify-license"]');
      
      await expect(page.locator('[data-testid="verification-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="verification-error"]')).toContainText('License not found');
      
      await helpers.takeScreenshot('03-license-invalid');
    });

    await test.step('Test bulk license verification', async () => {
      await page.click('[data-testid="bulk-verification-tab"]');
      
      // Upload CSV with license codes
      const csvContent = 'License Code,Expected Status\nCSL-VERIFY-123,Valid\nINVALID-CODE-123,Invalid';
      
      // Create blob and set file input
      await page.evaluate((content) => {
        const blob = new Blob([content], { type: 'text/csv' });
        const file = new File([blob], 'licenses.csv', { type: 'text/csv' });
        
        const input = document.querySelector('[data-testid="bulk-file-input"]') as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }, csvContent);

      await page.click('[data-testid="process-bulk-verification"]');
      
      // Wait for bulk processing
      await page.waitForSelector('[data-testid="bulk-results"]');
      
      // Check results
      await expect(page.locator('[data-testid="valid-licenses"]')).toContainText('1');
      await expect(page.locator('[data-testid="invalid-licenses"]')).toContainText('1');
      
      await helpers.takeScreenshot('04-bulk-verification');
    });
  });

  test('Payment security and validation', async ({ page }) => {
    await test.step('Test input validation', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      await page.click('[data-testid="purchase-license"]');
      await page.click('[data-testid="license-commercial"]');
      await page.click('[data-testid="proceed-to-payment"]');
      
      // Test invalid card number
      await page.fill('[data-testid="card-number"]', '1234');
      await page.click('[data-testid="complete-payment"]');
      
      await expect(page.locator('[data-testid="card-number-error"]')).toContainText('Invalid card number');
      
      // Test invalid expiry
      await page.fill('[data-testid="card-number"]', paymentData.validCard.number);
      await page.fill('[data-testid="card-expiry"]', '13/20');
      await page.click('[data-testid="complete-payment"]');
      
      await expect(page.locator('[data-testid="card-expiry-error"]')).toContainText('Invalid expiry date');
      
      await helpers.takeScreenshot('01-validation-errors');
    });

    await test.step('Test CSRF protection', async () => {
      // Attempt payment without CSRF token
      await page.route('/api/payments/process', route => {
        if (!route.request().headers()['x-csrf-token']) {
          route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'CSRF token missing'
            })
          });
        }
      });

      await helpers.fillPaymentForm(paymentData.validCard);
      
      // Remove CSRF token from form
      await page.evaluate(() => {
        const csrfInput = document.querySelector('[name="csrf_token"]') as HTMLInputElement;
        if (csrfInput) csrfInput.remove();
      });

      await page.click('[data-testid="complete-payment"]');
      await expect(page.locator('[data-testid="payment-error"]')).toContainText('Security error');
      
      await helpers.takeScreenshot('02-csrf-protection');
    });

    await test.step('Test rate limiting', async () => {
      // Simulate rapid payment attempts
      let attemptCount = 0;
      await page.route('/api/payments/process', route => {
        attemptCount++;
        if (attemptCount > 3) {
          route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Too many attempts. Please wait before trying again.',
              retryAfter: 60
            })
          });
        } else {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Payment failed'
            })
          });
        }
      });

      // Make multiple rapid attempts
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="complete-payment"]');
        await page.waitForTimeout(500);
        
        if (i < 3) {
          await page.click('[data-testid="retry-payment"]');
        }
      }

      await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('Too many attempts');
      
      await helpers.takeScreenshot('03-rate-limiting');
    });
  });
});