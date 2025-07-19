#!/bin/bash

# Cultural Sound Lab Complete Monitoring Setup Script
# This script sets up the entire monitoring stack including Docker containers,
# Grafana alerts, dashboards, and notification channels

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
MONITORING_DIR="${PROJECT_ROOT}/monitoring"

# Load environment variables if .env file exists
if [[ -f "${PROJECT_ROOT}/.env" ]]; then
    source "${PROJECT_ROOT}/.env"
fi

# Default values
GRAFANA_URL=${GRAFANA_URL:-"http://localhost:3002"}
GRAFANA_ADMIN_USER=${GRAFANA_ADMIN_USER:-"admin"}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-"admin123"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed. Please install Docker and try again."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is installed but not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is required but not installed. Please install Docker Compose and try again."
        exit 1
    fi
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed. Please install curl and try again."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq and try again."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

start_monitoring_stack() {
    log_step "Starting monitoring stack with Docker Compose..."
    
    cd "${PROJECT_ROOT}"
    
    # Start the monitoring stack
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.monitoring.yml up -d
    else
        docker compose -f docker-compose.monitoring.yml up -d
    fi
    
    log_info "Monitoring stack started. Waiting for services to be ready..."
    
    # Wait for Grafana to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -o /dev/null -w "%{http_code}" "$GRAFANA_URL/api/health" 2>/dev/null | grep -q "200"; then
            log_info "Grafana is ready!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Grafana failed to start within expected time. Please check Docker logs."
            exit 1
        fi
        
        log_info "Waiting for Grafana... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    # Wait a bit more for full initialization
    sleep 10
}

get_grafana_api_key() {
    log_step "Creating Grafana API key..."
    
    # Create API key for automation
    local api_key_payload='{
        "name": "monitoring-setup",
        "role": "Admin",
        "secondsToLive": 3600
    }'
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -u "${GRAFANA_ADMIN_USER}:${GRAFANA_ADMIN_PASSWORD}" \
        -d "$api_key_payload" \
        "$GRAFANA_URL/api/auth/keys")
    
    GRAFANA_API_KEY=$(echo "$response" | jq -r '.key')
    
    if [[ "$GRAFANA_API_KEY" == "null" || -z "$GRAFANA_API_KEY" ]]; then
        log_error "Failed to create Grafana API key. Response: $response"
        exit 1
    fi
    
    log_info "Grafana API key created successfully."
}

wait_for_prometheus() {
    log_step "Waiting for Prometheus to be ready..."
    
    local max_attempts=20
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:9090/-/ready" 2>/dev/null | grep -q "200"; then
            log_info "Prometheus is ready!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_warn "Prometheus is taking longer than expected to start. Continuing anyway..."
            break
        fi
        
        log_info "Waiting for Prometheus... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
}

create_folder() {
    log_step "Creating Grafana folder for Cultural Sound Lab..."
    
    local folder_payload='{
        "title": "Cultural Sound Lab",
        "uid": "cultural-sound-lab"
    }'
    
    local response=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $GRAFANA_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$folder_payload" \
        "$GRAFANA_URL/api/folders" \
        -o /tmp/folder_response.json)
    
    if [[ "$response" == "200" || "$response" == "409" ]]; then
        log_info "Grafana folder created or already exists."
    else
        log_error "Failed to create Grafana folder (HTTP $response)"
        cat /tmp/folder_response.json
        exit 1
    fi
}

setup_dashboard() {
    log_step "Setting up monitoring dashboard..."
    
    if [[ ! -f "$MONITORING_DIR/grafana/dashboard.json" ]]; then
        log_error "Dashboard file not found at $MONITORING_DIR/grafana/dashboard.json"
        exit 1
    fi
    
    # Copy dashboard to the dashboards directory where Grafana can find it
    local dashboard_file="${PROJECT_ROOT}/monitoring/grafana/dashboards/cultural-sound-lab-api.json"
    mkdir -p "$(dirname "$dashboard_file")"
    cp "$MONITORING_DIR/grafana/dashboard.json" "$dashboard_file"
    
    # Also create via API for immediate availability
    local dashboard_payload=$(jq '{
        dashboard: .dashboard,
        folderId: 0,
        overwrite: true
    }' "$MONITORING_DIR/grafana/dashboard.json")
    
    local response=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $GRAFANA_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$dashboard_payload" \
        "$GRAFANA_URL/api/dashboards/db" \
        -o /tmp/dashboard_response.json)
    
    if [[ "$response" == "200" ]]; then
        local dashboard_url=$(jq -r '.url' /tmp/dashboard_response.json)
        log_info "Dashboard created successfully: $GRAFANA_URL$dashboard_url"
    else
        log_warn "Failed to create dashboard via API (HTTP $response), but it should be available via provisioning."
    fi
}

setup_notification_channels() {
    log_step "Setting up notification channels..."
    
    # Slack notification channel
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local slack_payload='{
            "name": "cultural-sound-lab-slack",
            "type": "slack",
            "settings": {
                "url": "'$SLACK_WEBHOOK_URL'",
                "channel": "#alerts",
                "username": "Cultural Sound Lab Alerts",
                "title": "{{ range .Alerts }}{{ if eq .Status \"firing\" }}🔥 FIRING{{ else }}✅ RESOLVED{{ end }} {{ .Annotations.summary }}{{ end }}",
                "text": "{{ range .Alerts }}**Alert:** {{ .Annotations.summary }}\n**Description:** {{ .Annotations.description }}\n**Severity:** {{ .Labels.severity }}\n**Service:** {{ .Labels.service }}\n{{ if .Annotations.runbook_url }}**Runbook:** {{ .Annotations.runbook_url }}{{ end }}\n---{{ end }}"
            }
        }'
        
        local response=$(curl -s -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$slack_payload" \
            "$GRAFANA_URL/api/alert-notifications" \
            -o /tmp/slack_response.json)
        
        if [[ "$response" == "200" ]]; then
            log_info "Slack notification channel configured."
        else
            log_warn "Failed to configure Slack notifications (HTTP $response). Check your SLACK_WEBHOOK_URL."
        fi
    else
        log_info "SLACK_WEBHOOK_URL not set. Skipping Slack notification setup."
    fi
    
    # Email notification channel
    if [[ -n "$ALERT_EMAIL" ]]; then
        local email_payload='{
            "name": "cultural-sound-lab-email",
            "type": "email",
            "settings": {
                "addresses": "'$ALERT_EMAIL'",
                "subject": "Cultural Sound Lab Alert: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}"
            }
        }'
        
        local response=$(curl -s -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$email_payload" \
            "$GRAFANA_URL/api/alert-notifications" \
            -o /tmp/email_response.json)
        
        if [[ "$response" == "200" ]]; then
            log_info "Email notification channel configured."
        else
            log_warn "Failed to configure email notifications (HTTP $response). Check your email settings."
        fi
    else
        log_info "ALERT_EMAIL not set. Skipping email notification setup."
    fi
    
    # PagerDuty notification channel
    if [[ -n "$PAGERDUTY_INTEGRATION_KEY" ]]; then
        local pagerduty_payload='{
            "name": "cultural-sound-lab-pagerduty",
            "type": "pagerduty",
            "settings": {
                "integrationKey": "'$PAGERDUTY_INTEGRATION_KEY'",
                "severity": "{{ range .Alerts }}{{ if eq .Labels.severity \"critical\" }}critical{{ else if eq .Labels.severity \"warning\" }}warning{{ else }}info{{ end }}{{ end }}",
                "client": "Cultural Sound Lab Grafana",
                "clientUrl": "'$GRAFANA_URL'",
                "description": "{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}"
            }
        }'
        
        local response=$(curl -s -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$pagerduty_payload" \
            "$GRAFANA_URL/api/alert-notifications" \
            -o /tmp/pagerduty_response.json)
        
        if [[ "$response" == "200" ]]; then
            log_info "PagerDuty notification channel configured."
        else
            log_warn "Failed to configure PagerDuty notifications (HTTP $response). Check your PAGERDUTY_INTEGRATION_KEY."
        fi
    else
        log_info "PAGERDUTY_INTEGRATION_KEY not set. Skipping PagerDuty notification setup."
    fi
}

show_services_info() {
    log_step "Monitoring stack is ready! Here are the service URLs:"
    echo ""
    echo "🎯 Grafana Dashboard: $GRAFANA_URL"
    echo "   Username: $GRAFANA_ADMIN_USER"
    echo "   Password: $GRAFANA_ADMIN_PASSWORD"
    echo ""
    echo "📊 Prometheus: http://localhost:9090"
    echo "🔍 Jaeger Tracing: http://localhost:16686"
    echo "📈 OTEL Collector: http://localhost:8888 (metrics)"
    echo "🔧 Redis: localhost:6379"
    echo ""
    echo "📋 API Health Check: http://localhost:3001/health"
    echo "🎵 Web Application: http://localhost:3000"
    echo ""
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        echo "✅ Slack notifications: Configured"
    else
        echo "❌ Slack notifications: Not configured (set SLACK_WEBHOOK_URL)"
    fi
    
    if [[ -n "$ALERT_EMAIL" ]]; then
        echo "✅ Email notifications: Configured"
    else
        echo "❌ Email notifications: Not configured (set ALERT_EMAIL)"
    fi
    
    if [[ -n "$PAGERDUTY_INTEGRATION_KEY" ]]; then
        echo "✅ PagerDuty notifications: Configured"
    else
        echo "❌ PagerDuty notifications: Not configured (set PAGERDUTY_INTEGRATION_KEY)"
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/folder_response.json /tmp/dashboard_response.json /tmp/slack_response.json /tmp/email_response.json /tmp/pagerduty_response.json
}

show_next_steps() {
    echo ""
    log_step "Next steps to complete your monitoring setup:"
    echo ""
    echo "1. 🔧 Configure notification channels:"
    echo "   - Set SLACK_WEBHOOK_URL for Slack alerts"
    echo "   - Set ALERT_EMAIL for email alerts"
    echo "   - Set PAGERDUTY_INTEGRATION_KEY for PagerDuty alerts"
    echo ""
    echo "2. 🚀 Deploy to production:"
    echo "   - Copy your monitoring configuration to production"
    echo "   - Set up external monitoring endpoints"
    echo "   - Configure cloud-based logging (CloudWatch, Datadog, etc.)"
    echo ""
    echo "3. 📊 Verify metrics collection:"
    echo "   - Start your API: npm run dev:api"
    echo "   - Make some test requests"
    echo "   - Check Grafana dashboard for data"
    echo ""
    echo "4. 🎯 Fine-tune alert thresholds:"
    echo "   - Monitor your actual traffic patterns"
    echo "   - Adjust alert thresholds in monitoring/grafana/alert-rules.json"
    echo "   - Re-run this script to update alerts"
    echo ""
    echo "5. 🔍 Test your alerts:"
    echo "   - Simulate high error rates"
    echo "   - Test notification channels"
    echo "   - Verify escalation procedures"
}

main() {
    echo "🚀 Cultural Sound Lab Complete Monitoring Setup"
    echo "=============================================="
    echo ""
    
    check_prerequisites
    start_monitoring_stack
    get_grafana_api_key
    wait_for_prometheus
    create_folder
    setup_dashboard
    setup_notification_channels
    cleanup
    show_services_info
    show_next_steps
    
    log_info "✅ Monitoring setup completed successfully!"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"