import * as fs from 'fs'
import * as path from 'path'
import CoverageTracker from './coverage-tracker'
import VisualRegressionTester from './visual-regression'

export interface TestMetrics {
  unit: {
    total: number
    passed: number
    failed: number
    coverage: number
  }
  integration: {
    total: number
    passed: number
    failed: number
    apiEndpoints: number
  }
  e2e: {
    total: number
    passed: number
    failed: number
    scenarios: number
  }
  visual: {
    total: number
    passed: number
    failed: number
    regressions: number
  }
  performance: {
    pageLoad: number
    apiResponse: number
    audioStreaming: number
    generation: number
  }
  accessibility: {
    violations: number
    warnings: number
    compliance: boolean
  }
}

export class ComprehensiveTestReporter {
  private reportDir: string
  private timestamp: string

  constructor(reportDir: string = 'test-results') {
    this.reportDir = reportDir
    this.timestamp = new Date().toISOString()
    this.ensureReportDirectory()
  }

  private ensureReportDirectory(): void {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true })
    }
  }

  async generateComprehensiveReport(): Promise<void> {
    console.log('📊 Generating comprehensive test report...')

    const metrics = await this.collectAllMetrics()
    const summary = this.generateSummary(metrics)
    
    // Generate multiple report formats
    await Promise.all([
      this.generateHTMLReport(metrics, summary),
      this.generateJSONReport(metrics, summary),
      this.generateMarkdownReport(metrics, summary),
      this.generateExecutiveSummary(metrics, summary),
      this.generateCIReport(metrics, summary)
    ])

    console.log('✅ Comprehensive reports generated:')
    console.log(`   📄 ${this.reportDir}/comprehensive-report.html`)
    console.log(`   📄 ${this.reportDir}/comprehensive-report.json`)
    console.log(`   📄 ${this.reportDir}/comprehensive-report.md`)
    console.log(`   📄 ${this.reportDir}/executive-summary.md`)
    console.log(`   📄 ${this.reportDir}/ci-report.json`)
  }

  private async collectAllMetrics(): Promise<TestMetrics> {
    const metrics: TestMetrics = {
      unit: await this.collectUnitTestMetrics(),
      integration: await this.collectIntegrationTestMetrics(),
      e2e: await this.collectE2ETestMetrics(),
      visual: await this.collectVisualTestMetrics(),
      performance: await this.collectPerformanceMetrics(),
      accessibility: await this.collectAccessibilityMetrics()
    }

    return metrics
  }

  private async collectUnitTestMetrics(): Promise<TestMetrics['unit']> {
    try {
      // Web app unit tests (Vitest)
      const webCoverageFile = path.join('apps/web/coverage/coverage-summary.json')
      const webCoverage = fs.existsSync(webCoverageFile) 
        ? JSON.parse(fs.readFileSync(webCoverageFile, 'utf8'))
        : null

      // API unit tests (Jest)
      const apiCoverageFile = path.join('apps/api/coverage/coverage-summary.json')
      const apiCoverage = fs.existsSync(apiCoverageFile)
        ? JSON.parse(fs.readFileSync(apiCoverageFile, 'utf8'))
        : null

      const webTotal = webCoverage?.total?.statements?.total || 0
      const webPassed = webCoverage?.total?.statements?.covered || 0
      const apiTotal = apiCoverage?.total?.statements?.total || 0
      const apiPassed = apiCoverage?.total?.statements?.covered || 0

      return {
        total: webTotal + apiTotal,
        passed: webPassed + apiPassed,
        failed: (webTotal - webPassed) + (apiTotal - apiPassed),
        coverage: (webTotal + apiTotal) > 0 
          ? Math.round(((webPassed + apiPassed) / (webTotal + apiTotal)) * 100)
          : 0
      }
    } catch (error) {
      console.warn('Could not collect unit test metrics:', error)
      return { total: 0, passed: 0, failed: 0, coverage: 0 }
    }
  }

  private async collectIntegrationTestMetrics(): Promise<TestMetrics['integration']> {
    try {
      const resultsFile = path.join(this.reportDir, 'jest-results.json')
      if (fs.existsSync(resultsFile)) {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
        return {
          total: results.numTotalTests || 0,
          passed: results.numPassedTests || 0,
          failed: results.numFailedTests || 0,
          apiEndpoints: results.numPassedTests || 0 // Assuming each test covers an endpoint
        }
      }
    } catch (error) {
      console.warn('Could not collect integration test metrics:', error)
    }
    return { total: 0, passed: 0, failed: 0, apiEndpoints: 0 }
  }

  private async collectE2ETestMetrics(): Promise<TestMetrics['e2e']> {
    try {
      const resultsFile = path.join(this.reportDir, 'csl-test-results.json')
      if (fs.existsSync(resultsFile)) {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
        const summary = results.summary || {}
        return {
          total: summary.totalTests || 0,
          passed: summary.passed || 0,
          failed: summary.failed || 0,
          scenarios: summary.coverage?.userJourneys + summary.coverage?.audioFeatures + summary.coverage?.paymentFlows || 0
        }
      }
    } catch (error) {
      console.warn('Could not collect E2E test metrics:', error)
    }
    return { total: 0, passed: 0, failed: 0, scenarios: 0 }
  }

  private async collectVisualTestMetrics(): Promise<TestMetrics['visual']> {
    try {
      const resultsFile = path.join(this.reportDir, 'visual-regression-report.json')
      if (fs.existsSync(resultsFile)) {
        const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
        const summary = results.summary || {}
        return {
          total: summary.total || 0,
          passed: summary.passed || 0,
          failed: summary.failed || 0,
          regressions: summary.failed || 0
        }
      }
    } catch (error) {
      console.warn('Could not collect visual test metrics:', error)
    }
    return { total: 0, passed: 0, failed: 0, regressions: 0 }
  }

  private async collectPerformanceMetrics(): Promise<TestMetrics['performance']> {
    try {
      const perfFile = path.join(this.reportDir, 'performance-report.json')
      if (fs.existsSync(perfFile)) {
        const perf = JSON.parse(fs.readFileSync(perfFile, 'utf8'))
        return {
          pageLoad: perf.metrics?.pageLoad || 0,
          apiResponse: perf.metrics?.apiResponse || 0,
          audioStreaming: perf.metrics?.audioStreaming || 0,
          generation: perf.metrics?.generation || 0
        }
      }
    } catch (error) {
      console.warn('Could not collect performance metrics:', error)
    }
    return { pageLoad: 0, apiResponse: 0, audioStreaming: 0, generation: 0 }
  }

  private async collectAccessibilityMetrics(): Promise<TestMetrics['accessibility']> {
    try {
      const a11yFile = path.join(this.reportDir, 'accessibility-report.json')
      if (fs.existsSync(a11yFile)) {
        const a11y = JSON.parse(fs.readFileSync(a11yFile, 'utf8'))
        return {
          violations: a11y.violations || 0,
          warnings: a11y.warnings || 0,
          compliance: a11y.compliance?.wcagAA || false
        }
      }
    } catch (error) {
      console.warn('Could not collect accessibility metrics:', error)
    }
    return { violations: 0, warnings: 0, compliance: false }
  }

  private generateSummary(metrics: TestMetrics): any {
    const totalTests = metrics.unit.total + metrics.integration.total + metrics.e2e.total + metrics.visual.total
    const totalPassed = metrics.unit.passed + metrics.integration.passed + metrics.e2e.passed + metrics.visual.passed
    const totalFailed = metrics.unit.failed + metrics.integration.failed + metrics.e2e.failed + metrics.visual.failed

    return {
      overall: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
      },
      quality: {
        codeCoverage: metrics.unit.coverage,
        apiCoverage: metrics.integration.apiEndpoints,
        userJourneyCoverage: metrics.e2e.scenarios,
        visualStability: metrics.visual.regressions === 0,
        performanceCompliance: this.assessPerformanceCompliance(metrics.performance),
        accessibilityCompliance: metrics.accessibility.compliance
      },
      recommendations: this.generateRecommendations(metrics)
    }
  }

  private assessPerformanceCompliance(perf: TestMetrics['performance']): boolean {
    return perf.pageLoad < 3000 && 
           perf.apiResponse < 1000 && 
           perf.audioStreaming < 2000 && 
           perf.generation < 30000
  }

  private generateRecommendations(metrics: TestMetrics): string[] {
    const recommendations: string[] = []

    // Overall quality assessment
    const overallSuccess = (metrics.unit.passed + metrics.integration.passed + metrics.e2e.passed + metrics.visual.passed) / 
                          (metrics.unit.total + metrics.integration.total + metrics.e2e.total + metrics.visual.total)

    if (overallSuccess < 0.8) {
      recommendations.push('🚨 Critical: Overall test success rate below 80%. Address failing tests immediately.')
    } else if (overallSuccess < 0.95) {
      recommendations.push('⚠️ Warning: Test success rate could be improved. Focus on fixing failing tests.')
    } else {
      recommendations.push('✅ Excellent: High test success rate. Continue maintaining quality standards.')
    }

    // Specific area recommendations
    if (metrics.unit.coverage < 80) {
      recommendations.push(`🔴 Unit test coverage (${metrics.unit.coverage}%) needs improvement. Target 80%+`)
    }

    if (metrics.visual.regressions > 0) {
      recommendations.push(`🎨 ${metrics.visual.regressions} visual regressions detected. Review and update baselines if intentional.`)
    }

    if (metrics.accessibility.violations > 0) {
      recommendations.push(`♿ ${metrics.accessibility.violations} accessibility violations found. Ensure WCAG compliance.`)
    }

    if (metrics.performance.pageLoad > 3000) {
      recommendations.push('⚡ Page load performance is slow. Optimize assets and code splitting.')
    }

    // Growth recommendations
    recommendations.push('📈 Consider adding more edge case tests')
    recommendations.push('🔄 Integrate all tests into CI/CD pipeline')
    recommendations.push('📱 Expand mobile testing coverage')
    recommendations.push('🌍 Add internationalization testing')

    return recommendations
  }

  private async generateHTMLReport(metrics: TestMetrics, summary: any): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cultural Sound Lab - Comprehensive Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #333; background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 40px; border-radius: 15px; margin-bottom: 30px;
            text-align: center;
        }
        .header h1 { font-size: 3em; margin-bottom: 15px; }
        .header .subtitle { font-size: 1.2em; opacity: 0.9; }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px; margin-bottom: 30px;
        }
        .metric-card {
            background: white; padding: 25px; border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }
        .metric-card:hover { transform: translateY(-5px); }
        .metric-header { display: flex; align-items: center; margin-bottom: 15px; }
        .metric-icon { font-size: 2em; margin-right: 15px; }
        .metric-title { font-size: 1.1em; font-weight: 600; color: #555; }
        .metric-value { font-size: 2.5em; font-weight: bold; color: #667eea; margin-bottom: 10px; }
        .metric-subtitle { color: #888; font-size: 0.9em; }
        .progress-bar {
            background: #e9ecef; border-radius: 10px; height: 8px; margin: 10px 0; overflow: hidden;
        }
        .progress-fill {
            background: linear-gradient(90deg, #28a745, #20c997); height: 100%;
            transition: width 0.3s ease; border-radius: 10px;
        }
        .section {
            background: white; padding: 30px; border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 25px;
        }
        .section h2 { 
            color: #333; margin-bottom: 20px; font-size: 1.8em;
            border-bottom: 3px solid #667eea; padding-bottom: 10px;
        }
        .recommendations { list-style: none; }
        .recommendations li {
            padding: 12px 0; border-bottom: 1px solid #eee;
            display: flex; align-items: center;
        }
        .recommendations li:last-child { border-bottom: none; }
        .status-excellent { color: #28a745; }
        .status-good { color: #20c997; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .chart-container { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .badge { 
            padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: 600;
            display: inline-block; margin: 2px;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .footer {
            text-align: center; padding: 30px; color: #666;
            border-top: 1px solid #eee; margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Cultural Sound Lab</h1>
            <div class="subtitle">Comprehensive Test Report</div>
            <p style="margin-top: 15px; opacity: 0.8;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">🧪</div>
                    <div class="metric-title">Overall Success</div>
                </div>
                <div class="metric-value ${summary.overall.successRate >= 95 ? 'status-excellent' : summary.overall.successRate >= 80 ? 'status-good' : 'status-warning'}">${summary.overall.successRate}%</div>
                <div class="metric-subtitle">${summary.overall.passed}/${summary.overall.total} tests passed</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${summary.overall.successRate}%"></div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">📊</div>
                    <div class="metric-title">Code Coverage</div>
                </div>
                <div class="metric-value ${summary.quality.codeCoverage >= 80 ? 'status-excellent' : summary.quality.codeCoverage >= 60 ? 'status-good' : 'status-warning'}">${summary.quality.codeCoverage}%</div>
                <div class="metric-subtitle">Unit test coverage</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${summary.quality.codeCoverage}%"></div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">🎨</div>
                    <div class="metric-title">Visual Stability</div>
                </div>
                <div class="metric-value ${metrics.visual.regressions === 0 ? 'status-excellent' : 'status-warning'}">${metrics.visual.regressions}</div>
                <div class="metric-subtitle">Regressions detected</div>
            </div>

            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">♿</div>
                    <div class="metric-title">Accessibility</div>
                </div>
                <div class="metric-value ${metrics.accessibility.violations === 0 ? 'status-excellent' : 'status-warning'}">${metrics.accessibility.violations}</div>
                <div class="metric-subtitle">WCAG violations</div>
            </div>
        </div>

        <div class="section">
            <h2>📈 Test Breakdown</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Type</th>
                        <th>Total</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Success Rate</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>🔬 Unit Tests</td>
                        <td>${metrics.unit.total}</td>
                        <td>${metrics.unit.passed}</td>
                        <td>${metrics.unit.failed}</td>
                        <td>${metrics.unit.total > 0 ? Math.round((metrics.unit.passed / metrics.unit.total) * 100) : 0}%</td>
                        <td><span class="badge ${metrics.unit.failed === 0 ? 'badge-success' : 'badge-warning'}">${metrics.unit.failed === 0 ? 'PASSING' : 'ISSUES'}</span></td>
                    </tr>
                    <tr>
                        <td>🔗 Integration Tests</td>
                        <td>${metrics.integration.total}</td>
                        <td>${metrics.integration.passed}</td>
                        <td>${metrics.integration.failed}</td>
                        <td>${metrics.integration.total > 0 ? Math.round((metrics.integration.passed / metrics.integration.total) * 100) : 0}%</td>
                        <td><span class="badge ${metrics.integration.failed === 0 ? 'badge-success' : 'badge-warning'}">${metrics.integration.failed === 0 ? 'PASSING' : 'ISSUES'}</span></td>
                    </tr>
                    <tr>
                        <td>🌐 E2E Tests</td>
                        <td>${metrics.e2e.total}</td>
                        <td>${metrics.e2e.passed}</td>
                        <td>${metrics.e2e.failed}</td>
                        <td>${metrics.e2e.total > 0 ? Math.round((metrics.e2e.passed / metrics.e2e.total) * 100) : 0}%</td>
                        <td><span class="badge ${metrics.e2e.failed === 0 ? 'badge-success' : 'badge-warning'}">${metrics.e2e.failed === 0 ? 'PASSING' : 'ISSUES'}</span></td>
                    </tr>
                    <tr>
                        <td>🎨 Visual Tests</td>
                        <td>${metrics.visual.total}</td>
                        <td>${metrics.visual.passed}</td>
                        <td>${metrics.visual.failed}</td>
                        <td>${metrics.visual.total > 0 ? Math.round((metrics.visual.passed / metrics.visual.total) * 100) : 0}%</td>
                        <td><span class="badge ${metrics.visual.failed === 0 ? 'badge-success' : 'badge-warning'}">${metrics.visual.failed === 0 ? 'STABLE' : 'REGRESSIONS'}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🎯 Recommendations</h2>
            <ul class="recommendations">
                ${summary.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            <p>🎵 Cultural Sound Lab Testing Infrastructure</p>
            <p>Report generated automatically on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`

    fs.writeFileSync(path.join(this.reportDir, 'comprehensive-report.html'), html)
  }

  private async generateJSONReport(metrics: TestMetrics, summary: any): Promise<void> {
    const report = {
      timestamp: this.timestamp,
      summary,
      metrics,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }

    fs.writeFileSync(
      path.join(this.reportDir, 'comprehensive-report.json'),
      JSON.stringify(report, null, 2)
    )
  }

  private async generateMarkdownReport(metrics: TestMetrics, summary: any): Promise<void> {
    const markdown = `# Cultural Sound Lab - Comprehensive Test Report

Generated: ${new Date().toLocaleString()}

## Executive Summary

- **Overall Success Rate**: ${summary.overall.successRate}% (${summary.overall.passed}/${summary.overall.total} tests)
- **Code Coverage**: ${summary.quality.codeCoverage}%
- **Visual Regressions**: ${metrics.visual.regressions}
- **Accessibility Violations**: ${metrics.accessibility.violations}

## Test Results Breakdown

### 🔬 Unit Tests
- **Total**: ${metrics.unit.total}
- **Passed**: ${metrics.unit.passed}
- **Failed**: ${metrics.unit.failed}
- **Coverage**: ${metrics.unit.coverage}%

### 🔗 Integration Tests
- **Total**: ${metrics.integration.total}
- **Passed**: ${metrics.integration.passed}
- **Failed**: ${metrics.integration.failed}
- **API Endpoints Tested**: ${metrics.integration.apiEndpoints}

### 🌐 End-to-End Tests
- **Total**: ${metrics.e2e.total}
- **Passed**: ${metrics.e2e.passed}
- **Failed**: ${metrics.e2e.failed}
- **User Scenarios Covered**: ${metrics.e2e.scenarios}

### 🎨 Visual Regression Tests
- **Total**: ${metrics.visual.total}
- **Passed**: ${metrics.visual.passed}
- **Failed**: ${metrics.visual.failed}
- **Regressions**: ${metrics.visual.regressions}

## Performance Metrics

- **Page Load**: ${metrics.performance.pageLoad}ms
- **API Response**: ${metrics.performance.apiResponse}ms
- **Audio Streaming**: ${metrics.performance.audioStreaming}ms
- **AI Generation**: ${metrics.performance.generation}ms

## Accessibility Compliance

- **Violations**: ${metrics.accessibility.violations}
- **Warnings**: ${metrics.accessibility.warnings}
- **WCAG AA Compliant**: ${metrics.accessibility.compliance ? '✅ Yes' : '❌ No'}

## Recommendations

${summary.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

---

*Report generated automatically by CSL Testing Infrastructure*`

    fs.writeFileSync(path.join(this.reportDir, 'comprehensive-report.md'), markdown)
  }

  private async generateExecutiveSummary(metrics: TestMetrics, summary: any): Promise<void> {
    const execSummary = `# Cultural Sound Lab - Test Executive Summary

**Date**: ${new Date().toLocaleDateString()}  
**Overall Health**: ${summary.overall.successRate >= 95 ? '🟢 Excellent' : summary.overall.successRate >= 80 ? '🟡 Good' : '🔴 Needs Attention'}

## Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Overall Test Success | ${summary.overall.successRate}% | ${summary.overall.successRate >= 95 ? '🟢' : summary.overall.successRate >= 80 ? '🟡' : '🔴'} |
| Code Coverage | ${summary.quality.codeCoverage}% | ${summary.quality.codeCoverage >= 80 ? '🟢' : summary.quality.codeCoverage >= 60 ? '🟡' : '🔴'} |
| Visual Stability | ${metrics.visual.regressions} regressions | ${metrics.visual.regressions === 0 ? '🟢' : '🔴'} |
| Accessibility | ${metrics.accessibility.violations} violations | ${metrics.accessibility.violations === 0 ? '🟢' : '🔴'} |

## Quality Assessment

${summary.quality.codeCoverage >= 80 ? '✅' : '❌'} **Code Coverage**: ${summary.quality.codeCoverage >= 80 ? 'Meets standards' : 'Below target (80%)'}  
${summary.quality.visualStability ? '✅' : '❌'} **Visual Stability**: ${summary.quality.visualStability ? 'No regressions' : 'Regressions detected'}  
${summary.quality.performanceCompliance ? '✅' : '❌'} **Performance**: ${summary.quality.performanceCompliance ? 'Meets targets' : 'Performance issues detected'}  
${summary.quality.accessibilityCompliance ? '✅' : '❌'} **Accessibility**: ${summary.quality.accessibilityCompliance ? 'WCAG AA compliant' : 'Compliance issues'}

## Action Items

${summary.recommendations.slice(0, 5).map((rec: string, i: number) => `${i + 1}. ${rec.replace(/[🚨⚠️✅🔴🟡📈🔄📱🌍♿⚡🎨]/g, '').trim()}`).join('\n')}

## Next Review Date

**Recommended**: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} (1 week)

---
*Auto-generated summary for stakeholder review*`

    fs.writeFileSync(path.join(this.reportDir, 'executive-summary.md'), execSummary)
  }

  private async generateCIReport(metrics: TestMetrics, summary: any): Promise<void> {
    const ciReport = {
      status: summary.overall.successRate >= 95 ? 'success' : summary.overall.successRate >= 80 ? 'warning' : 'failure',
      summary: {
        total_tests: summary.overall.total,
        passed_tests: summary.overall.passed,
        failed_tests: summary.overall.failed,
        success_rate: summary.overall.successRate,
        code_coverage: summary.quality.codecoverage
      },
      quality_gates: {
        unit_tests: metrics.unit.failed === 0,
        integration_tests: metrics.integration.failed === 0,
        e2e_tests: metrics.e2e.failed === 0,
        visual_stability: metrics.visual.regressions === 0,
        code_coverage: summary.quality.codeoverage >= 80,
        accessibility: metrics.accessibility.violations === 0,
        performance: summary.quality.performanceCompliance
      },
      blocking_issues: summary.recommendations.filter((rec: string) => rec.includes('🚨')),
      timestamp: this.timestamp
    }

    fs.writeFileSync(path.join(this.reportDir, 'ci-report.json'), JSON.stringify(ciReport, null, 2))
  }
}

export default ComprehensiveTestReporter