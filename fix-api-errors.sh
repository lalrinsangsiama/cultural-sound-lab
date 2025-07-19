#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fixing API Sentry errors...${NC}"

# Navigate to API directory
cd apps/api

echo -e "\n${GREEN}1. Updating Sentry packages to latest versions...${NC}"
npm install @sentry/node@latest @sentry/profiling-node@latest @sentry/tracing@latest

echo -e "\n${GREEN}2. Fixing import statements in sentry.ts...${NC}"
# Create a backup first
cp src/config/sentry.ts src/config/sentry.ts.backup

# Fix the imports using sed
cat > src/config/sentry.ts << 'EOF'
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
    
    console.log('Sentry initialized successfully');
  }
};

export { Sentry };
EOF

echo -e "\n${GREEN}3. Running TypeScript compilation check...${NC}"
npx tsc --noEmit

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ API compiles successfully without errors!${NC}"
    rm -f src/config/sentry.ts.backup
else
    echo -e "\n${RED}✗ Compilation failed. Restoring backup...${NC}"
    mv src/config/sentry.ts.backup src/config/sentry.ts
    exit 1
fi

echo -e "\n${GREEN}4. Running linter...${NC}"
npm run lint

echo -e "\n${GREEN}✓ All fixes applied successfully!${NC}"
echo -e "${YELLOW}Note: Remember to commit these changes.${NC}"