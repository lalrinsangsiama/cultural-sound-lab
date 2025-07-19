#!/bin/bash

# Cultural Sound Lab Monitoring Setup Script
# This script sets up Grafana alerts and dashboards for production monitoring

set -e

# Configuration
GRAFANA_URL=${GRAFANA_URL:-"http://localhost:3000"}
GRAFANA_API_KEY=${GRAFANA_API_KEY:-""}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="${SCRIPT_DIR}/../monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
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
    
    # Check if Grafana API key is provided
    if [[ -z "$GRAFANA_API_KEY" ]]; then
        log_error "GRAFANA_API_KEY environment variable is required."
        log_info "Please set GRAFANA_API_KEY to your Grafana API key."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

test_grafana_connection() {
    log_info "Testing Grafana connection..."
    
    response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $GRAFANA_API_KEY" \
        "$GRAFANA_URL/api/health" -o /dev/null)
    
    if [[ "$response" != "200" ]]; then
        log_error "Failed to connect to Grafana at $GRAFANA_URL (HTTP $response)"
        log_info "Please check your GRAFANA_URL and GRAFANA_API_KEY."
        exit 1
    fi
    
    log_info "Successfully connected to Grafana."
}

create_folder() {
    log_info "Creating Grafana folder for Cultural Sound Lab..."
    
    folder_payload='{
        "title": "Cultural Sound Lab",
        "uid": "cultural-sound-lab"
    }'
    
    response=$(curl -s -w "%{http_code}" -X POST \
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

setup_alert_rules() {
    log_info "Setting up alert rules..."
    
    if [[ ! -f "$MONITORING_DIR/grafana/alert-rules.json" ]]; then
        log_error "Alert rules file not found at $MONITORING_DIR/grafana/alert-rules.json"
        exit 1
    fi
    
    # Upload alert rules
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $GRAFANA_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$MONITORING_DIR/grafana/alert-rules.json" \
        "$GRAFANA_URL/api/ruler/grafana/api/v1/rules" \
        -o /tmp/alerts_response.json)
    
    if [[ "$response" == "202" || "$response" == "200" ]]; then
        log_info "Alert rules configured successfully."
    else
        log_error "Failed to configure alert rules (HTTP $response)"
        cat /tmp/alerts_response.json
        exit 1
    fi
}

setup_dashboard() {
    log_info "Setting up monitoring dashboard..."
    
    if [[ ! -f "$MONITORING_DIR/grafana/dashboard.json" ]]; then
        log_error "Dashboard file not found at $MONITORING_DIR/grafana/dashboard.json"
        exit 1
    fi
    
    # Wrap dashboard in the required format
    dashboard_payload=$(jq '{
        dashboard: .dashboard,
        folderId: 0,
        overwrite: true
    }' "$MONITORING_DIR/grafana/dashboard.json")
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Authorization: Bearer $GRAFANA_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$dashboard_payload" \
        "$GRAFANA_URL/api/dashboards/db" \
        -o /tmp/dashboard_response.json)
    
    if [[ "$response" == "200" ]]; then
        dashboard_url=$(jq -r '.url' /tmp/dashboard_response.json)
        log_info "Dashboard created successfully: $GRAFANA_URL$dashboard_url"
    else
        log_error "Failed to create dashboard (HTTP $response)"
        cat /tmp/dashboard_response.json
        exit 1
    fi
}

setup_notification_channels() {
    log_info "Setting up notification channels..."
    
    # Example Slack notification channel
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        slack_payload='{
            "name": "cultural-sound-lab-alerts",
            "type": "slack",
            "settings": {
                "url": "'$SLACK_WEBHOOK_URL'",
                "channel": "#alerts",
                "username": "Grafana",
                "title": "{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}",
                "text": "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
            }
        }'
        
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$slack_payload" \
            "$GRAFANA_URL/api/alert-notifications" \
            -o /tmp/notification_response.json)
        
        if [[ "$response" == "200" ]]; then
            log_info "Slack notification channel configured."
        else
            log_warn "Failed to configure Slack notifications (HTTP $response)"
        fi
    fi
    
    # Example email notification channel
    if [[ -n "$ALERT_EMAIL" ]]; then
        email_payload='{
            "name": "cultural-sound-lab-email",
            "type": "email",
            "settings": {
                "addresses": "'$ALERT_EMAIL'",
                "subject": "Cultural Sound Lab Alert: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}"
            }
        }'
        
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$email_payload" \
            "$GRAFANA_URL/api/alert-notifications" \
            -o /tmp/notification_response.json)
        
        if [[ "$response" == "200" ]]; then
            log_info "Email notification channel configured."
        else
            log_warn "Failed to configure email notifications (HTTP $response)"
        fi
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/folder_response.json /tmp/alerts_response.json /tmp/dashboard_response.json /tmp/notification_response.json
}

main() {
    log_info "Starting Cultural Sound Lab monitoring setup..."
    
    check_prerequisites
    test_grafana_connection
    create_folder
    setup_alert_rules
    setup_dashboard
    setup_notification_channels
    cleanup
    
    log_info "Monitoring setup completed successfully!"
    log_info "Next steps:"
    log_info "1. Configure Prometheus to scrape your API metrics"
    log_info "2. Set up alert notification channels (Slack, email, etc.)"
    log_info "3. Test alerts by triggering test conditions"
    log_info "4. Review and customize alert thresholds as needed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"