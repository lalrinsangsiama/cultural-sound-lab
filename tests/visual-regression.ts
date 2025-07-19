import { Page, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export interface VisualTestConfig {
  threshold: number
  mask?: Array<{ selector: string }>
  fullPage?: boolean
  animations?: 'disabled' | 'allow'
  clip?: { x: number; y: number; width: number; height: number }
}

export interface VisualTestResult {
  name: string
  passed: boolean
  diff?: {
    added: number
    removed: number
    modified: number
  }
  screenshotPath?: string
  diffPath?: string
}

export class VisualRegressionTester {
  private baselineDir: string
  private actualDir: string
  private diffDir: string
  private results: VisualTestResult[] = []

  constructor(testName: string = 'visual-regression') {
    const testResultsDir = path.join('test-results', testName)
    this.baselineDir = path.join(testResultsDir, 'baseline')
    this.actualDir = path.join(testResultsDir, 'actual')
    this.diffDir = path.join(testResultsDir, 'diff')

    // Ensure directories exist
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    for (const dir of [this.baselineDir, this.actualDir, this.diffDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  async captureScreenshot(
    page: Page,
    name: string,
    config: VisualTestConfig = { threshold: 0.2 }
  ): Promise<VisualTestResult> {
    const screenshotName = `${name}.png`
    const actualPath = path.join(this.actualDir, screenshotName)
    const baselinePath = path.join(this.baselineDir, screenshotName)
    const diffPath = path.join(this.diffDir, screenshotName)

    // Configure page for consistent screenshots
    await this.preparePageForScreenshot(page, config)

    // Take screenshot
    const screenshotOptions: any = {
      path: actualPath,
      fullPage: config.fullPage ?? true,
      animations: config.animations ?? 'disabled'
    }

    if (config.clip) {
      screenshotOptions.clip = config.clip
    }

    // Mask dynamic elements
    if (config.mask) {
      for (const mask of config.mask) {
        await page.locator(mask.selector).evaluate(el => {
          el.style.backgroundColor = '#FF0000'
          el.style.color = '#FF0000'
        })
      }
    }

    await page.screenshot(screenshotOptions)

    let result: VisualTestResult = {
      name,
      passed: true,
      screenshotPath: actualPath
    }

    // Compare with baseline if it exists
    if (fs.existsSync(baselinePath)) {
      try {
        await expect(page).toHaveScreenshot(screenshotName, {
          threshold: config.threshold,
          maxDiffPixels: 1000
        })
        result.passed = true
      } catch (error) {
        result.passed = false
        result.diffPath = diffPath
        console.log(`Visual regression detected for ${name}`)
      }
    } else {
      // First time - copy actual to baseline
      fs.copyFileSync(actualPath, baselinePath)
      console.log(`Created baseline for ${name}`)
    }

    this.results.push(result)
    return result
  }

  async testComponentStates(
    page: Page,
    component: string,
    states: Array<{ name: string; setup: () => Promise<void> }>,
    config?: VisualTestConfig
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = []

    for (const state of states) {
      await state.setup()
      await page.waitForTimeout(500) // Let animations settle
      
      const result = await this.captureScreenshot(
        page,
        `${component}-${state.name}`,
        config
      )
      results.push(result)
    }

    return results
  }

  async testResponsiveBreakpoints(
    page: Page,
    name: string,
    breakpoints: Array<{ name: string; width: number; height: number }> = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ],
    config?: VisualTestConfig
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = []

    for (const breakpoint of breakpoints) {
      await page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height
      })
      
      await page.waitForTimeout(500) // Let layout settle
      
      const result = await this.captureScreenshot(
        page,
        `${name}-${breakpoint.name}`,
        config
      )
      results.push(result)
    }

    return results
  }

  async testDarkModeToggle(
    page: Page,
    name: string,
    config?: VisualTestConfig
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = []

    // Test light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark')
    })
    await page.waitForTimeout(300)
    
    const lightResult = await this.captureScreenshot(
      page,
      `${name}-light`,
      config
    )
    results.push(lightResult)

    // Test dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })
    await page.waitForTimeout(300)
    
    const darkResult = await this.captureScreenshot(
      page,
      `${name}-dark`,
      config
    )
    results.push(darkResult)

    return results
  }

  async testAudioPlayerStates(page: Page): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = []

    // Navigate to audio library
    await page.goto('/dashboard/library')
    await page.waitForSelector('[data-testid="audio-player"]')

    const states = [
      {
        name: 'stopped',
        setup: async () => {
          // Ensure player is stopped
          const playButton = page.locator('[data-testid="play-button"]')
          if (await playButton.textContent() === 'Pause') {
            await playButton.click()
          }
        }
      },
      {
        name: 'playing',
        setup: async () => {
          await page.locator('[data-testid="play-button"]').click()
          await page.waitForTimeout(1000)
        }
      },
      {
        name: 'with-waveform',
        setup: async () => {
          await page.locator('[data-testid="waveform-toggle"]').click()
          await page.waitForTimeout(500)
        }
      },
      {
        name: 'volume-slider',
        setup: async () => {
          await page.locator('[data-testid="volume-button"]').click()
          await page.waitForTimeout(300)
        }
      }
    ]

    return await this.testComponentStates(page, 'audio-player', states, {
      threshold: 0.3,
      mask: [
        { selector: '[data-testid="current-time"]' },
        { selector: '[data-testid="progress-bar-fill"]' }
      ]
    })
  }

  async testGenerationFormStates(page: Page): Promise<VisualTestResult[]> {
    await page.goto('/dashboard/generate')
    await page.waitForSelector('[data-testid="generation-form"]')

    const states = [
      {
        name: 'initial',
        setup: async () => {
          // Form in initial state
        }
      },
      {
        name: 'sample-selected',
        setup: async () => {
          await page.locator('[data-testid="sample-card"]').first().click()
        }
      },
      {
        name: 'sound-logo-type',
        setup: async () => {
          await page.locator('[data-testid="generation-type-sound-logo"]').click()
        }
      },
      {
        name: 'parameters-expanded',
        setup: async () => {
          await page.locator('[data-testid="advanced-parameters"]').click()
        }
      },
      {
        name: 'form-filled',
        setup: async () => {
          await page.fill('[data-testid="duration-input"]', '5')
          await page.selectOption('[data-testid="mood-select"]', 'energetic')
        }
      }
    ]

    return await this.testComponentStates(page, 'generation-form', states, {
      threshold: 0.2,
      fullPage: true
    })
  }

  async testPaymentFlowStates(page: Page): Promise<VisualTestResult[]> {
    // This would need to be configured with test payment methods
    await page.goto('/dashboard/library')
    
    // Click on a sample to trigger licensing flow
    await page.locator('[data-testid="sample-card"]').first().click()
    await page.locator('[data-testid="license-button"]').click()

    const states = [
      {
        name: 'license-selection',
        setup: async () => {
          await page.waitForSelector('[data-testid="license-options"]')
        }
      },
      {
        name: 'license-selected',
        setup: async () => {
          await page.locator('[data-testid="license-commercial"]').click()
        }
      },
      {
        name: 'checkout-form',
        setup: async () => {
          await page.locator('[data-testid="proceed-to-checkout"]').click()
          await page.waitForSelector('[data-testid="payment-form"]')
        }
      }
    ]

    return await this.testComponentStates(page, 'payment-flow', states, {
      threshold: 0.2,
      mask: [
        { selector: '[data-testid="stripe-elements"]' } // Mask dynamic Stripe elements
      ]
    })
  }

  private async preparePageForScreenshot(page: Page, config: VisualTestConfig): Promise<void> {
    // Disable animations if requested
    if (config.animations === 'disabled') {
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      })
    }

    // Hide dynamic elements that change frequently
    await page.addStyleTag({
      content: `
        [data-dynamic="timestamp"],
        [data-dynamic="live-counter"],
        .cursor-blink {
          visibility: hidden !important;
        }
      `
    })

    // Ensure fonts are loaded
    await page.waitForFunction(() => document.fonts.ready)
    
    // Wait for any pending images
    await page.waitForFunction(() => {
      const images = Array.from(document.images)
      return images.every(img => img.complete)
    })
  }

  generateReport(): any {
    const totalTests = this.results.length
    const passedTests = this.results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    }
  }

  saveReport(filePath: string = 'test-results/visual-regression-report.json'): void {
    const report = this.generateReport()
    
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2))
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    const failedTests = this.results.filter(r => !r.passed)

    if (failedTests.length === 0) {
      recommendations.push('✅ All visual tests passed! UI is visually stable.')
    } else {
      recommendations.push(`⚠️ ${failedTests.length} visual regression(s) detected`)
      recommendations.push('Review diff images to determine if changes are intentional')
      recommendations.push('Update baselines if changes are approved')
    }

    recommendations.push('Consider adding more visual tests for new components')
    recommendations.push('Test visual changes across different browsers and devices')
    recommendations.push('Include visual testing in CI/CD pipeline')

    return recommendations
  }

  // Utility method to update baselines (when changes are approved)
  updateBaselines(): void {
    for (const result of this.results) {
      if (result.screenshotPath) {
        const baselineName = path.basename(result.screenshotPath)
        const baselinePath = path.join(this.baselineDir, baselineName)
        fs.copyFileSync(result.screenshotPath, baselinePath)
        console.log(`Updated baseline for ${result.name}`)
      }
    }
  }
}

export default VisualRegressionTester