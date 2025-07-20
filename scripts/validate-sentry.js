#!/usr/bin/env node

/**
 * Script to validate Sentry configuration
 * Usage: node scripts/validate-sentry.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile(filePath, envVars) {
  if (!fs.existsSync(filePath)) {
    log(`  ⚠️  File not found: ${filePath}`, 'yellow');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const foundVars = {};
  let allValid = true;

  // Parse env file
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        foundVars[key.trim()] = value.trim();
      }
    }
  });

  // Check required variables
  envVars.forEach(varName => {
    const value = foundVars[varName];
    if (!value) {
      log(`  ❌ ${varName}: Not configured`, 'red');
      allValid = false;
    } else if (value.includes('your-') || value.includes('placeholder')) {
      log(`  ⚠️  ${varName}: Still using placeholder value (${value})`, 'yellow');
      allValid = false;
    } else if (!value.includes('ingest.sentry.io') && !value.includes('@sentry.io')) {
      log(`  ⚠️  ${varName}: Invalid format - should contain 'ingest.sentry.io' or '@sentry.io'`, 'yellow');
      allValid = false;
    } else {
      log(`  ✅ ${varName}: Configured`, 'green');
    }
  });

  return allValid;
}

function validateSentryConfig() {
  log('\n🔍 Validating Sentry Configuration\n', 'blue');

  const configs = [
    {
      name: 'Web Application (Development)',
      file: path.join(__dirname, '../apps/web/.env.local'),
      vars: ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN'],
    },
    {
      name: 'Web Application (Production)',
      file: path.join(__dirname, '../apps/web/.env.production'),
      vars: ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN'],
    },
    {
      name: 'API Backend (Development)',
      file: path.join(__dirname, '../apps/api/.env'),
      vars: ['SENTRY_DSN'],
    },
    {
      name: 'API Backend (Production)',
      file: path.join(__dirname, '../apps/api/.env.production'),
      vars: ['SENTRY_DSN'],
    },
  ];

  let allValid = true;

  configs.forEach(config => {
    log(`Checking ${config.name}:`, 'blue');
    const isValid = checkEnvFile(config.file, config.vars);
    if (!isValid) {
      allValid = false;
    }
    console.log('');
  });

  // Summary
  log('Summary:', 'blue');
  if (allValid) {
    log('✅ All Sentry configurations are properly set!', 'green');
  } else {
    log('❌ Some Sentry configurations need attention', 'red');
    log('\nNext steps:', 'yellow');
    log('1. Sign up for Sentry at https://sentry.io', 'yellow');
    log('2. Create projects for your web app and API', 'yellow');
    log('3. Get the DSN from: Settings → Projects → Your Project → Client Keys', 'yellow');
    log('4. Update the environment files with your actual DSN values', 'yellow');
    log('5. See SENTRY_CONFIGURATION_GUIDE.md for detailed instructions', 'yellow');
  }

  // Check if Sentry packages are installed
  log('\nChecking Sentry packages:', 'blue');
  
  const webPackageJson = path.join(__dirname, '../apps/web/package.json');
  const apiPackageJson = path.join(__dirname, '../apps/api/package.json');

  if (fs.existsSync(webPackageJson)) {
    const webPkg = JSON.parse(fs.readFileSync(webPackageJson, 'utf8'));
    if (webPkg.dependencies && webPkg.dependencies['@sentry/nextjs']) {
      log('✅ @sentry/nextjs is installed in web app', 'green');
    } else {
      log('❌ @sentry/nextjs is not installed in web app', 'red');
    }
  }

  if (fs.existsSync(apiPackageJson)) {
    const apiPkg = JSON.parse(fs.readFileSync(apiPackageJson, 'utf8'));
    if (apiPkg.dependencies && apiPkg.dependencies['@sentry/node']) {
      log('✅ @sentry/node is installed in API', 'green');
    } else {
      log('❌ @sentry/node is not installed in API', 'red');
    }
  }

  process.exit(allValid ? 0 : 1);
}

// Run validation
validateSentryConfig();