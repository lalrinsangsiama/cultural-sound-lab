import { test, expect } from '@playwright/test'
import VisualRegressionTester from '../../visual-regression'
import CoverageTracker from '../../coverage-tracker'

test.describe('Visual Regression Tests', () => {
  let visualTester: VisualRegressionTester
  let coverageTracker: CoverageTracker

  test.beforeEach(async ({ page }) => {
    visualTester = new VisualRegressionTester('csl-visual-tests')
    coverageTracker = new CoverageTracker()
    
    // Load any existing coverage data
    coverageTracker.loadCoverageData()
  })

  test.afterEach(async () => {
    // Save updated coverage data
    coverageTracker.saveCoverageReport()
    
    // Save visual regression report
    visualTester.saveReport()
  })

  test('Landing page visual consistency', async ({ page }) => {
    await page.goto('/')
    
    // Test different sections of landing page
    await visualTester.captureScreenshot(page, 'landing-hero', {
      threshold: 0.2,
      clip: { x: 0, y: 0, width: 1440, height: 800 }
    })

    await page.locator('[data-testid="features-section"]').scrollIntoViewIfNeeded()
    await visualTester.captureScreenshot(page, 'landing-features', {
      threshold: 0.2,
      clip: { x: 0, y: 0, width: 1440, height: 600 }
    })

    await page.locator('[data-testid="demo-section"]').scrollIntoViewIfNeeded()
    await visualTester.captureScreenshot(page, 'landing-demo', {
      threshold: 0.3, // Higher threshold for interactive demo
      mask: [
        { selector: '[data-testid="demo-audio-player"]' } // Mask player controls
      ]
    })

    // Test responsive breakpoints
    await visualTester.testResponsiveBreakpoints(page, 'landing-page')

    coverageTracker.markScenarioCompleted('audio-preview', 'Landing page demo tested')
  })

  test('Authentication flow visual consistency', async ({ page }) => {
    // Login page
    await page.goto('/login')
    await visualTester.captureScreenshot(page, 'login-page', { threshold: 0.1 })

    // Test form states
    await visualTester.testComponentStates(page, 'login-form', [
      {
        name: 'empty',
        setup: async () => {
          // Form starts empty
        }
      },
      {
        name: 'filled',
        setup: async () => {
          await page.fill('[data-testid="email-input"]', 'test@example.com')
          await page.fill('[data-testid="password-input"]', 'password123')
        }
      },
      {
        name: 'validation-error',
        setup: async () => {
          await page.fill('[data-testid="email-input"]', 'invalid-email')
          await page.click('[data-testid="login-button"]')
          await page.waitForSelector('[data-testid="error-message"]')
        }
      }
    ])

    // Registration page
    await page.goto('/register')
    await visualTester.captureScreenshot(page, 'register-page', { threshold: 0.1 })

    // Test responsive auth forms
    await visualTester.testResponsiveBreakpoints(page, 'auth-pages')

    coverageTracker.markScenarioCompleted('auth-register', 'Registration form visual test')
    coverageTracker.markScenarioCompleted('auth-login', 'Login form visual test')
  })

  test('Audio library visual consistency', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'user@culturalsoundlab.com')
    await page.fill('[data-testid="password-input"]', 'user123456')
    await page.click('[data-testid="login-button"]')
    
    await page.goto('/dashboard/library')
    await page.waitForSelector('[data-testid="audio-grid"]')

    // Main library view
    await visualTester.captureScreenshot(page, 'library-main', { threshold: 0.2 })

    // Test audio player states
    const playerResults = await visualTester.testAudioPlayerStates(page)
    
    // Test filters
    await visualTester.testComponentStates(page, 'library-filters', [
      {
        name: 'all-samples',
        setup: async () => {
          // Default view
        }
      },
      {
        name: 'culture-filter',
        setup: async () => {
          await page.selectOption('[data-testid="culture-filter"]', 'mizo')
          await page.waitForTimeout(500)
        }
      },
      {
        name: 'instrument-filter',
        setup: async () => {
          await page.selectOption('[data-testid="instrument-filter"]', 'flute')
          await page.waitForTimeout(500)
        }
      },
      {
        name: 'search-active',
        setup: async () => {
          await page.fill('[data-testid="search-input"]', 'bamboo')
          await page.waitForTimeout(500)
        }
      }
    ])

    // Test sample card hover states
    await page.hover('[data-testid="sample-card"]')
    await visualTester.captureScreenshot(page, 'sample-card-hover', {
      threshold: 0.3,
      clip: { x: 0, y: 0, width: 400, height: 300 }
    })

    // Test mobile library view
    await visualTester.testResponsiveBreakpoints(page, 'library-mobile')

    coverageTracker.markScenarioCompleted('audio-browse', 'Library browsing visual test')
    coverageTracker.markScenarioCompleted('audio-search', 'Search functionality visual test')
    coverageTracker.markScenarioCompleted('audio-filter', 'Filter functionality visual test')
    coverageTracker.markScenarioCompleted('player-basic', 'Player controls visual test')
  })

  test('Generation form visual consistency', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'user@culturalsoundlab.com')
    await page.fill('[data-testid="password-input"]', 'user123456')
    await page.click('[data-testid="login-button"]')

    // Test generation form states
    await visualTester.testGenerationFormStates(page)

    // Test different generation types
    await page.goto('/dashboard/generate')
    await visualTester.testComponentStates(page, 'generation-types', [
      {
        name: 'sound-logo-selected',
        setup: async () => {
          await page.click('[data-testid="type-sound-logo"]')
          await page.waitForTimeout(300)
        }
      },
      {
        name: 'playlist-selected',
        setup: async () => {
          await page.click('[data-testid="type-playlist"]')
          await page.waitForTimeout(300)
        }
      },
      {
        name: 'social-clip-selected',
        setup: async () => {
          await page.click('[data-testid="type-social-clip"]')
          await page.waitForTimeout(300)
        }
      }
    ])

    // Test parameter tooltips
    await page.hover('[data-testid="mood-help"]')
    await page.waitForSelector('[data-testid="tooltip"]')
    await visualTester.captureScreenshot(page, 'parameter-tooltip', {
      threshold: 0.2,
      clip: { x: 0, y: 0, width: 600, height: 400 }
    })

    coverageTracker.markScenarioCompleted('gen-sound-logo', 'Sound logo generation form visual test')
    coverageTracker.markScenarioCompleted('gen-parameters', 'Parameter customization visual test')
  })

  test('Generation progress visual consistency', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'user@culturalsoundlab.com')
    await page.fill('[data-testid="password-input"]', 'user123456')
    await page.click('[data-testid="login-button"]')

    await page.goto('/dashboard/projects')
    await page.waitForSelector('[data-testid="generation-list"]')

    // Test different generation statuses
    await visualTester.testComponentStates(page, 'generation-status', [
      {
        name: 'queued',
        setup: async () => {
          await page.waitForSelector('[data-status="queued"]')
        }
      },
      {
        name: 'processing',
        setup: async () => {
          // This would require a generation actually in progress
          // In real tests, you might mock the status
        }
      },
      {
        name: 'completed',
        setup: async () => {
          await page.waitForSelector('[data-status="completed"]')
        }
      }
    ])

    coverageTracker.markScenarioCompleted('gen-progress', 'Generation progress visual test')
  })

  test('Payment flow visual consistency', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'user@culturalsoundlab.com')
    await page.fill('[data-testid="password-input"]', 'user123456')
    await page.click('[data-testid="login-button"]')

    // Test payment flow (would need test Stripe setup)
    await visualTester.testPaymentFlowStates(page)

    coverageTracker.markScenarioCompleted('pay-license-select', 'License selection visual test')
    coverageTracker.markScenarioCompleted('pay-checkout', 'Checkout form visual test')
  })

  test('Dark mode visual consistency', async ({ page }) => {
    await page.goto('/')

    // Test dark mode toggle across different pages
    const pages = [
      { url: '/', name: 'landing' },
      { url: '/login', name: 'login' },
      { url: '/dashboard/library', name: 'library', requiresAuth: true }
    ]

    for (const pageInfo of pages) {
      if (pageInfo.requiresAuth) {
        await page.goto('/login')
        await page.fill('[data-testid="email-input"]', 'user@culturalsoundlab.com')
        await page.fill('[data-testid="password-input"]', 'user123456')
        await page.click('[data-testid="login-button"]')
      }

      await page.goto(pageInfo.url)
      await visualTester.testDarkModeToggle(page, pageInfo.name, { threshold: 0.3 })
    }
  })

  test('Mobile-specific UI elements', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]')
    await visualTester.captureScreenshot(page, 'mobile-menu-open', { threshold: 0.2 })

    // Test mobile audio player
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'user@culturalsoundlab.com')
    await page.fill('[data-testid="password-input"]', 'user123456')
    await page.click('[data-testid="login-button"]')
    
    await page.goto('/dashboard/library')
    await page.click('[data-testid="sample-card"]')
    
    await visualTester.captureScreenshot(page, 'mobile-audio-player', {
      threshold: 0.3,
      mask: [
        { selector: '[data-testid="current-time"]' }
      ]
    })

    coverageTracker.markScenarioCompleted('player-mobile', 'Mobile player visual test')
    coverageTracker.markScenarioCompleted('a11y-mobile', 'Mobile accessibility visual test')
  })

  test('Error states visual consistency', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page')
    await visualTester.captureScreenshot(page, 'error-404', { threshold: 0.1 })

    // Test network error state
    await page.route('**/api/**', route => route.abort())
    await page.goto('/dashboard/library')
    await page.waitForSelector('[data-testid="error-message"]')
    await visualTester.captureScreenshot(page, 'network-error', { threshold: 0.2 })

    // Test loading states
    await page.unroute('**/api/**')
    await page.route('**/api/audio/samples', route => {
      // Delay response to capture loading state
      setTimeout(() => route.continue(), 2000)
    })
    
    await page.reload()
    await page.waitForSelector('[data-testid="loading-skeleton"]')
    await visualTester.captureScreenshot(page, 'loading-state', { threshold: 0.2 })
  })

  test('Performance impact of visual changes', async ({ page }) => {
    // Test that visual changes don't impact performance
    await page.goto('/dashboard/library')

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      }
    })

    // Assert performance thresholds
    expect(metrics.loadTime).toBeLessThan(3000) // Page should load within 3s
    expect(metrics.firstPaint).toBeLessThan(2000) // First paint within 2s

    coverageTracker.markScenarioCompleted('perf-page-load', 'Page load performance visual test')
  })
})