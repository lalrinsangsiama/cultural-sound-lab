#!/bin/bash

# Sentry Release Script for Cultural Sound Lab Web App
# This script creates a Sentry release with source maps

set -e

# Configuration
SENTRY_ORG="cultural-sound-lab"
SENTRY_PROJECT="javascript-nextjs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Creating Sentry release for Cultural Sound Lab Web App${NC}"

# Check if Sentry CLI is installed
if ! command -v sentry-cli &> /dev/null; then
    echo -e "${RED}❌ Sentry CLI not found. Installing...${NC}"
    curl -sL https://sentry.io/get-cli/ | bash
fi

# Check required environment variables
if [ -z "$SENTRY_AUTH_TOKEN" ]; then
    echo -e "${RED}❌ SENTRY_AUTH_TOKEN environment variable is required${NC}"
    exit 1
fi

# Create version
VERSION=$(sentry-cli releases propose-version)
echo -e "${GREEN}📦 Creating release: $VERSION${NC}"

# Create the release
sentry-cli releases new "$VERSION" --project "$SENTRY_PROJECT"

# Associate commits with the release
echo -e "${GREEN}📝 Setting commits for release${NC}"
sentry-cli releases set-commits "$VERSION" --auto --project "$SENTRY_PROJECT"

# Upload source maps
if [ -d ".next/static" ]; then
    echo -e "${GREEN}📤 Uploading source maps${NC}"
    sentry-cli releases files "$VERSION" upload-sourcemaps .next/static \
        --url-prefix "~/_next/static" \
        --project "$SENTRY_PROJECT" \
        --validate
else
    echo -e "${YELLOW}⚠️  No .next/static directory found. Skipping source map upload.${NC}"
fi

# Set deploy information
echo -e "${GREEN}🚢 Setting deploy information${NC}"
sentry-cli releases deploys "$VERSION" new -e production --project "$SENTRY_PROJECT"

# Finalize the release
echo -e "${GREEN}✅ Finalizing release${NC}"
sentry-cli releases finalize "$VERSION" --project "$SENTRY_PROJECT"

echo -e "${GREEN}🎉 Sentry release $VERSION created successfully!${NC}"
echo -e "${GREEN}🔗 Check your release at: https://sentry.io/organizations/$SENTRY_ORG/releases/$VERSION/${NC}"