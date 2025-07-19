import { Page, expect, Locator } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async register(email: string, password: string, name: string) {
    await this.page.goto('/register');
    await this.page.fill('[data-testid="name-input"]', name);
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.fill('[data-testid="confirm-password-input"]', password);
    await this.page.click('[data-testid="register-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async waitForAudioLoad(audioElement: Locator) {
    await expect(audioElement).toBeVisible();
    await audioElement.evaluate((audio: HTMLAudioElement) => {
      if (audio.readyState >= 2) return Promise.resolve();
      return new Promise((resolve) => {
        audio.addEventListener('canplay', resolve, { once: true });
      });
    });
  }

  async playAudio(audioElement: Locator) {
    await this.waitForAudioLoad(audioElement);
    await audioElement.evaluate((audio: HTMLAudioElement) => audio.play());
    
    // Wait for audio to actually start playing
    await audioElement.evaluate((audio: HTMLAudioElement) => {
      return new Promise((resolve) => {
        const checkPlaying = () => {
          if (!audio.paused && audio.currentTime > 0) {
            resolve(true);
          } else {
            setTimeout(checkPlaying, 100);
          }
        };
        checkPlaying();
      });
    });
  }

  async stopAudio(audioElement: Locator) {
    await audioElement.evaluate((audio: HTMLAudioElement) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  async waitForGeneration(generationId: string, timeout: number = 60000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const status = await this.page.evaluate(async (id) => {
        const response = await fetch(`/api/generate/status/${id}`);
        return response.json();
      }, generationId);

      if (status.status === 'completed') {
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Generation failed: ${status.error}`);
      }

      await this.page.waitForTimeout(2000);
    }
    throw new Error('Generation timeout');
  }

  async fillPaymentForm(cardData: any) {
    await this.page.fill('[data-testid="card-number"]', cardData.number);
    await this.page.fill('[data-testid="card-expiry"]', cardData.expiry);
    await this.page.fill('[data-testid="card-cvc"]', cardData.cvc);
    await this.page.fill('[data-testid="card-name"]', cardData.name);
  }

  async checkAccessibility() {
    // Check for basic accessibility requirements
    const focusableElements = await this.page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').all();
    
    for (const element of focusableElements) {
      await element.focus();
      const focused = await this.page.evaluate(() => document.activeElement);
      expect(focused).toBeTruthy();
    }

    // Check for ARIA labels
    const interactiveElements = await this.page.locator('button, input, select, textarea').all();
    for (const element of interactiveElements) {
      const hasLabel = await element.evaluate((el) => {
        return el.hasAttribute('aria-label') || 
               el.hasAttribute('aria-labelledby') ||
               document.querySelector(`label[for="${el.id}"]`) !== null;
      });
      expect(hasLabel).toBeTruthy();
    }
  }

  async measurePerformance(actionName: string, action: () => Promise<void>) {
    const startTime = performance.now();
    await action();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${actionName} took ${duration.toFixed(2)}ms`);
    return duration;
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async mockAudioGeneration() {
    await this.page.route('/api/generate/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-generation-id',
            status: 'processing',
            estimatedTime: 30
          })
        });
      } else if (route.request().url().includes('/status/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-generation-id',
            status: 'completed',
            downloadUrl: '/demo-audio/track1-demo.mp3'
          })
        });
      }
    });
  }
}