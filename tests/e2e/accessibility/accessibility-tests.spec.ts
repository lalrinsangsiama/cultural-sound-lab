import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/helpers';
import { testUsers } from '../utils/test-data';

test.describe('Accessibility Tests', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.existingUser.email, testUsers.existingUser.password);
  });

  test('Keyboard navigation', async ({ page }) => {
    await test.step('Navigate to library and test tab order', async () => {
      await page.goto('/library');
      await page.waitForLoadState('networkidle');
      
      // Start from the first focusable element
      await page.keyboard.press('Tab');
      
      // Track focus order
      const focusOrder = [];
      for (let i = 0; i < 20; i++) {
        const focusedElement = await page.evaluate(() => {
          const element = document.activeElement;
          return element ? {
            tagName: element.tagName,
            id: element.id,
            className: element.className,
            ariaLabel: element.getAttribute('aria-label'),
            testId: element.getAttribute('data-testid')
          } : null;
        });
        
        if (focusedElement) {
          focusOrder.push(focusedElement);
        }
        
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      
      // Verify logical tab order
      expect(focusOrder.length).toBeGreaterThan(10);
      
      // Check that interactive elements are focusable
      const hasPlayButtons = focusOrder.some(el => 
        el.testId?.includes('play-button') || 
        el.ariaLabel?.includes('Play')
      );
      expect(hasPlayButtons).toBeTruthy();
      
      console.log('Focus order:', focusOrder.slice(0, 10));
      await helpers.takeScreenshot('01-keyboard-navigation');
    });

    await test.step('Test audio player keyboard controls', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      
      // Focus on play button using keyboard
      await audioCard.locator('[data-testid="play-button"]').focus();
      
      // Verify focus is visible
      const hasFocusRing = await audioCard.locator('[data-testid="play-button"]').evaluate((el) => {
        const styles = window.getComputedStyle(el, ':focus');
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });
      expect(hasFocusRing).toBeTruthy();
      
      // Start playback with Space key
      await page.keyboard.press('Space');
      await page.waitForTimeout(1000);
      
      // Verify audio is playing
      const audioElement = audioCard.locator('audio');
      const isPlaying = await audioElement.evaluate((audio: HTMLAudioElement) => !audio.paused);
      expect(isPlaying).toBeTruthy();
      
      // Test keyboard shortcuts for audio control
      await page.keyboard.press('k'); // Common keyboard shortcut for play/pause
      await page.waitForTimeout(500);
      
      await helpers.takeScreenshot('02-audio-keyboard-controls');
    });

    await test.step('Test form navigation with keyboard', async () => {
      await page.goto('/generate');
      
      // Navigate form using Tab
      await page.keyboard.press('Tab'); // Focus on generation type
      await page.keyboard.press('Space'); // Select sound logo
      
      await page.keyboard.press('Tab'); // Move to duration input
      await page.keyboard.type('7');
      
      await page.keyboard.press('Tab'); // Move to mood select
      await page.keyboard.press('ArrowDown'); // Change selection
      await page.keyboard.press('ArrowDown');
      
      await page.keyboard.press('Tab'); // Move to sample selection
      await page.keyboard.press('Space'); // Select sample
      
      // Verify form can be submitted with keyboard
      await page.keyboard.press('Tab'); // Move to generate button
      
      const generateButton = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(generateButton).toBe('generate-button');
      
      await helpers.takeScreenshot('03-form-keyboard-navigation');
    });

    await test.step('Test escape key functionality', async () => {
      // Open a modal
      await page.goto('/library');
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      // If there's a modal, test escape key
      const modal = page.locator('[data-testid="audio-detail-modal"]');
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
      
      await helpers.takeScreenshot('04-escape-key-functionality');
    });
  });

  test('Screen reader compatibility', async ({ page }) => {
    await test.step('Test ARIA labels and roles', async () => {
      await page.goto('/library');
      
      // Check for proper ARIA labels on interactive elements
      const audioCards = page.locator('[data-testid^="audio-card-"]');
      const firstCard = audioCards.first();
      
      // Verify audio card has proper ARIA attributes
      const cardRole = await firstCard.getAttribute('role');
      const cardLabel = await firstCard.getAttribute('aria-label');
      
      expect(cardRole || cardLabel).toBeTruthy(); // Should have either role or label
      
      // Check play button accessibility
      const playButton = firstCard.locator('[data-testid="play-button"]');
      const playButtonLabel = await playButton.getAttribute('aria-label');
      expect(playButtonLabel).toContain('Play');
      
      await helpers.takeScreenshot('01-aria-labels');
    });

    await test.step('Test audio player screen reader support', async () => {
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      
      // Check for audio description
      const audioTitle = await audioCard.locator('[data-testid="audio-title"]').textContent();
      expect(audioTitle).toBeTruthy();
      
      // Verify duration is announced
      const duration = await audioCard.locator('[data-testid="audio-duration"]').textContent();
      expect(duration).toMatch(/\d+:\d+/); // Format like "2:30"
      
      // Check for progress indication
      await audioCard.locator('[data-testid="play-button"]').click();
      
      const progressBar = audioCard.locator('[data-testid="progress-bar"]');
      if (await progressBar.isVisible()) {
        const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
        const ariaValueMax = await progressBar.getAttribute('aria-valuemax');
        
        expect(ariaValueNow).toBeTruthy();
        expect(ariaValueMax).toBeTruthy();
      }
      
      await helpers.takeScreenshot('02-audio-player-accessibility');
    });

    await test.step('Test live region announcements', async () => {
      await page.goto('/generate');
      
      // Check for live region for status updates
      const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
      const liveRegionCount = await liveRegion.count();
      expect(liveRegionCount).toBeGreaterThan(0);
      
      // Start generation to test live announcements
      await helpers.mockAudioGeneration();
      
      await page.click('[data-testid="generation-type-sound-logo"]');
      await page.fill('[data-testid="duration-input"]', '5');
      await page.click('[data-testid="generate-button"]');
      
      // Check that status updates are announced
      await page.waitForSelector('[data-testid="generation-progress"]');
      
      const statusText = await page.locator('[data-testid="generation-status"]').textContent();
      expect(statusText).toBeTruthy();
      
      await helpers.takeScreenshot('03-live-regions');
    });

    await test.step('Test form error announcements', async () => {
      await page.goto('/generate');
      
      // Submit form with invalid data
      await page.click('[data-testid="generate-button"]');
      
      // Check for error announcements
      const errorMessages = page.locator('[role="alert"], [aria-live="assertive"]');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        const errorText = await errorMessages.first().textContent();
        expect(errorText).toBeTruthy();
      }
      
      await helpers.takeScreenshot('04-error-announcements');
    });
  });

  test('Color contrast compliance', async ({ page }) => {
    await test.step('Test text contrast ratios', async () => {
      await page.goto('/');
      
      // Helper function to calculate contrast ratio
      const checkContrast = async (selector: string) => {
        return await page.locator(selector).evaluate((element) => {
          const styles = window.getComputedStyle(element);
          const backgroundColor = styles.backgroundColor;
          const color = styles.color;
          
          // Convert colors to RGB values
          const parseRGB = (colorStr: string) => {
            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
          };
          
          const bg = parseRGB(backgroundColor);
          const fg = parseRGB(color);
          
          // Calculate relative luminance
          const getLuminance = (rgb: number[]) => {
            const [r, g, b] = rgb.map(c => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          
          const bgLum = getLuminance(bg);
          const fgLum = getLuminance(fg);
          
          // Calculate contrast ratio
          const ratio = (Math.max(bgLum, fgLum) + 0.05) / (Math.min(bgLum, fgLum) + 0.05);
          
          return {
            ratio,
            backgroundColor,
            color,
            wcagAA: ratio >= 4.5,
            wcagAAA: ratio >= 7
          };
        });
      };
      
      // Test various text elements
      const textElements = [
        'h1',
        'h2', 
        'p',
        'button',
        '[data-testid="nav-link"]',
        '[data-testid="audio-title"]'
      ];
      
      const contrastResults = [];
      
      for (const selector of textElements) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          const contrast = await checkContrast(selector);
          contrastResults.push({ selector, ...contrast });
          
          // All text should meet WCAG AA standards (4.5:1)
          expect(contrast.wcagAA).toBeTruthy();
        }
      }
      
      console.log('Contrast test results:', contrastResults);
      await helpers.takeScreenshot('01-contrast-testing');
    });

    await test.step('Test button and interactive element contrast', async () => {
      await page.goto('/library');
      
      const interactiveElements = [
        '[data-testid="play-button"]',
        '[data-testid="filter-button"]',
        '[data-testid="search-input"]',
        'select'
      ];
      
      for (const selector of interactiveElements) {
        const element = page.locator(selector).first();
        
        if (await element.count() > 0) {
          // Test normal state
          const normalContrast = await element.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              borderColor: styles.borderColor
            };
          });
          
          // Test focus state
          await element.focus();
          const focusContrast = await element.evaluate((el) => {
            const styles = window.getComputedStyle(el, ':focus');
            return {
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              outline: styles.outline,
              boxShadow: styles.boxShadow
            };
          });
          
          // Focus indicators should be visible
          expect(
            focusContrast.outline !== 'none' || 
            focusContrast.boxShadow !== 'none' ||
            focusContrast.backgroundColor !== normalContrast.backgroundColor
          ).toBeTruthy();
        }
      }
      
      await helpers.takeScreenshot('02-interactive-contrast');
    });

    await test.step('Test dark mode contrast (if available)', async () => {
      // Check if dark mode toggle exists
      const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
      
      if (await darkModeToggle.count() > 0) {
        await darkModeToggle.click();
        await page.waitForTimeout(500);
        
        // Re-test key elements in dark mode
        const darkModeElements = ['h1', 'p', 'button'];
        
        for (const selector of darkModeElements) {
          const element = page.locator(selector).first();
          
          if (await element.count() > 0) {
            const contrast = await element.evaluate((el) => {
              const styles = window.getComputedStyle(el);
              return {
                backgroundColor: styles.backgroundColor,
                color: styles.color
              };
            });
            
            // Verify dark mode has appropriate contrast
            expect(contrast.color).not.toBe(contrast.backgroundColor);
          }
        }
        
        await helpers.takeScreenshot('03-dark-mode-contrast');
      }
    });
  });

  test('Focus indicators', async ({ page }) => {
    await test.step('Test visible focus indicators on all interactive elements', async () => {
      await page.goto('/library');
      
      const interactiveSelectors = [
        'button',
        'input',
        'select',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[data-testid="play-button"]',
        '[data-testid="audio-card"]'
      ];
      
      for (const selector of interactiveSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          const element = elements.first();
          
          // Focus the element
          await element.focus();
          
          // Check for visible focus indicator
          const focusStyles = await element.evaluate((el) => {
            const styles = window.getComputedStyle(el, ':focus');
            return {
              outline: styles.outline,
              outlineWidth: styles.outlineWidth,
              outlineStyle: styles.outlineStyle,
              outlineColor: styles.outlineColor,
              boxShadow: styles.boxShadow,
              backgroundColor: styles.backgroundColor,
              borderColor: styles.borderColor
            };
          });
          
          // Should have some form of focus indicator
          const hasFocusIndicator = 
            focusStyles.outline !== 'none' ||
            focusStyles.boxShadow !== 'none' ||
            focusStyles.outlineWidth !== '0px';
          
          expect(hasFocusIndicator).toBeTruthy();
          
          console.log(`Focus styles for ${selector}:`, focusStyles);
        }
      }
      
      await helpers.takeScreenshot('01-focus-indicators');
    });

    await test.step('Test focus management in modals', async () => {
      // Open audio detail modal if available
      const audioCard = page.locator('[data-testid="audio-card-flute"]').first();
      await audioCard.click();
      
      const modal = page.locator('[data-testid="audio-detail-modal"]');
      
      if (await modal.isVisible()) {
        // Focus should be trapped within modal
        await page.keyboard.press('Tab');
        
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.getAttribute('data-testid') || 
                 document.activeElement?.tagName;
        });
        
        // Focus should be within the modal
        const isModalElement = await modal.evaluate((modalEl, focused) => {
          return modalEl.contains(document.activeElement);
        }, focusedElement);
        
        expect(isModalElement).toBeTruthy();
        
        // Test escape to close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
        
        // Focus should return to trigger element
        const returnedFocus = await page.evaluate(() => {
          return document.activeElement?.getAttribute('data-testid');
        });
        
        expect(returnedFocus).toContain('audio-card');
      }
      
      await helpers.takeScreenshot('02-modal-focus-management');
    });

    await test.step('Test skip links', async () => {
      await page.goto('/');
      
      // Look for skip links
      const skipLink = page.locator('[data-testid="skip-to-main"], a[href="#main"]').first();
      
      if (await skipLink.count() > 0) {
        // Focus skip link (usually hidden until focused)
        await skipLink.focus();
        
        // Verify skip link is visible when focused
        const isVisible = await skipLink.isVisible();
        expect(isVisible).toBeTruthy();
        
        // Test skip link functionality
        await skipLink.click();
        
        const mainContent = page.locator('#main, [data-testid="main-content"]');
        if (await mainContent.count() > 0) {
          const mainIsFocused = await mainContent.evaluate((el) => {
            return document.activeElement === el || el.contains(document.activeElement);
          });
          
          expect(mainIsFocused).toBeTruthy();
        }
      }
      
      await helpers.takeScreenshot('03-skip-links');
    });
  });

  test('ARIA labels and semantic structure', async ({ page }) => {
    await test.step('Test heading hierarchy', async () => {
      await page.goto('/');
      
      // Get all headings
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          level: parseInt(h.tagName.charAt(1)),
          text: h.textContent?.trim(),
          id: h.id
        }));
      });
      
      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Check logical hierarchy (no skipped levels)
      for (let i = 1; i < headings.length; i++) {
        const current = headings[i];
        const previous = headings[i - 1];
        
        if (current.level > previous.level) {
          expect(current.level - previous.level).toBeLessThanOrEqual(1);
        }
      }
      
      console.log('Heading structure:', headings);
      await helpers.takeScreenshot('01-heading-hierarchy');
    });

    await test.step('Test landmark regions', async () => {
      await page.goto('/library');
      
      // Check for proper landmark regions
      const landmarks = await page.evaluate(() => {
        const landmarkSelectors = [
          'header, [role="banner"]',
          'nav, [role="navigation"]', 
          'main, [role="main"]',
          'aside, [role="complementary"]',
          'footer, [role="contentinfo"]'
        ];
        
        return landmarkSelectors.map(selector => ({
          selector,
          count: document.querySelectorAll(selector).length
        }));
      });
      
      // Should have main landmark
      const mainLandmark = landmarks.find(l => l.selector.includes('main'));
      expect(mainLandmark?.count).toBeGreaterThan(0);
      
      // Should have navigation
      const navLandmark = landmarks.find(l => l.selector.includes('nav'));
      expect(navLandmark?.count).toBeGreaterThan(0);
      
      console.log('Landmark regions:', landmarks);
      await helpers.takeScreenshot('02-landmark-regions');
    });

    await test.step('Test form labels and descriptions', async () => {
      await page.goto('/generate');
      
      // Check all form inputs have proper labels
      const formInputs = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, textarea');
        return Array.from(inputs).map(input => {
          const id = input.id;
          const label = document.querySelector(`label[for="${id}"]`);
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const ariaDescribedBy = input.getAttribute('aria-describedby');
          
          return {
            id,
            type: input.type || input.tagName,
            hasLabel: !!label,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledBy: !!ariaLabelledBy,
            hasAriaDescribedBy: !!ariaDescribedBy,
            labelText: label?.textContent || ariaLabel
          };
        });
      });
      
      // All inputs should have some form of label
      formInputs.forEach(input => {
        expect(
          input.hasLabel || 
          input.hasAriaLabel || 
          input.hasAriaLabelledBy
        ).toBeTruthy();
      });
      
      console.log('Form input accessibility:', formInputs);
      await helpers.takeScreenshot('03-form-labels');
    });

    await test.step('Test list structure and table headers', async () => {
      // Check for proper list markup
      const lists = await page.evaluate(() => {
        const listElements = document.querySelectorAll('ul, ol, dl');
        return Array.from(listElements).map(list => ({
          type: list.tagName,
          itemCount: list.children.length,
          hasProperItems: Array.from(list.children).every(child => 
            child.tagName === 'LI' || 
            (list.tagName === 'DL' && (child.tagName === 'DT' || child.tagName === 'DD'))
          )
        }));
      });
      
      // Verify proper list structure
      lists.forEach(list => {
        expect(list.hasProperItems).toBeTruthy();
      });
      
      // Check tables if any exist
      const tables = await page.evaluate(() => {
        const tableElements = document.querySelectorAll('table');
        return Array.from(tableElements).map(table => {
          const hasCaption = !!table.querySelector('caption');
          const hasHeaderCells = !!table.querySelector('th');
          const hasScope = Array.from(table.querySelectorAll('th')).some(th => 
            th.hasAttribute('scope')
          );
          
          return {
            hasCaption,
            hasHeaderCells,
            hasScope
          };
        });
      });
      
      // Tables should have proper headers
      tables.forEach(table => {
        expect(table.hasHeaderCells).toBeTruthy();
      });
      
      console.log('List structure:', lists);
      console.log('Table structure:', tables);
      await helpers.takeScreenshot('04-semantic-structure');
    });
  });

  test('High contrast and reduced motion support', async ({ page }) => {
    await test.step('Test prefers-reduced-motion compliance', async () => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      
      // Check that animations are disabled or reduced
      const animationInfo = await page.evaluate(() => {
        const animatedElements = document.querySelectorAll('*');
        const hasAnimations = Array.from(animatedElements).some(el => {
          const styles = window.getComputedStyle(el);
          return styles.animationDuration !== '0s' && styles.animationDuration !== '';
        });
        
        const hasTransitions = Array.from(animatedElements).some(el => {
          const styles = window.getComputedStyle(el);
          return styles.transitionDuration !== '0s' && styles.transitionDuration !== '';
        });
        
        return { hasAnimations, hasTransitions };
      });
      
      // With reduced motion, animations should be minimal
      console.log('Animation status with reduced motion:', animationInfo);
      
      await helpers.takeScreenshot('01-reduced-motion');
    });

    await test.step('Test forced-colors mode support', async () => {
      // Test high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto('/library');
      
      // Check that important elements are still visible
      const visibilityCheck = await page.evaluate(() => {
        const checkElement = (selector: string) => {
          const el = document.querySelector(selector);
          if (!el) return { exists: false };
          
          const styles = window.getComputedStyle(el);
          return {
            exists: true,
            visible: styles.display !== 'none' && styles.visibility !== 'hidden',
            color: styles.color,
            backgroundColor: styles.backgroundColor
          };
        };
        
        return {
          playButton: checkElement('[data-testid="play-button"]'),
          audioTitle: checkElement('[data-testid="audio-title"]'),
          navigation: checkElement('nav')
        };
      });
      
      // Important elements should remain visible in forced colors mode
      expect(visibilityCheck.playButton.visible).toBeTruthy();
      expect(visibilityCheck.audioTitle.visible).toBeTruthy();
      
      console.log('Forced colors visibility:', visibilityCheck);
      await helpers.takeScreenshot('02-forced-colors');
    });

    await test.step('Test zoom and scaling support', async () => {
      // Test 200% zoom
      await page.setViewportSize({ width: 640, height: 480 }); // Simulate 200% zoom
      await page.goto('/library');
      
      // Check that content is still accessible
      const zoomAccessibility = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasHorizontalScroll = scrollWidth > clientWidth;
        
        const audioCards = document.querySelectorAll('[data-testid^="audio-card-"]');
        const cardsVisible = audioCards.length > 0;
        
        return {
          hasHorizontalScroll,
          cardsVisible,
          viewportWidth: window.innerWidth
        };
      });
      
      // Should not require horizontal scrolling at 200% zoom
      expect(zoomAccessibility.hasHorizontalScroll).toBeFalsy();
      expect(zoomAccessibility.cardsVisible).toBeTruthy();
      
      console.log('Zoom accessibility:', zoomAccessibility);
      await helpers.takeScreenshot('03-zoom-support');
    });
  });
});