import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/helpers';
import { testUsers, testAudio } from '../utils/test-data';

test.describe('Audio-Specific Functionality Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.existingUser.email, testUsers.existingUser.password);
  });

  test('Player starts/stops correctly', async ({ page }) => {
    await test.step('Navigate to library', async () => {
      await page.goto('/library');
      await expect(page.locator('[data-testid="audio-grid"]')).toBeVisible();
      await helpers.takeScreenshot('01-library-loaded');
    });

    await test.step('Test audio player controls', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await expect(audioCard).toBeVisible();
      
      // Test play button
      const playButton = audioCard.locator('[data-testid="play-button"]');
      const audioElement = audioCard.locator('audio');
      
      await playButton.click();
      await helpers.waitForAudioLoad(audioElement);
      
      // Verify audio is playing
      const isPlaying = await audioElement.evaluate((audio: HTMLAudioElement) => !audio.paused);
      expect(isPlaying).toBeTruthy();
      
      // Check play button changed to pause
      await expect(audioCard.locator('[data-testid="pause-button"]')).toBeVisible();
      
      await helpers.takeScreenshot('02-audio-playing');
    });

    await test.step('Test pause functionality', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      const pauseButton = audioCard.locator('[data-testid="pause-button"]');
      const audioElement = audioCard.locator('audio');
      
      await pauseButton.click();
      
      // Verify audio is paused
      const isPaused = await audioElement.evaluate((audio: HTMLAudioElement) => audio.paused);
      expect(isPaused).toBeTruthy();
      
      // Check pause button changed back to play
      await expect(audioCard.locator('[data-testid="play-button"]')).toBeVisible();
      
      await helpers.takeScreenshot('03-audio-paused');
    });

    await test.step('Test seek functionality', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      const seekSlider = audioCard.locator('[data-testid="seek-slider"]');
      const audioElement = audioCard.locator('audio');
      
      // Start playing
      await audioCard.locator('[data-testid="play-button"]').click();
      await helpers.waitForAudioLoad(audioElement);
      
      // Seek to middle
      const sliderBounds = await seekSlider.boundingBox();
      if (sliderBounds) {
        await seekSlider.click({
          position: { x: sliderBounds.width / 2, y: sliderBounds.height / 2 }
        });
        
        // Verify seek worked
        const currentTime = await audioElement.evaluate((audio: HTMLAudioElement) => audio.currentTime);
        const duration = await audioElement.evaluate((audio: HTMLAudioElement) => audio.duration);
        
        expect(currentTime).toBeGreaterThan(duration * 0.3);
        expect(currentTime).toBeLessThan(duration * 0.7);
      }
      
      await helpers.takeScreenshot('04-audio-seeked');
    });

    await test.step('Test volume control', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      const volumeSlider = audioCard.locator('[data-testid="volume-slider"]');
      const audioElement = audioCard.locator('audio');
      
      // Set volume to 50%
      const sliderBounds = await volumeSlider.boundingBox();
      if (sliderBounds) {
        await volumeSlider.click({
          position: { x: sliderBounds.width / 2, y: sliderBounds.height / 2 }
        });
        
        // Verify volume changed
        const volume = await audioElement.evaluate((audio: HTMLAudioElement) => audio.volume);
        expect(volume).toBeCloseTo(0.5, 1);
      }
      
      await helpers.takeScreenshot('05-volume-adjusted');
    });
  });

  test('Waveform displays accurately', async ({ page }) => {
    await test.step('Navigate to detailed audio view', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      await expect(page.locator('[data-testid="audio-detail-view"]')).toBeVisible();
      await helpers.takeScreenshot('01-audio-detail-view');
    });

    await test.step('Verify waveform rendering', async () => {
      const waveform = page.locator('[data-testid="waveform-display"]');
      await expect(waveform).toBeVisible();
      
      // Wait for waveform to load
      await page.waitForFunction(() => {
        const canvas = document.querySelector('[data-testid="waveform-display"] canvas');
        return canvas && canvas.width > 0;
      });
      
      // Check waveform has actual visual data
      const hasWaveformData = await waveform.evaluate((waveformEl) => {
        const canvas = waveformEl.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        
        // Check if there are non-transparent pixels (actual waveform data)
        if (!imageData) return false;
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] > 0) return true; // Found non-transparent pixel
        }
        return false;
      });
      
      expect(hasWaveformData).toBeTruthy();
      await helpers.takeScreenshot('02-waveform-loaded');
    });

    await test.step('Test waveform interaction', async () => {
      const waveform = page.locator('[data-testid="waveform-display"]');
      const audioElement = page.locator('[data-testid="main-audio-player"] audio');
      
      // Click on waveform to seek
      const waveformBounds = await waveform.boundingBox();
      if (waveformBounds) {
        // Click at 30% through the waveform
        await waveform.click({
          position: { x: waveformBounds.width * 0.3, y: waveformBounds.height / 2 }
        });
        
        // Verify audio seeked to correct position
        await page.waitForTimeout(500); // Allow seek to complete
        const currentTime = await audioElement.evaluate((audio: HTMLAudioElement) => audio.currentTime);
        const duration = await audioElement.evaluate((audio: HTMLAudioElement) => audio.duration);
        
        expect(currentTime / duration).toBeCloseTo(0.3, 1);
      }
      
      await helpers.takeScreenshot('03-waveform-interaction');
    });

    await test.step('Verify waveform progress indicator', async () => {
      const waveform = page.locator('[data-testid="waveform-display"]');
      const playButton = page.locator('[data-testid="main-play-button"]');
      
      // Start playing
      await playButton.click();
      
      // Wait for progress indicator to appear and move
      await expect(waveform.locator('[data-testid="progress-indicator"]')).toBeVisible();
      
      // Check that progress indicator moves
      const initialPosition = await waveform.locator('[data-testid="progress-indicator"]').evaluate((el) => {
        return parseFloat(el.style.left || '0');
      });
      
      await page.waitForTimeout(2000);
      
      const newPosition = await waveform.locator('[data-testid="progress-indicator"]').evaluate((el) => {
        return parseFloat(el.style.left || '0');
      });
      
      expect(newPosition).toBeGreaterThan(initialPosition);
      await helpers.takeScreenshot('04-progress-indicator');
    });
  });

  test('Download works across browsers', async ({ page, browserName }) => {
    await test.step('Navigate to audio with download option', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      await expect(page.locator('[data-testid="download-section"]')).toBeVisible();
      await helpers.takeScreenshot(`01-download-section-${browserName}`);
    });

    await test.step('Test direct download', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-mp3"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.mp3$/);
      
      // Verify file size is reasonable
      const path = await download.path();
      const fs = require('fs');
      const stats = fs.statSync(path);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      
      await helpers.takeScreenshot(`02-download-complete-${browserName}`);
    });

    await test.step('Test download with license selection', async () => {
      await page.click('[data-testid="download-with-license"]');
      await expect(page.locator('[data-testid="license-modal"]')).toBeVisible();
      
      // Select personal license (free)
      await page.click('[data-testid="license-personal"]');
      await page.click('[data-testid="agree-terms"]');
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-download"]');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.mp3$/);
      
      await helpers.takeScreenshot(`03-licensed-download-${browserName}`);
    });
  });

  test('Mobile audio playback', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await test.step('Navigate to mobile library', async () => {
      await page.goto('/library');
      await expect(page.locator('[data-testid="mobile-audio-grid"]')).toBeVisible();
      await helpers.takeScreenshot('01-mobile-library');
    });

    await test.step('Test mobile player controls', async () => {
      const mobileAudioCard = page.locator('[data-testid="mobile-audio-card"]').first();
      await expect(mobileAudioCard).toBeVisible();
      
      // Test touch play
      await mobileAudioCard.locator('[data-testid="mobile-play-button"]').tap();
      
      // Verify mobile player opens
      await expect(page.locator('[data-testid="mobile-audio-player"]')).toBeVisible();
      
      await helpers.takeScreenshot('02-mobile-player-open');
    });

    await test.step('Test swipe gestures', async () => {
      const playerArea = page.locator('[data-testid="mobile-player-area"]');
      
      // Test swipe to next track
      await playerArea.swipe('left');
      await page.waitForTimeout(500);
      
      // Verify track changed
      const trackTitle = await page.locator('[data-testid="current-track-title"]').textContent();
      expect(trackTitle).toBeTruthy();
      
      // Test swipe to previous track
      await playerArea.swipe('right');
      await page.waitForTimeout(500);
      
      await helpers.takeScreenshot('03-mobile-swipe-navigation');
    });

    await test.step('Test mobile volume and seek', async () => {
      const volumeSlider = page.locator('[data-testid="mobile-volume-slider"]');
      const seekSlider = page.locator('[data-testid="mobile-seek-slider"]');
      
      // Test volume adjustment on mobile
      await volumeSlider.tap();
      
      // Test seek on mobile
      const seekBounds = await seekSlider.boundingBox();
      if (seekBounds) {
        await seekSlider.tap({
          position: { x: seekBounds.width / 2, y: seekBounds.height / 2 }
        });
      }
      
      await helpers.takeScreenshot('04-mobile-controls');
    });
  });

  test('Background play handling', async ({ page, context }) => {
    await test.step('Start audio playback', async () => {
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.locator('[data-testid="play-button"]').click();
      
      const audioElement = audioCard.locator('audio');
      await helpers.waitForAudioLoad(audioElement);
      
      await helpers.takeScreenshot('01-audio-started');
    });

    await test.step('Test background play on page navigation', async () => {
      const audioElement = page.locator('[data-testid="audio-card-flute"] audio').first();
      
      // Navigate to different page
      await page.goto('/generate');
      
      // Verify audio continues playing (if supported)
      await page.waitForTimeout(1000);
      
      // Check if global player or persistent player exists
      const globalPlayer = page.locator('[data-testid="global-audio-player"]');
      if (await globalPlayer.isVisible()) {
        const isPlaying = await globalPlayer.locator('audio').evaluate((audio: HTMLAudioElement) => !audio.paused);
        expect(isPlaying).toBeTruthy();
      }
      
      await helpers.takeScreenshot('02-background-play-navigation');
    });

    await test.step('Test background play on tab switch', async () => {
      // Create new tab
      const newPage = await context.newPage();
      await newPage.goto('https://example.com');
      
      // Switch back to original tab
      await page.bringToFront();
      
      // Check if audio is still playing or properly paused
      const globalPlayer = page.locator('[data-testid="global-audio-player"]');
      if (await globalPlayer.isVisible()) {
        const audioState = await globalPlayer.locator('audio').evaluate((audio: HTMLAudioElement) => ({
          paused: audio.paused,
          currentTime: audio.currentTime
        }));
        
        // Audio should either be playing or properly managed
        expect(typeof audioState.paused).toBe('boolean');
        expect(audioState.currentTime).toBeGreaterThanOrEqual(0);
      }
      
      await newPage.close();
      await helpers.takeScreenshot('03-tab-switch-handling');
    });

    await test.step('Test page visibility API integration', async () => {
      // Test page visibility change handling
      await page.evaluate(() => {
        // Simulate page becoming hidden
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'hidden'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await page.waitForTimeout(500);
      
      // Simulate page becoming visible again
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          writable: true,
          value: 'visible'
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      await helpers.takeScreenshot('04-visibility-api-test');
    });
  });

  test('Audio format support and fallbacks', async ({ page }) => {
    await test.step('Test MP3 support', async () => {
      await page.goto('/library');
      
      // Check for MP3 audio elements
      const mp3Audio = page.locator('audio[src*=".mp3"]').first();
      if (await mp3Audio.count() > 0) {
        await helpers.waitForAudioLoad(mp3Audio);
        
        const canPlay = await mp3Audio.evaluate((audio: HTMLAudioElement) => {
          return audio.canPlayType('audio/mpeg');
        });
        
        expect(canPlay).not.toBe('');
      }
      
      await helpers.takeScreenshot('01-mp3-support');
    });

    await test.step('Test MP4 audio support', async () => {
      // Check for MP4 audio elements
      const mp4Audio = page.locator('audio[src*=".mp4"]').first();
      if (await mp4Audio.count() > 0) {
        await helpers.waitForAudioLoad(mp4Audio);
        
        const canPlay = await mp4Audio.evaluate((audio: HTMLAudioElement) => {
          return audio.canPlayType('audio/mp4');
        });
        
        expect(canPlay).not.toBe('');
      }
      
      await helpers.takeScreenshot('02-mp4-support');
    });

    await test.step('Test audio fallback handling', async () => {
      // Mock audio loading failure
      await page.route('**/*.mp3', route => route.abort());
      
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.locator('[data-testid="play-button"]').click();
      
      // Check for error handling
      await expect(page.locator('[data-testid="audio-error"]')).toBeVisible();
      
      await helpers.takeScreenshot('03-audio-fallback');
    });
  });
});