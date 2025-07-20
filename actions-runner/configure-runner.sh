#!/bin/bash

# GitHub Actions Runner Configuration Helper
# This script helps configure the runner with appropriate settings for Cultural Sound Lab

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 GitHub Actions Runner Configuration${NC}"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "./config.sh" ]; then
    echo -e "${RED}❌ Error: config.sh not found. Make sure you're in the actions-runner directory.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Configuration Steps:${NC}"
echo
echo "1. Go to your GitHub repository:"
echo "   https://github.com/[your-username]/cultural-sound-lab/settings/actions/runners"
echo
echo "2. Click 'New self-hosted runner'"
echo
echo "3. Copy the registration token from the GitHub page"
echo

# Get repository URL
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/cultural-sound-lab): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required${NC}"
    exit 1
fi

# Get registration token
read -p "Enter the registration token from GitHub: " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Registration token is required${NC}"
    exit 1
fi

# Get runner name (optional)
read -p "Enter a name for this runner (optional, default: csl-runner-$(hostname)): " RUNNER_NAME

if [ -z "$RUNNER_NAME" ]; then
    RUNNER_NAME="csl-runner-$(hostname)"
fi

# Configure labels for this runner
LABELS="self-hosted,macOS,backup,database"
if [ "$(uname -s)" = "Linux" ]; then
    LABELS="self-hosted,Linux,backup,database"
fi

echo -e "\n${YELLOW}🔧 Configuring runner with:${NC}"
echo "   Repository: $REPO_URL"
echo "   Name: $RUNNER_NAME"
echo "   Labels: $LABELS"
echo

# Run the configuration
echo -e "${YELLOW}⏳ Running configuration...${NC}"
./config.sh \
    --url "$REPO_URL" \
    --token "$TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$LABELS" \
    --work "_work" \
    --replace

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Runner configured successfully!${NC}"
    echo
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "1. Start the runner:"
    echo "   ./run.sh"
    echo
    echo "2. Or install as a service (recommended for production):"
    if [ "$(uname -s)" = "Darwin" ]; then
        echo "   sudo ./svc.sh install"
        echo "   sudo ./svc.sh start"
    else
        echo "   sudo ./svc.sh install"
        echo "   sudo ./svc.sh start"
    fi
    echo
    echo "3. Check runner status on GitHub:"
    echo "   $REPO_URL/settings/actions/runners"
    echo
    echo -e "${GREEN}🎉 Your self-hosted runner is ready to run Cultural Sound Lab backups!${NC}"
else
    echo -e "${RED}❌ Configuration failed${NC}"
    exit 1
fi