#!/bin/bash

# GitHub Actions Self-Hosted Runner Setup for Cultural Sound Lab
# This script downloads and configures a self-hosted GitHub Actions runner

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 GitHub Actions Self-Hosted Runner Setup${NC}"
echo "=============================================="

# Detect platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

echo -e "${BLUE}📋 System Information:${NC}"
echo "   Platform: $PLATFORM"
echo "   Architecture: $ARCH"

# Determine the correct runner package
case "$PLATFORM" in
    "Darwin")
        if [ "$ARCH" = "arm64" ]; then
            RUNNER_URL="https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-osx-arm64-2.317.0.tar.gz"
            RUNNER_FILE="actions-runner-osx-arm64-2.317.0.tar.gz"
        else
            RUNNER_URL="https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-osx-x64-2.317.0.tar.gz"
            RUNNER_FILE="actions-runner-osx-x64-2.317.0.tar.gz"
        fi
        ;;
    "Linux")
        if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
            RUNNER_URL="https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-arm64-2.317.0.tar.gz"
            RUNNER_FILE="actions-runner-linux-arm64-2.317.0.tar.gz"
        else
            RUNNER_URL="https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-x64-2.317.0.tar.gz"
            RUNNER_FILE="actions-runner-linux-x64-2.317.0.tar.gz"
        fi
        ;;
    *)
        echo -e "${RED}❌ Unsupported platform: $PLATFORM${NC}"
        exit 1
        ;;
esac

echo -e "${YELLOW}📦 Downloading GitHub Actions runner...${NC}"
echo "   URL: $RUNNER_URL"

# Download the runner
if command -v wget &> /dev/null; then
    wget -O "$RUNNER_FILE" "$RUNNER_URL"
elif command -v curl &> /dev/null; then
    curl -L -o "$RUNNER_FILE" "$RUNNER_URL"
else
    echo -e "${RED}❌ Neither wget nor curl is available${NC}"
    exit 1
fi

# Verify download
if [ ! -f "$RUNNER_FILE" ]; then
    echo -e "${RED}❌ Failed to download runner package${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Download completed${NC}"

# Extract the installer
echo -e "${YELLOW}📦 Extracting runner package...${NC}"
tar xzf "$RUNNER_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Extraction completed${NC}"
    rm "$RUNNER_FILE"  # Clean up the downloaded file
else
    echo -e "${RED}❌ Extraction failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 GitHub Actions runner setup completed!${NC}"
echo
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Go to your GitHub repository settings:"
echo "   https://github.com/[your-username]/cultural-sound-lab/settings/actions/runners"
echo
echo "2. Click 'New self-hosted runner'"
echo
echo "3. Follow the configuration instructions to get your registration token"
echo
echo "4. Run the configuration command (example):"
echo "   ./config.sh --url https://github.com/[your-username]/cultural-sound-lab --token [TOKEN]"
echo
echo "5. Start the runner:"
echo "   ./run.sh"
echo
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "• Use --name to give your runner a custom name"
echo "• Use --labels to add custom labels for targeting workflows"
echo "• Consider running as a service for automatic startup"
echo
echo -e "${YELLOW}🔧 Available files:${NC}"
ls -la

echo
echo -e "${GREEN}📖 For more information, see:${NC}"
echo "   https://docs.github.com/en/actions/hosting-your-own-runners"