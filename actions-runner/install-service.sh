#!/bin/bash

# GitHub Actions Runner Service Installation Script
# This script installs the GitHub Actions runner as a system service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 GitHub Actions Runner Service Installation${NC}"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "./config.sh" ]; then
    echo -e "${RED}❌ Error: config.sh not found. Make sure you're in the actions-runner directory.${NC}"
    exit 1
fi

# Check if runner is configured
if [ ! -f ".runner" ]; then
    echo -e "${RED}❌ Error: Runner not configured. Run ./configure-runner.sh first.${NC}"
    exit 1
fi

# Check platform
PLATFORM=$(uname -s)

echo -e "${BLUE}📋 Platform: $PLATFORM${NC}"

case "$PLATFORM" in
    "Darwin")
        echo -e "${YELLOW}🍎 Installing macOS LaunchDaemon service...${NC}"
        
        # Check if service script exists
        if [ ! -f "./svc.sh" ]; then
            echo -e "${RED}❌ Error: svc.sh not found.${NC}"
            exit 1
        fi
        
        # Install the service
        sudo ./svc.sh install
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Service installed successfully${NC}"
            
            # Start the service
            echo -e "${YELLOW}🚀 Starting service...${NC}"
            sudo ./svc.sh start
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Service started successfully${NC}"
                
                # Check service status
                echo -e "${BLUE}📊 Service status:${NC}"
                sudo ./svc.sh status
                
                echo -e "\n${GREEN}🎉 GitHub Actions runner is now running as a service!${NC}"
                echo
                echo -e "${YELLOW}📋 Service Management Commands:${NC}"
                echo "   Start:   sudo ./svc.sh start"
                echo "   Stop:    sudo ./svc.sh stop"
                echo "   Status:  sudo ./svc.sh status"
                echo "   Remove:  sudo ./svc.sh uninstall"
                echo
                echo -e "${BLUE}📝 Service Details:${NC}"
                echo "   Service file: /Library/LaunchDaemons/actions.runner.$(cat .runner | grep -o '[^:]*$').plist"
                echo "   Logs: /usr/local/var/log/actions.runner.$(cat .runner | grep -o '[^:]*$').log"
            else
                echo -e "${RED}❌ Failed to start service${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Failed to install service${NC}"
            exit 1
        fi
        ;;
        
    "Linux")
        echo -e "${YELLOW}🐧 Installing Linux systemd service...${NC}"
        
        # Check if service script exists
        if [ ! -f "./svc.sh" ]; then
            echo -e "${RED}❌ Error: svc.sh not found.${NC}"
            exit 1
        fi
        
        # Install the service
        sudo ./svc.sh install
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Service installed successfully${NC}"
            
            # Start and enable the service
            echo -e "${YELLOW}🚀 Starting and enabling service...${NC}"
            sudo ./svc.sh start
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Service started successfully${NC}"
                
                # Check service status
                echo -e "${BLUE}📊 Service status:${NC}"
                sudo ./svc.sh status
                
                echo -e "\n${GREEN}🎉 GitHub Actions runner is now running as a service!${NC}"
                echo
                echo -e "${YELLOW}📋 Service Management Commands:${NC}"
                echo "   Start:   sudo ./svc.sh start"
                echo "   Stop:    sudo ./svc.sh stop"
                echo "   Status:  sudo ./svc.sh status"
                echo "   Remove:  sudo ./svc.sh uninstall"
                echo
                echo -e "${BLUE}📝 Service Details:${NC}"
                echo "   Service file: /etc/systemd/system/actions.runner.$(cat .runner | grep -o '[^:]*$').service"
                echo "   Logs: journalctl -u actions.runner.$(cat .runner | grep -o '[^:]*$') -f"
            else
                echo -e "${RED}❌ Failed to start service${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Failed to install service${NC}"
            exit 1
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Unsupported platform: $PLATFORM${NC}"
        exit 1
        ;;
esac

echo
echo -e "${GREEN}📖 Additional Information:${NC}"
echo "• The service will automatically start on system boot"
echo "• Logs are available through system logging mechanisms"
echo "• The runner will automatically restart if it crashes"
echo "• To remove the service, run: sudo ./svc.sh uninstall"
echo
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "• Check runner status: https://github.com/[your-repo]/settings/actions/runners"
echo "• GitHub Actions documentation: https://docs.github.com/en/actions"
echo "• Self-hosted runners guide: https://docs.github.com/en/actions/hosting-your-own-runners"