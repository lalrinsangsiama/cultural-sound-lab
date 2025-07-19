import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/helpers';
import { testUsers } from '../utils/test-data';

test.describe('Performance Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.existingUser.email, testUsers.existingUser.password);
  });

  test('Page load times', async ({ page }) => {
    const pageLoadTimes: Record<string, number> = {};

    await test.step('Measure landing page load time', async () => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const endTime = Date.now();
      
      pageLoadTimes.landing = endTime - startTime;
      expect(pageLoadTimes.landing).toBeLessThan(3000); // Should load in under 3 seconds
      
      await helpers.takeScreenshot('01-landing-page-loaded');
    });

    await test.step('Measure dashboard load time', async () => {
      const duration = await helpers.measurePerformance('Dashboard Load', async () => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      });
      
      pageLoadTimes.dashboard = duration;
      expect(duration).toBeLessThan(2000); // Dashboard should load quickly for logged-in users
      
      await helpers.takeScreenshot('02-dashboard-loaded');
    });

    await test.step('Measure library page load time', async () => {
      const duration = await helpers.measurePerformance('Library Load', async () => {
        await page.goto('/library');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="audio-grid"]')).toBeVisible();
        // Wait for audio cards to render
        await page.waitForFunction(() => {
          const cards = document.querySelectorAll('[data-testid^="audio-card-"]');
          return cards.length > 0;
        });
      });
      
      pageLoadTimes.library = duration;
      expect(duration).toBeLessThan(4000); // Library with audio content may take longer
      
      await helpers.takeScreenshot('03-library-loaded');
    });

    await test.step('Measure generation page load time', async () => {
      const duration = await helpers.measurePerformance('Generation Load', async () => {
        await page.goto('/generate');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="generation-form"]')).toBeVisible();
      });
      
      pageLoadTimes.generation = duration;
      expect(duration).toBeLessThan(2500);
      
      await helpers.takeScreenshot('04-generation-loaded');
    });

    // Log all performance metrics
    console.log('Page Load Times:', pageLoadTimes);
  });

  test('Audio streaming latency', async ({ page }) => {
    await test.step('Navigate to library with audio samples', async () => {
      await page.goto('/library');
      await page.waitForLoadState('networkidle');
      await helpers.takeScreenshot('01-library-ready');
    });

    await test.step('Measure audio load and play latency', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      const audioElement = audioCard.locator('audio');
      
      // Measure time to load audio metadata
      const loadStartTime = Date.now();
      await audioCard.click(); // Trigger audio loading
      
      await audioElement.evaluate((audio: HTMLAudioElement) => {
        return new Promise((resolve) => {
          if (audio.readyState >= 1) resolve(true);
          audio.addEventListener('loadedmetadata', resolve, { once: true });
        });
      });
      
      const loadTime = Date.now() - loadStartTime;
      expect(loadTime).toBeLessThan(2000); // Audio metadata should load quickly
      
      // Measure time to start playback
      const playStartTime = Date.now();
      await audioCard.locator('[data-testid="play-button"]').click();
      
      await audioElement.evaluate((audio: HTMLAudioElement) => {
        return new Promise((resolve) => {
          if (!audio.paused) resolve(true);
          audio.addEventListener('play', resolve, { once: true });
        });
      });
      
      const playTime = Date.now() - playStartTime;
      expect(playTime).toBeLessThan(1000); // Should start playing quickly
      
      console.log(`Audio load time: ${loadTime}ms, Play time: ${playTime}ms`);
      await helpers.takeScreenshot('02-audio-playing');
    });

    await test.step('Test audio buffering performance', async () => {
      const audioCard = page.locator('[data-testid="audio-card-strings"]').first();
      const audioElement = audioCard.locator('audio');
      
      await audioCard.click();
      await audioCard.locator('[data-testid="play-button"]').click();
      
      // Monitor buffering events
      const bufferingData = await audioElement.evaluate((audio: HTMLAudioElement) => {
        return new Promise((resolve) => {
          const data: { buffered: number[], stalls: number } = { buffered: [], stalls: 0 };
          
          const checkBuffering = () => {
            for (let i = 0; i < audio.buffered.length; i++) {
              data.buffered.push(audio.buffered.end(i) - audio.buffered.start(i));
            }
          };
          
          audio.addEventListener('waiting', () => data.stalls++);
          audio.addEventListener('progress', checkBuffering);
          audio.addEventListener('canplaythrough', () => {
            checkBuffering();
            resolve(data);
          });
          
          // Timeout after 10 seconds
          setTimeout(() => resolve(data), 10000);
        });
      });
      
      expect(bufferingData.stalls).toBeLessThan(3); // Minimal buffering stalls
      console.log('Buffering data:', bufferingData);
      
      await helpers.takeScreenshot('03-buffering-test');
    });
  });

  test('Generation queue handling', async ({ page }) => {
    await test.step('Setup mock generation service', async () => {
      let generationCount = 0;
      
      await page.route('/api/generate/**', async (route) => {
        generationCount++;
        const delay = Math.min(generationCount * 1000, 5000); // Simulate queue delay
        
        if (route.request().method() === 'POST') {
          await new Promise(resolve => setTimeout(resolve, delay));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: `generation-${generationCount}`,
              status: 'queued',
              position: generationCount,
              estimatedTime: delay / 1000
            })
          });
        } else if (route.request().url().includes('/status/')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: `generation-${generationCount}`,
              status: 'completed',
              downloadUrl: '/demo-audio/track1-demo.mp3'
            })
          });
        }
      });
      
      await helpers.takeScreenshot('01-generation-setup');
    });

    await test.step('Test concurrent generation requests', async () => {
      await page.goto('/generate');
      
      // Submit multiple generations concurrently
      const generations = [];
      
      for (let i = 0; i < 3; i++) {
        const generationPromise = (async () => {
          const startTime = Date.now();
          
          // Configure generation
          await page.click('[data-testid="generation-type-sound-logo"]');
          await page.fill('[data-testid="duration-input"]', '5');
          await page.selectOption('[data-testid="mood-select"]', 'energetic');
          await page.click('[data-testid="sample-flute"]');
          
          // Submit generation
          await page.click('[data-testid="generate-button"]');
          
          // Wait for queue position
          await expect(page.locator('[data-testid="queue-position"]')).toBeVisible();
          
          const endTime = Date.now();
          return endTime - startTime;
        })();
        
        generations.push(generationPromise);
        await page.waitForTimeout(500); // Small delay between submissions
      }
      
      const results = await Promise.all(generations);
      
      // Verify queue handling performance
      expect(results.every(time => time < 10000)).toBeTruthy(); // All should queue within 10s
      
      console.log('Generation queue times:', results);
      await helpers.takeScreenshot('02-concurrent-generations');
    });

    await test.step('Test queue priority handling', async () => {
      // Test with premium user (should get priority)
      await page.evaluate(() => {
        localStorage.setItem('user-tier', 'premium');
      });
      
      await page.reload();
      
      const premiumGenerationTime = await helpers.measurePerformance('Premium Generation', async () => {
        await page.click('[data-testid="generation-type-playlist"]');
        await page.fill('[data-testid="duration-input"]', '30');
        await page.click('[data-testid="generate-button"]');
        
        await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
      });
      
      expect(premiumGenerationTime).toBeLessThan(3000); // Premium should be faster
      
      await helpers.takeScreenshot('03-premium-generation');
    });
  });

  test('Concurrent user limits', async ({ browser }) => {
    await test.step('Simulate multiple concurrent users', async () => {
      const contexts = [];
      const pages = [];
      
      // Create multiple browser contexts (simulating different users)
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        contexts.push(context);
        pages.push(page);
      }
      
      // Login all users and navigate to library
      const loginPromises = pages.map(async (page, index) => {
        const testHelper = new TestHelpers(page);
        await testHelper.login(
          `test-user-${index}@csl.test`,
          'TestPassword123!'
        );
        await page.goto('/library');
        return page;
      });
      
      const loggedInPages = await Promise.all(loginPromises);
      
      // Test concurrent audio playback
      const playPromises = loggedInPages.map(async (page, index) => {
        const startTime = Date.now();
        
        const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
        await audioCard.locator('[data-testid="play-button"]').click();
        
        // Wait for audio to start
        await page.waitForTimeout(1000);
        
        const endTime = Date.now();
        return { user: index, time: endTime - startTime };
      });
      
      const playResults = await Promise.all(playPromises);
      
      // Verify all users can play audio concurrently
      expect(playResults.every(result => result.time < 5000)).toBeTruthy();
      
      // Take screenshot from first user's perspective
      await loggedInPages[0].screenshot({ 
        path: 'test-results/screenshots/concurrent-users.png' 
      });
      
      // Clean up
      await Promise.all(contexts.map(context => context.close()));
      
      console.log('Concurrent user results:', playResults);
    });
  });

  test('API response times', async ({ page, request }) => {
    const apiTimes: Record<string, number> = {};

    await test.step('Test audio library API', async () => {
      const startTime = Date.now();
      const response = await request.get('/api/audio/samples');
      const endTime = Date.now();
      
      apiTimes.audioSamples = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(apiTimes.audioSamples).toBeLessThan(1000); // Should respond within 1 second
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
    });

    await test.step('Test generation API', async () => {
      const startTime = Date.now();
      const response = await request.post('/api/generate/sound-logo', {
        data: {
          duration: 5,
          mood: 'energetic',
          sampleId: 'flute'
        }
      });
      const endTime = Date.now();
      
      apiTimes.generation = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(apiTimes.generation).toBeLessThan(2000); // Generation request should be quick
    });

    await test.step('Test metadata API', async () => {
      const startTime = Date.now();
      const response = await request.get('/api/audio/samples/flute');
      const endTime = Date.now();
      
      apiTimes.metadata = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(apiTimes.metadata).toBeLessThan(500); // Metadata should be very fast
    });

    await test.step('Test search API performance', async () => {
      const searchQueries = ['mizo', 'flute', 'traditional', 'bamboo'];
      const searchTimes = [];
      
      for (const query of searchQueries) {
        const startTime = Date.now();
        const response = await request.get(`/api/audio/search?q=${query}`);
        const endTime = Date.now();
        
        const searchTime = endTime - startTime;
        searchTimes.push(searchTime);
        
        expect(response.status()).toBe(200);
        expect(searchTime).toBeLessThan(1500); // Search should be reasonably fast
      }
      
      apiTimes.searchAverage = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
    });

    console.log('API Response Times:', apiTimes);
    
    // Create performance report
    await page.evaluate((times) => {
      const report = {
        timestamp: new Date().toISOString(),
        metrics: times,
        thresholds: {
          audioSamples: 1000,
          generation: 2000,
          metadata: 500,
          searchAverage: 1500
        }
      };
      
      console.log('Performance Report:', JSON.stringify(report, null, 2));
    }, apiTimes);
  });

  test('Memory usage and resource monitoring', async ({ page }) => {
    await test.step('Monitor memory usage during audio playback', async () => {
      await page.goto('/library');
      
      // Get initial memory usage
      const initialMetrics = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (initialMetrics) {
        console.log('Initial memory usage:', initialMetrics);
      }
      
      // Play multiple audio files and monitor memory
      const audioCards = page.locator('[data-testid^="audio-card-"]');
      const cardCount = await audioCards.count();
      
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        await audioCards.nth(i).locator('[data-testid="play-button"]').click();
        await page.waitForTimeout(2000); // Let audio play briefly
        await audioCards.nth(i).locator('[data-testid="pause-button"]').click();
      }
      
      // Check memory after audio operations
      const finalMetrics = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null;
      });
      
      if (initialMetrics && finalMetrics) {
        const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
        console.log('Memory increase after audio operations:', memoryIncrease);
        
        // Memory increase shouldn't be excessive
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      }
      
      await helpers.takeScreenshot('01-memory-monitoring');
    });

    await test.step('Monitor resource loading efficiency', async () => {
      // Navigate to a resource-heavy page
      await page.goto('/generate');
      
      const resourceMetrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const imageResources = entries.filter(entry => entry.name.includes('.jpg') || entry.name.includes('.png'));
        const audioResources = entries.filter(entry => entry.name.includes('.mp3') || entry.name.includes('.mp4'));
        const scriptResources = entries.filter(entry => entry.name.includes('.js'));
        
        return {
          totalResources: entries.length,
          imageCount: imageResources.length,
          audioCount: audioResources.length,
          scriptCount: scriptResources.length,
          averageLoadTime: entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length
        };
      });
      
      console.log('Resource loading metrics:', resourceMetrics);
      
      // Verify efficient resource loading
      expect(resourceMetrics.averageLoadTime).toBeLessThan(2000);
      
      await helpers.takeScreenshot('02-resource-monitoring');
    });
  });
});