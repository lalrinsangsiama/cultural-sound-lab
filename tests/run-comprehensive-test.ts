#!/usr/bin/env ts-node

import ComprehensiveTestReporter from './comprehensive-test-reporter'

async function main() {
  console.log('🚀 Running comprehensive test analysis...')
  
  const reporter = new ComprehensiveTestReporter()
  await reporter.generateComprehensiveReport()
  
  console.log('✅ Comprehensive test report generated successfully!')
  console.log('📋 Open test-results/comprehensive-report.html to view the full report')
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Failed to generate comprehensive report:', error)
    process.exit(1)
  })
}

export default main