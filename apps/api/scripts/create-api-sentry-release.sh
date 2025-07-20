#!/bin/bash

# Sentry Release Script for Cultural Sound Lab API
# This script creates a Sentry release with source maps for the Express.js API

set -e

# Configuration
SENTRY_ORG="cultural-sound-lab"
SENTRY_PROJECT="express-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Creating Sentry release for Cultural Sound Lab API${NC}"

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

# Create version with API prefix
VERSION="api-$(sentry-cli releases propose-version)"
echo -e "${GREEN}📦 Creating API release: $VERSION${NC}"

# Create the release
sentry-cli releases new "$VERSION" --project "$SENTRY_PROJECT"

# Associate commits with the release
echo -e "${GREEN}📝 Setting commits for release${NC}"
sentry-cli releases set-commits "$VERSION" --auto --project "$SENTRY_PROJECT"

# Upload source maps if they exist
if [ -d "dist" ]; then
    echo -e "${GREEN}📤 Uploading source maps${NC}"
    sentry-cli releases files "$VERSION" upload-sourcemaps dist \
        --url-prefix "~/dist" \
        --project "$SENTRY_PROJECT" \
        --validate
else
    echo -e "${YELLOW}⚠️  No dist directory found. Skipping source map upload.${NC}"
fi

# Set deploy information
echo -e "${GREEN}🚢 Setting deploy information${NC}"
sentry-cli releases deploys "$VERSION" new -e production --project "$SENTRY_PROJECT"

# Finalize the release
echo -e "${GREEN}✅ Finalizing release${NC}"
sentry-cli releases finalize "$VERSION" --project "$SENTRY_PROJECT"

echo -e "${GREEN}🎉 Sentry API release $VERSION created successfully!${NC}"
echo -e "${GREEN}🔗 Check your release at: https://sentry.io/organizations/$SENTRY_ORG/releases/$VERSION/${NC}"