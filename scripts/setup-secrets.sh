#!/bin/bash

# Cultural Sound Lab - Secrets Management Setup Script
# This script helps set up secrets management for production environments

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Default values
PROVIDER=""
ENVIRONMENT="production"
SECRET_NAME="cultural-sound-lab/production"
REGION="us-east-1"
VAULT_ADDR=""
DRY_RUN=false
FORCE=false

# Show usage
show_usage() {
    cat << EOF
Cultural Sound Lab - Secrets Management Setup

Usage: $0 [OPTIONS]

OPTIONS:
    -p, --provider PROVIDER     Secrets provider (aws|vault|env)
    -e, --environment ENV       Environment name (default: production)
    -n, --secret-name NAME      Secret name/path (default: cultural-sound-lab/production)
    -r, --region REGION         AWS region (default: us-east-1)
    -v, --vault-addr ADDR       Vault server address
    -d, --dry-run              Show what would be done without executing
    -f, --force                Force overwrite existing secrets
    -h, --help                 Show this help message

EXAMPLES:
    # Set up AWS Secrets Manager
    $0 --provider aws --region us-east-1

    # Set up HashiCorp Vault
    $0 --provider vault --vault-addr https://vault.company.com

    # Preview changes without applying
    $0 --provider aws --dry-run

    # Force update existing secrets
    $0 --provider aws --force

PREREQUISITES:
    AWS Secrets Manager:
        - AWS CLI configured with appropriate permissions
        - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY set

    HashiCorp Vault:
        - Vault CLI installed
        - VAULT_ADDR and VAULT_TOKEN set

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--provider)
                PROVIDER="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--secret-name)
                SECRET_NAME="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -v|--vault-addr)
                VAULT_ADDR="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate prerequisites
validate_prerequisites() {
    case $PROVIDER in
        aws)
            if ! command -v aws &> /dev/null; then
                log_error "AWS CLI is required but not installed"
                exit 1
            fi

            if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
                log_error "AWS credentials not configured"
                log_info "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
                exit 1
            fi

            # Test AWS credentials
            if ! aws sts get-caller-identity &> /dev/null; then
                log_error "AWS credentials are invalid or lack permissions"
                exit 1
            fi
            ;;
        vault)
            if ! command -v vault &> /dev/null; then
                log_error "Vault CLI is required but not installed"
                exit 1
            fi

            if [[ -z "${VAULT_ADDR:-}" ]] || [[ -z "${VAULT_TOKEN:-}" ]]; then
                log_error "Vault configuration not set"
                log_info "Please set VAULT_ADDR and VAULT_TOKEN"
                exit 1
            fi

            # Test Vault connection
            if ! vault status &> /dev/null; then
                log_error "Cannot connect to Vault server"
                exit 1
            fi
            ;;
        env)
            log_warn "Using environment variables only - no external secrets provider"
            ;;
        *)
            log_error "Invalid provider: $PROVIDER"
            log_info "Valid providers: aws, vault, env"
            exit 1
            ;;
    esac
}

# Generate secure secrets
generate_secrets() {
    local secrets_file="/tmp/csl-secrets-${ENVIRONMENT}.json"
    
    log_info "Generating secure secrets..."
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    REFRESH_TOKEN_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d '\n')
    
    # Create secrets JSON
    cat > "$secrets_file" << EOF
{
    "JWT_SECRET": "$JWT_SECRET",
    "REFRESH_TOKEN_SECRET": "$REFRESH_TOKEN_SECRET",
    "SESSION_SECRET": "$SESSION_SECRET",
    "ENCRYPTION_KEY": "$ENCRYPTION_KEY",
    "NODE_ENV": "$ENVIRONMENT",
    "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY:-}",
    "SUPABASE_JWT_SECRET": "${SUPABASE_JWT_SECRET:-}",
    "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY:-}",
    "STRIPE_WEBHOOK_SECRET": "${STRIPE_WEBHOOK_SECRET:-}",
    "SENDGRID_API_KEY": "${SENDGRID_API_KEY:-}",
    "SENTRY_DSN": "${SENTRY_DSN:-}",
    "REDIS_PASSWORD": "${REDIS_PASSWORD:-}",
    "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY:-}",
    "MINIO_SECRET_KEY": "${MINIO_SECRET_KEY:-}"
}
EOF

    echo "$secrets_file"
}

# Setup AWS Secrets Manager
setup_aws_secrets() {
    local secrets_file="$1"
    
    log_info "Setting up AWS Secrets Manager..."
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would create/update secret: $SECRET_NAME in region: $REGION"
        log_info "[DRY RUN] Secret content:"
        jq '.' "$secrets_file"
        return
    fi
    
    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" &> /dev/null; then
        if $FORCE; then
            log_info "Updating existing secret: $SECRET_NAME"
            aws secretsmanager update-secret \
                --secret-id "$SECRET_NAME" \
                --secret-string "file://$secrets_file" \
                --region "$REGION"
        else
            log_warn "Secret $SECRET_NAME already exists. Use --force to overwrite."
            return 1
        fi
    else
        log_info "Creating new secret: $SECRET_NAME"
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "Cultural Sound Lab secrets for $ENVIRONMENT environment" \
            --secret-string "file://$secrets_file" \
            --region "$REGION" \
            --tags '[
                {"Key": "Project", "Value": "cultural-sound-lab"},
                {"Key": "Environment", "Value": "'$ENVIRONMENT'"},
                {"Key": "Service", "Value": "api"},
                {"Key": "CreatedBy", "Value": "setup-secrets-script"}
            ]'
    fi
    
    log_success "AWS Secrets Manager setup completed"
    log_info "Secret ARN: $(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" --query 'ARN' --output text)"
}

# Setup HashiCorp Vault
setup_vault_secrets() {
    local secrets_file="$1"
    
    log_info "Setting up HashiCorp Vault..."
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would write secret to path: secret/$SECRET_NAME"
        log_info "[DRY RUN] Secret content:"
        jq '.' "$secrets_file"
        return
    fi
    
    # Enable KV v2 secret engine if not exists
    if ! vault secrets list | grep -q "secret/"; then
        log_info "Enabling KV v2 secret engine..."
        vault secrets enable -version=2 kv
    fi
    
    # Check if secret exists
    if vault kv get "secret/$SECRET_NAME" &> /dev/null; then
        if $FORCE; then
            log_info "Updating existing secret: secret/$SECRET_NAME"
        else
            log_warn "Secret secret/$SECRET_NAME already exists. Use --force to overwrite."
            return 1
        fi
    else
        log_info "Creating new secret: secret/$SECRET_NAME"
    fi
    
    # Write secret to Vault
    vault kv put "secret/$SECRET_NAME" @"$secrets_file"
    
    log_success "HashiCorp Vault setup completed"
    log_info "Secret path: secret/$SECRET_NAME"
}

# Create environment file template
create_env_template() {
    local env_file="$PWD/.env.${ENVIRONMENT}"
    
    log_info "Creating environment file template: $env_file"
    
    if $DRY_RUN; then
        log_info "[DRY RUN] Would create environment file: $env_file"
        return
    fi
    
    cat > "$env_file" << EOF
# Cultural Sound Lab - $ENVIRONMENT Environment Configuration
# Generated by setup-secrets.sh on $(date)

# Secrets Provider Configuration
SECRETS_PROVIDER=$PROVIDER
EOF

    case $PROVIDER in
        aws)
            cat >> "$env_file" << EOF
AWS_SECRETS_MANAGER_REGION=$REGION
AWS_SECRETS_MANAGER_SECRET_NAME=$SECRET_NAME
AWS_ACCESS_KEY_ID=\${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=\${AWS_SECRET_ACCESS_KEY}
EOF
            ;;
        vault)
            cat >> "$env_file" << EOF
VAULT_ADDR=$VAULT_ADDR
VAULT_TOKEN=\${VAULT_TOKEN}
VAULT_SECRET_PATH=$SECRET_NAME
EOF
            ;;
        env)
            # Add all secrets directly to the file
            local secrets_file=$(generate_secrets)
            jq -r 'to_entries[] | "\(.key)=\(.value)"' "$secrets_file" >> "$env_file"
            rm -f "$secrets_file"
            ;;
    esac
    
    cat >> "$env_file" << EOF

# Application Configuration
NODE_ENV=$ENVIRONMENT
PORT=3001
API_BASE_URL=https://api.culturalsoundlab.com
FRONTEND_URL=https://culturalsoundlab.com

# Database Configuration
SUPABASE_URL=\${SUPABASE_URL}
SUPABASE_ANON_KEY=\${SUPABASE_ANON_KEY}

# Redis Configuration
REDIS_URL=\${REDIS_URL}

# Storage Configuration
STORAGE_PROVIDER=s3
AWS_S3_BUCKET_AUDIO=cultural-audio-prod
AWS_S3_BUCKET_GENERATED=generated-audio-prod

# Monitoring
ENABLE_METRICS_ENDPOINT=true
ENABLE_HEALTH_CHECKS=true
SENTRY_TRACES_SAMPLE_RATE=0.1

# Feature Flags
ENABLE_AI_GENERATION=true
ENABLE_PAYMENT_PROCESSING=true
ENABLE_EMAIL_NOTIFICATIONS=true
EOF
    
    log_success "Environment file created: $env_file"
    
    # Set appropriate permissions
    chmod 600 "$env_file"
    log_info "Set file permissions to 600 (owner read/write only)"
}

# Verify setup
verify_setup() {
    log_info "Verifying secrets setup..."
    
    case $PROVIDER in
        aws)
            if aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$REGION" &> /dev/null; then
                log_success "AWS Secrets Manager verification passed"
            else
                log_error "AWS Secrets Manager verification failed"
                return 1
            fi
            ;;
        vault)
            if vault kv get "secret/$SECRET_NAME" &> /dev/null; then
                log_success "HashiCorp Vault verification passed"
            else
                log_error "HashiCorp Vault verification failed"
                return 1
            fi
            ;;
        env)
            log_success "Environment variables setup completed"
            ;;
    esac
}

# Cleanup temporary files
cleanup() {
    find /tmp -name "csl-secrets-*" -type f -delete 2>/dev/null || true
}

# Main function
main() {
    log_info "Cultural Sound Lab - Secrets Management Setup"
    log_info "============================================="
    
    # Parse arguments
    parse_args "$@"
    
    # Validate required arguments
    if [[ -z "$PROVIDER" ]]; then
        log_error "Provider is required. Use --provider aws|vault|env"
        show_usage
        exit 1
    fi
    
    # Set Vault address if provided
    if [[ -n "$VAULT_ADDR" ]]; then
        export VAULT_ADDR
    fi
    
    # Validate prerequisites
    validate_prerequisites
    
    # Generate secrets
    if [[ "$PROVIDER" != "env" ]]; then
        secrets_file=$(generate_secrets)
        trap cleanup EXIT
    fi
    
    # Setup secrets based on provider
    case $PROVIDER in
        aws)
            setup_aws_secrets "$secrets_file"
            ;;
        vault)
            setup_vault_secrets "$secrets_file"
            ;;
        env)
            log_info "Setting up environment-based secrets..."
            ;;
    esac
    
    # Create environment file template
    create_env_template
    
    # Verify setup
    if ! $DRY_RUN; then
        verify_setup
    fi
    
    log_success "Secrets management setup completed successfully!"
    
    if [[ "$PROVIDER" != "env" ]]; then
        log_info ""
        log_info "Next steps:"
        log_info "1. Review the generated .env.$ENVIRONMENT file"
        log_info "2. Update the deployment configuration to use SECRETS_PROVIDER=$PROVIDER"
        log_info "3. Ensure the application has access to the secrets provider"
        log_info "4. Test the application startup with the new configuration"
    fi
}

# Run main function with all arguments
main "$@"