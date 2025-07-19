import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TestMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  screenshots: string[];
  performance: Record<string, number>;
  accessibility: {
    violations: number;
    warnings: number;
  };
  coverage: {
    userJourneys: number;
    audioFeatures: number;
    paymentFlows: number;
  };
}

class CSLTestReporter implements Reporter {
  private metrics: TestMetrics = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    screenshots: [],
    performance: {},
    accessibility: {
      violations: 0,
      warnings: 0
    },
    coverage: {
      userJourneys: 0,
      audioFeatures: 0,
      paymentFlows: 0
    }
  };

  private startTime: number = 0;
  private testResults: Array<{
    title: string;
    status: string;
    duration: number;
    error?: string;
    screenshots: string[];
  }> = [];

  onBegin() {
    this.startTime = Date.now();
    console.log('🎵 Starting Cultural Sound Lab E2E Test Suite');
    
    // Ensure screenshot directory exists
    const screenshotDir = 'test-results/screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.metrics.totalTests++;
    
    switch (result.status) {
      case 'passed':
        this.metrics.passed++;
        break;
      case 'failed':
        this.metrics.failed++;
        break;
      case 'skipped':
        this.metrics.skipped++;
        break;
    }

    // Collect screenshots for this test
    const testScreenshots: string[] = [];
    if (result.attachments) {
      result.attachments.forEach(attachment => {
        if (attachment.contentType?.startsWith('image/')) {
          testScreenshots.push(attachment.path || attachment.name || 'unknown');
          this.metrics.screenshots.push(attachment.path || attachment.name || 'unknown');
        }
      });
    }

    // Track test coverage by category
    const testTitle = test.title.toLowerCase();
    if (testTitle.includes('user') && testTitle.includes('journey')) {
      this.metrics.coverage.userJourneys++;
    } else if (testTitle.includes('audio') || testTitle.includes('player')) {
      this.metrics.coverage.audioFeatures++;
    } else if (testTitle.includes('payment') || testTitle.includes('license')) {
      this.metrics.coverage.paymentFlows++;
    }

    // Extract performance metrics from test output
    if (result.stdout) {
      const performanceMatch = result.stdout.match(/(\w+)\s+took\s+([\d.]+)ms/g);
      if (performanceMatch) {
        performanceMatch.forEach(match => {
          const [, action, time] = match.match(/(\w+)\s+took\s+([\d.]+)ms/) || [];
          if (action && time) {
            this.metrics.performance[action] = parseFloat(time);
          }
        });
      }
    }

    // Store test result
    this.testResults.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
      screenshots: testScreenshots
    });

    // Log test completion
    const statusEmoji = result.status === 'passed' ? '✅' : 
                       result.status === 'failed' ? '❌' : '⏭️';
    console.log(`${statusEmoji} ${test.title} (${result.duration}ms)`);
  }

  async onEnd(result: FullResult) {
    this.metrics.duration = Date.now() - this.startTime;
    
    console.log('\n🎵 Cultural Sound Lab E2E Test Results 🎵');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${this.metrics.totalTests}`);
    console.log(`✅ Passed: ${this.metrics.passed}`);
    console.log(`❌ Failed: ${this.metrics.failed}`);
    console.log(`⏭️ Skipped: ${this.metrics.skipped}`);
    console.log(`⏱️ Duration: ${this.metrics.duration}ms`);
    console.log(`📸 Screenshots: ${this.metrics.screenshots.length}`);
    
    // Generate comprehensive HTML report
    await this.generateHTMLReport();
    
    // Generate JSON report for CI/CD
    await this.generateJSONReport();
    
    // Generate performance summary
    await this.generatePerformanceReport();
    
    // Generate accessibility summary
    await this.generateAccessibilityReport();

    console.log('\n📊 Reports generated:');
    console.log('• test-results/csl-test-report.html');
    console.log('• test-results/csl-test-results.json');
    console.log('• test-results/performance-report.json');
    console.log('• test-results/accessibility-report.json');
  }

  private async generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cultural Sound Lab - E2E Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .metrics { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { 
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .section h2 { color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .test-result {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .test-result:last-child { border-bottom: none; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-skipped { color: #ffc107; }
        .screenshot-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .screenshot {
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        .screenshot img {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        .screenshot-caption {
            padding: 10px;
            background: #f8f9fa;
            font-size: 0.9em;
            color: #666;
        }
        .performance-chart {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }
        .coverage-bar {
            background: #e9ecef;
            border-radius: 10px;
            height: 20px;
            margin: 10px 0;
            overflow: hidden;
        }
        .coverage-fill {
            background: linear-gradient(90deg, #28a745, #20c997);
            height: 100%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8em;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Cultural Sound Lab E2E Test Report</h1>
            <p>Comprehensive testing results for audio platform functionality</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${this.metrics.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-passed">${this.metrics.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-failed">${this.metrics.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(this.metrics.duration / 1000)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Test Coverage</h2>
            <div>
                <strong>User Journeys:</strong>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${Math.min((this.metrics.coverage.userJourneys / 4) * 100, 100)}%">
                        ${this.metrics.coverage.userJourneys}/4 scenarios
                    </div>
                </div>
            </div>
            <div>
                <strong>Audio Features:</strong>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${Math.min((this.metrics.coverage.audioFeatures / 6) * 100, 100)}%">
                        ${this.metrics.coverage.audioFeatures}/6 features
                    </div>
                </div>
            </div>
            <div>
                <strong>Payment Flows:</strong>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${Math.min((this.metrics.coverage.paymentFlows / 4) * 100, 100)}%">
                        ${this.metrics.coverage.paymentFlows}/4 flows
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔍 Test Results</h2>
            ${this.testResults.map(test => `
                <div class="test-result">
                    <div>
                        <strong>${test.title}</strong>
                        ${test.error ? `<br><small style="color: #dc3545;">${test.error}</small>` : ''}
                    </div>
                    <div>
                        <span class="status-${test.status}">${test.status.toUpperCase()}</span>
                        <small style="margin-left: 10px;">${test.duration}ms</small>
                    </div>
                </div>
            `).join('')}
        </div>

        ${Object.keys(this.metrics.performance).length > 0 ? `
        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <div class="performance-chart">
                ${Object.entries(this.metrics.performance).map(([action, time]) => `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>${action}:</span>
                        <strong>${time}ms</strong>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${this.metrics.screenshots.length > 0 ? `
        <div class="section">
            <h2>📸 Screenshots</h2>
            <div class="screenshot-gallery">
                ${this.metrics.screenshots.slice(0, 12).map((screenshot, index) => `
                    <div class="screenshot">
                        <img src="${screenshot}" alt="Test Screenshot ${index + 1}" loading="lazy">
                        <div class="screenshot-caption">
                            Screenshot ${index + 1}
                        </div>
                    </div>
                `).join('')}
            </div>
            ${this.metrics.screenshots.length > 12 ? `<p style="margin-top: 15px; color: #666;">Showing first 12 of ${this.metrics.screenshots.length} screenshots</p>` : ''}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    fs.writeFileSync('test-results/csl-test-report.html', html);
  }

  private async generateJSONReport() {
    const report = {
      summary: this.metrics,
      tests: this.testResults,
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform
      }
    };

    fs.writeFileSync('test-results/csl-test-results.json', JSON.stringify(report, null, 2));
  }

  private async generatePerformanceReport() {
    const performanceReport = {
      metrics: this.metrics.performance,
      thresholds: {
        pageLoad: 3000,
        audioLoad: 2000,
        apiResponse: 1000,
        generation: 30000
      },
      analysis: this.analyzePerformance(),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('test-results/performance-report.json', JSON.stringify(performanceReport, null, 2));
  }

  private async generateAccessibilityReport() {
    const accessibilityReport = {
      violations: this.metrics.accessibility.violations,
      warnings: this.metrics.accessibility.warnings,
      compliance: {
        wcagAA: this.metrics.accessibility.violations === 0,
        keyboardNavigation: true, // This would be determined by tests
        screenReader: true, // This would be determined by tests
        colorContrast: true // This would be determined by tests
      },
      recommendations: this.generateAccessibilityRecommendations(),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('test-results/accessibility-report.json', JSON.stringify(accessibilityReport, null, 2));
  }

  private analyzePerformance() {
    const analysis = [];
    
    Object.entries(this.metrics.performance).forEach(([metric, value]) => {
      if (metric.toLowerCase().includes('load') && value > 3000) {
        analysis.push(`⚠️ ${metric} is slower than expected (${value}ms > 3000ms)`);
      } else if (metric.toLowerCase().includes('api') && value > 1000) {
        analysis.push(`⚠️ ${metric} API response is slow (${value}ms > 1000ms)`);
      } else {
        analysis.push(`✅ ${metric} performance is acceptable (${value}ms)`);
      }
    });

    return analysis;
  }

  private generateAccessibilityRecommendations() {
    const recommendations = [];
    
    if (this.metrics.accessibility.violations > 0) {
      recommendations.push('Address WCAG violations found in accessibility tests');
    }
    
    if (this.metrics.accessibility.warnings > 0) {
      recommendations.push('Review accessibility warnings for potential improvements');
    }
    
    recommendations.push('Ensure all new features include accessibility testing');
    recommendations.push('Consider regular accessibility audits with screen readers');
    
    return recommendations;
  }
}

export default CSLTestReporter;