import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/helpers';
import { testUsers, testAudio } from '../utils/test-data';

test.describe('Critical User Journeys', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('New user registration → first generation → download', async ({ page }) => {
    const user = testUsers.newUser;
    
    // Step 1: Register new user
    await test.step('Register new user', async () => {
      await helpers.register(user.email, user.password, user.name);
      await expect(page).toHaveURL('/dashboard');
      await helpers.takeScreenshot('01-registration-complete');
    });

    // Step 2: Navigate to generation page
    await test.step('Navigate to generation', async () => {
      await page.click('[data-testid="nav-generate"]');
      await expect(page).toHaveURL('/generate');
      await expect(page.locator('[data-testid="generation-form"]')).toBeVisible();
      await helpers.takeScreenshot('02-generation-page');
    });

    // Step 3: Create first sound logo
    await test.step('Create sound logo', async () => {
      await helpers.mockAudioGeneration();
      
      // Select sound logo type
      await page.click('[data-testid="generation-type-sound-logo"]');
      
      // Configure parameters
      await page.fill('[data-testid="duration-input"]', '5');
      await page.selectOption('[data-testid="mood-select"]', 'energetic');
      
      // Select source sample
      await page.click('[data-testid="sample-flute"]');
      
      // Start generation
      await page.click('[data-testid="generate-button"]');
      
      // Wait for generation to complete
      await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
      await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });
      await helpers.takeScreenshot('03-generation-complete');
    });

    // Step 4: Preview and download
    await test.step('Preview and download', async () => {
      // Preview the generated audio
      const audioPlayer = page.locator('[data-testid="preview-player"]');
      await expect(audioPlayer).toBeVisible();
      
      await page.click('[data-testid="play-preview"]');
      await helpers.waitForAudioLoad(audioPlayer.locator('audio'));
      
      // Download the file
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-button"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/\.mp3$/);
      await helpers.takeScreenshot('04-download-complete');
    });
  });

  test('Browse library → create playlist → purchase license', async ({ page }) => {
    const user = testUsers.existingUser;
    
    // Step 1: Login
    await test.step('Login user', async () => {
      await helpers.login(user.email, user.password);
      await helpers.takeScreenshot('01-login-complete');
    });

    // Step 2: Browse audio library
    await test.step('Browse library', async () => {
      await page.click('[data-testid="nav-library"]');
      await expect(page).toHaveURL('/library');
      
      // Verify samples are displayed
      await expect(page.locator('[data-testid="audio-grid"]')).toBeVisible();
      const audioCards = page.locator('[data-testid^="audio-card-"]');
      await expect(audioCards).toHaveCountGreaterThan(0);
      
      // Use filters
      await page.click('[data-testid="filter-culture"]');
      await page.click('[data-testid="culture-mizo"]');
      await page.click('[data-testid="apply-filters"]');
      
      await helpers.takeScreenshot('02-library-filtered');
    });

    // Step 3: Create playlist
    await test.step('Create playlist', async () => {
      await helpers.mockAudioGeneration();
      
      // Select multiple samples
      await page.click('[data-testid="audio-card-flute"] [data-testid="select-checkbox"]');
      await page.click('[data-testid="audio-card-strings"] [data-testid="select-checkbox"]');
      
      // Open playlist generator
      await page.click('[data-testid="create-playlist"]');
      await expect(page.locator('[data-testid="playlist-modal"]')).toBeVisible();
      
      // Configure playlist
      await page.fill('[data-testid="playlist-name"]', 'Test Mizo Playlist');
      await page.fill('[data-testid="playlist-duration"]', '30');
      await page.selectOption('[data-testid="playlist-mood"]', 'ambient');
      
      // Generate playlist
      await page.click('[data-testid="generate-playlist"]');
      await page.waitForSelector('[data-testid="playlist-complete"]', { timeout: 60000 });
      
      await helpers.takeScreenshot('03-playlist-generated');
    });

    // Step 4: Purchase license
    await test.step('Purchase license', async () => {
      // Select commercial license
      await page.click('[data-testid="license-commercial"]');
      await expect(page.locator('[data-testid="license-details"]')).toBeVisible();
      
      // Proceed to payment
      await page.click('[data-testid="purchase-license"]');
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
      
      // Fill payment details (using test card)
      await helpers.fillPaymentForm({
        number: '4242424242424242',
        expiry: '12/30',
        cvc: '123',
        name: user.name
      });
      
      // Complete purchase
      await page.click('[data-testid="complete-payment"]');
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
      
      await helpers.takeScreenshot('04-license-purchased');
    });
  });

  test('Upload sample → set metadata → publish (admin)', async ({ page }) => {
    const admin = testUsers.adminUser;
    
    // Step 1: Login as admin
    await test.step('Admin login', async () => {
      await helpers.login(admin.email, admin.password);
      await page.goto('/admin');
      await expect(page).toHaveURL('/admin');
      await helpers.takeScreenshot('01-admin-dashboard');
    });

    // Step 2: Upload new sample
    await test.step('Upload audio sample', async () => {
      await page.click('[data-testid="upload-sample"]');
      
      // Simulate file upload
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles('./assets/sample-audio/flute.mp4');
      
      // Wait for upload progress
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await page.waitForSelector('[data-testid="upload-complete"]');
      
      await helpers.takeScreenshot('02-file-uploaded');
    });

    // Step 3: Set cultural metadata
    await test.step('Set metadata', async () => {
      // Fill basic info
      await page.fill('[data-testid="sample-title"]', 'Traditional Mizo Flute');
      await page.fill('[data-testid="sample-description"]', 'Authentic bamboo flute recording from Mizoram');
      
      // Cultural context
      await page.selectOption('[data-testid="culture-select"]', 'mizo');
      await page.selectOption('[data-testid="instrument-select"]', 'flute');
      await page.fill('[data-testid="cultural-significance"]', 'Used in traditional ceremonies and festivals');
      
      // Usage rights
      await page.selectOption('[data-testid="usage-rights"]', 'commercial');
      await page.fill('[data-testid="attribution-text"]', 'Traditional Mizo Music - Cultural Sound Lab');
      
      // Tags
      await page.fill('[data-testid="tags-input"]', 'traditional, mizo, flute, ceremonial, bamboo');
      
      await helpers.takeScreenshot('03-metadata-filled');
    });

    // Step 4: Preview and publish
    await test.step('Preview and publish', async () => {
      // Preview the sample
      const audioPlayer = page.locator('[data-testid="metadata-preview-player"]');
      await page.click('[data-testid="preview-sample"]');
      await helpers.waitForAudioLoad(audioPlayer.locator('audio'));
      
      // Validate metadata
      await page.click('[data-testid="validate-metadata"]');
      await expect(page.locator('[data-testid="validation-success"]')).toBeVisible();
      
      // Publish to library
      await page.click('[data-testid="publish-sample"]');
      await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
      
      // Verify in library
      await page.goto('/library');
      await expect(page.locator('[data-testid="audio-card-traditional-mizo-flute"]')).toBeVisible();
      
      await helpers.takeScreenshot('04-sample-published');
    });
  });

  test('Generate sound logo → preview → iterate → finalize', async ({ page }) => {
    const user = testUsers.existingUser;
    
    // Step 1: Login and navigate
    await test.step('Setup', async () => {
      await helpers.login(user.email, user.password);
      await page.goto('/generate');
      await helpers.mockAudioGeneration();
      await helpers.takeScreenshot('01-generation-setup');
    });

    // Step 2: Initial generation
    await test.step('Initial sound logo generation', async () => {
      await page.click('[data-testid="generation-type-sound-logo"]');
      
      // Configure initial parameters
      await page.fill('[data-testid="duration-input"]', '7');
      await page.selectOption('[data-testid="mood-select"]', 'professional');
      await page.selectOption('[data-testid="style-select"]', 'modern');
      await page.click('[data-testid="sample-bamboo"]');
      
      await page.click('[data-testid="generate-button"]');
      await page.waitForSelector('[data-testid="generation-complete"]');
      
      await helpers.takeScreenshot('02-initial-generation');
    });

    // Step 3: Preview and feedback
    await test.step('Preview first iteration', async () => {
      const audioPlayer = page.locator('[data-testid="preview-player"]');
      await page.click('[data-testid="play-preview"]');
      await helpers.waitForAudioLoad(audioPlayer.locator('audio'));
      
      // Rate the generation
      await page.click('[data-testid="rating-3"]');
      await page.fill('[data-testid="feedback-text"]', 'Good but needs more energy');
      
      await helpers.takeScreenshot('03-feedback-given');
    });

    // Step 4: Iterate with changes
    await test.step('Second iteration', async () => {
      await page.click('[data-testid="regenerate-button"]');
      
      // Adjust parameters based on feedback
      await page.selectOption('[data-testid="mood-select"]', 'energetic');
      await page.fill('[data-testid="energy-slider"]', '80');
      
      await page.click('[data-testid="generate-button"]');
      await page.waitForSelector('[data-testid="generation-complete"]');
      
      await helpers.takeScreenshot('04-second-iteration');
    });

    // Step 5: Compare versions
    await test.step('Compare versions', async () => {
      await page.click('[data-testid="compare-versions"]');
      await expect(page.locator('[data-testid="version-comparison"]')).toBeVisible();
      
      // Play both versions
      await page.click('[data-testid="play-version-1"]');
      await page.waitForTimeout(3000);
      await page.click('[data-testid="stop-version-1"]');
      
      await page.click('[data-testid="play-version-2"]');
      await page.waitForTimeout(3000);
      await page.click('[data-testid="stop-version-2"]');
      
      // Select preferred version
      await page.click('[data-testid="select-version-2"]');
      
      await helpers.takeScreenshot('05-version-comparison');
    });

    // Step 6: Final iteration and approval
    await test.step('Final iteration', async () => {
      await page.click('[data-testid="fine-tune"]');
      
      // Make final adjustments
      await page.fill('[data-testid="reverb-slider"]', '40');
      await page.fill('[data-testid="compression-slider"]', '60');
      
      await page.click('[data-testid="generate-final"]');
      await page.waitForSelector('[data-testid="generation-complete"]');
      
      // Final approval
      await page.click('[data-testid="approve-final"]');
      await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
      
      await helpers.takeScreenshot('06-final-approved');
    });

    // Step 7: Download and save
    await test.step('Download final version', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-final"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/sound-logo.*\.mp3$/);
      
      // Save to projects
      await page.fill('[data-testid="project-name"]', 'Professional Sound Logo v2');
      await page.click('[data-testid="save-to-projects"]');
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
      
      await helpers.takeScreenshot('07-project-saved');
    });
  });
});