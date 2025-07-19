# Secrets Management Guide

This document provides comprehensive guidance on managing secrets and environment variables for the Cultural Sound Lab platform.

## Overview

The Cultural Sound Lab platform supports multiple secrets management strategies:

1. **Environment Variables** (Development)
2. **AWS Secrets Manager** (Production - Recommended)
3. **HashiCorp Vault** (Enterprise)

## Quick Start

### 1. Development Setup

For local development, use environment variables:

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env

# Set secrets provider
export SECRETS_PROVIDER=env
```

### 2. Production Setup (AWS Secrets Manager)

```bash
# Run the setup script
./scripts/setup-secrets.sh --provider aws --region us-east-1

# Or preview changes first
./scripts/setup-secrets.sh --provider aws --dry-run
```

### 3. Enterprise Setup (HashiCorp Vault)

```bash
# Configure Vault
export VAULT_ADDR=https://vault.company.com
export VAULT_TOKEN=your-token

# Run setup
./scripts/setup-secrets.sh --provider vault
```

## Environment Variables Reference

### Required Variables

#### Core Application
```bash
NODE_ENV=production|development|test
PORT=3001
API_BASE_URL=https://api.culturalsoundlab.com
FRONTEND_URL=https://culturalsoundlab.com
```

#### Security (Required in Production)
```bash
JWT_SECRET=base64-encoded-256-bit-secret
REFRESH_TOKEN_SECRET=base64-encoded-256-bit-secret
SESSION_SECRET=base64-encoded-256-bit-secret
ENCRYPTION_KEY=base64-encoded-256-bit-key
```

#### Database
```bash
# Supabase (Primary)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# PostgreSQL (Alternative)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### Redis
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
```

### Optional Variables

#### Storage
```bash
# MinIO (Development)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# AWS S3 (Production)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

#### Payments
```bash
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret
```

#### Email
```bash
SENDGRID_API_KEY=SG.your-api-key
FROM_EMAIL=noreply@culturalsoundlab.com
```

#### Monitoring
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

#### AI Service
```bash
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=your-ai-api-key
HUGGINGFACE_TOKEN=your-hf-token
```

## Secrets Providers

### 1. Environment Variables (`SECRETS_PROVIDER=env`)

**Use for:** Development, testing, simple deployments

**Pros:**
- Simple setup
- No external dependencies
- Good for development

**Cons:**
- Secrets visible in process list
- No rotation support
- Manual secret management

**Configuration:**
```bash
SECRETS_PROVIDER=env
# All secrets directly in environment
```

### 2. AWS Secrets Manager (`SECRETS_PROVIDER=aws`)

**Use for:** Production, AWS-hosted deployments

**Pros:**
- Secure secret storage
- Automatic rotation support
- Audit logging
- IAM integration

**Cons:**
- AWS-specific
- Additional cost
- Network dependency

**Configuration:**
```bash
SECRETS_PROVIDER=aws
AWS_SECRETS_MANAGER_REGION=us-east-1
AWS_SECRETS_MANAGER_SECRET_NAME=cultural-sound-lab/production
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**IAM Permissions Required:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:cultural-sound-lab/*"
        }
    ]
}
```

### 3. HashiCorp Vault (`SECRETS_PROVIDER=vault`)

**Use for:** Enterprise, multi-cloud, advanced secret management

**Pros:**
- Platform-agnostic
- Advanced secret engines
- Dynamic secrets
- Comprehensive audit

**Cons:**
- Complex setup
- Requires Vault infrastructure
- Additional operational overhead

**Configuration:**
```bash
SECRETS_PROVIDER=vault
VAULT_ADDR=https://vault.company.com
VAULT_TOKEN=your-vault-token
VAULT_SECRET_PATH=cultural-sound-lab
VAULT_NAMESPACE=your-namespace  # Optional
```

## Setup Scripts

### Main Setup Script

The `scripts/setup-secrets.sh` script automates secrets management setup:

```bash
# Show help
./scripts/setup-secrets.sh --help

# Set up AWS Secrets Manager
./scripts/setup-secrets.sh --provider aws --region us-east-1

# Set up Vault
./scripts/setup-secrets.sh --provider vault --vault-addr https://vault.example.com

# Preview changes without applying
./scripts/setup-secrets.sh --provider aws --dry-run

# Force overwrite existing secrets
./scripts/setup-secrets.sh --provider aws --force
```

### Manual Setup

#### AWS Secrets Manager

```bash
# Create secret
aws secretsmanager create-secret \
    --name "cultural-sound-lab/production" \
    --description "Cultural Sound Lab production secrets" \
    --secret-string file://secrets.json \
    --region us-east-1

# Update secret
aws secretsmanager update-secret \
    --secret-id "cultural-sound-lab/production" \
    --secret-string file://secrets.json \
    --region us-east-1
```

#### HashiCorp Vault

```bash
# Enable KV v2 engine
vault secrets enable -version=2 kv

# Write secrets
vault kv put secret/cultural-sound-lab @secrets.json

# Read secrets
vault kv get secret/cultural-sound-lab
```

## Security Best Practices

### Secret Generation

Generate secure secrets using cryptographically secure methods:

```bash
# JWT secrets (512 bits)
openssl rand -base64 64

# Encryption keys (256 bits)
openssl rand -base64 32

# Session secrets (256 bits)
openssl rand -hex 32
```

### Access Control

1. **Principle of Least Privilege**: Grant minimal necessary permissions
2. **Role-Based Access**: Use service accounts and roles
3. **Audit Logging**: Enable comprehensive audit trails
4. **Secret Rotation**: Implement regular secret rotation

### Environment Separation

Maintain strict separation between environments:

```
Development:   cultural-sound-lab/development
Staging:       cultural-sound-lab/staging
Production:    cultural-sound-lab/production
```

### File Permissions

Protect environment files:

```bash
# Set restrictive permissions
chmod 600 .env.production

# Verify ownership
chown app:app .env.production
```

## Deployment Configurations

### Docker

```dockerfile
# Use build-time argument for secrets provider
ARG SECRETS_PROVIDER=env
ENV SECRETS_PROVIDER=$SECRETS_PROVIDER

# Copy environment file
COPY .env.production .env

# Run application
CMD ["npm", "start"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cultural-sound-lab-api
spec:
  template:
    spec:
      containers:
      - name: api
        image: cultural-sound-lab/api:latest
        env:
        - name: SECRETS_PROVIDER
          value: "aws"
        - name: AWS_SECRETS_MANAGER_REGION
          value: "us-east-1"
        - name: AWS_SECRETS_MANAGER_SECRET_NAME
          value: "cultural-sound-lab/production"
        # Mount AWS credentials or use IAM roles
```

### AWS ECS

```json
{
  "taskDefinition": {
    "family": "cultural-sound-lab-api",
    "taskRoleArn": "arn:aws:iam::account:role/CSLTaskRole",
    "containerDefinitions": [
      {
        "name": "api",
        "image": "cultural-sound-lab/api:latest",
        "environment": [
          {
            "name": "SECRETS_PROVIDER",
            "value": "aws"
          },
          {
            "name": "AWS_SECRETS_MANAGER_REGION",
            "value": "us-east-1"
          }
        ]
      }
    ]
  }
}
```

## Monitoring and Alerting

### Health Checks

The application provides secrets health checks:

```bash
curl http://localhost:3001/api/health
```

Response includes secrets provider status:

```json
{
  "status": "healthy",
  "services": {
    "secrets": {
      "provider": "aws",
      "healthy": true
    }
  }
}
```

### Metrics

Monitor secrets-related metrics:

- Secret retrieval latency
- Secret cache hit ratio
- Secret provider errors
- Secret rotation events

### Alerts

Set up alerts for:

- Secret retrieval failures
- Secret provider unavailability
- Secret expiration warnings
- Unauthorized secret access

## Troubleshooting

### Common Issues

#### 1. Missing Secrets

**Error:** `Missing required secrets: JWT_SECRET`

**Solution:**
```bash
# Check if secret exists
aws secretsmanager describe-secret --secret-id cultural-sound-lab/production

# Verify application has correct configuration
export SECRETS_PROVIDER=aws
export AWS_SECRETS_MANAGER_SECRET_NAME=cultural-sound-lab/production
```

#### 2. AWS Permissions

**Error:** `Access denied to secret`

**Solution:**
```bash
# Check IAM permissions
aws iam get-role-policy --role-name CSLTaskRole --policy-name SecretsPolicy

# Test secret access
aws secretsmanager get-secret-value --secret-id cultural-sound-lab/production
```

#### 3. Vault Connection

**Error:** `Cannot connect to Vault server`

**Solution:**
```bash
# Check Vault status
vault status

# Verify authentication
vault auth -method=token token=$VAULT_TOKEN

# Test secret access
vault kv get secret/cultural-sound-lab
```

### Debug Mode

Enable debug logging for secrets management:

```bash
export DEBUG_SECRETS=true
export LOG_LEVEL=debug
```

### Testing Secrets

Test secrets loading without starting the full application:

```bash
# Test environment validation
npm run test:env

# Test secrets loading
npm run test:secrets
```

## Migration Guide

### From Environment Variables to AWS Secrets Manager

1. **Backup current configuration:**
   ```bash
   cp .env .env.backup
   ```

2. **Generate secrets and store in AWS:**
   ```bash
   ./scripts/setup-secrets.sh --provider aws
   ```

3. **Update deployment configuration:**
   ```bash
   export SECRETS_PROVIDER=aws
   ```

4. **Test the application:**
   ```bash
   npm start
   ```

### From AWS to Vault

1. **Export secrets from AWS:**
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id cultural-sound-lab/production \
     --query SecretString --output text > secrets.json
   ```

2. **Import to Vault:**
   ```bash
   vault kv put secret/cultural-sound-lab @secrets.json
   ```

3. **Update configuration:**
   ```bash
   export SECRETS_PROVIDER=vault
   ```

## API Reference

### Secrets Service

```typescript
import { secretsService } from '@/config/secrets';

// Load secrets
await secretsService.loadSecrets();

// Get specific secret
const jwtSecret = secretsService.getSecret('JWT_SECRET');

// Check if secret exists
if (secretsService.hasSecret('STRIPE_SECRET_KEY')) {
  // Configure Stripe
}

// Get status
const status = secretsService.getStatus();
```

### Environment Validation

```typescript
import { validateEnv, getEnvConfig } from '@/config/env-validation';

// Validate environment
const config = validateEnv();

// Get validated configuration
const envConfig = getEnvConfig();

// Check if production
if (isProduction()) {
  // Production-specific logic
}
```

## Contributing

When adding new secrets:

1. **Update environment examples:** Add to all `.env.example` files
2. **Update validation:** Add to validation schemas
3. **Update documentation:** Document purpose and format
4. **Test setup:** Verify setup scripts work correctly

## Support

For questions or issues with secrets management:

1. Check this documentation
2. Review application logs for specific errors
3. Test with debug mode enabled
4. Open an issue with full error details and configuration (redacted)