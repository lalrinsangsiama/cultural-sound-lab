# Sentry Releases Setup Guide

This guide explains how to set up Sentry releases with source maps for the Cultural Sound Lab project.

## Overview

Sentry releases help you:
- Track which code version caused an issue
- Upload source maps for better stack traces
- Get notifications about deploys
- Monitor performance across releases

## Required Environment Variables

### GitHub Secrets

Add these secrets to your GitHub repository settings:

```bash
# Sentry Configuration
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
SENTRY_DSN=https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640
NEXT_PUBLIC_SENTRY_DSN=https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640
SENTRY_DSN_API=https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640

# Vercel Configuration (if using Vercel)
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

### Local Development

For local testing, add to your `.env.local` files:

```bash
# apps/web/.env.local
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
NEXT_PUBLIC_SENTRY_DSN=https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640

# apps/api/.env
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
SENTRY_DSN=https://4c0f7dbc2f4f6c57fecd7bd0dfb81ddd@o4509699240361984.ingest.us.sentry.io/4509699259760640
```

## Getting Your Sentry Auth Token

1. Go to [Sentry Account Settings](https://sentry.io/settings/account/api/auth-tokens/)
2. Click "Create New Token"
3. Add these scopes:
   - `project:releases`
   - `project:write`
   - `org:read`
4. Copy the token and add it to your environment variables

## Manual Release Commands

### Web Application

```bash
# From apps/web directory
npm run sentry:release
```

### API

```bash
# From apps/api directory
npm run sentry:release
```

### Manual CLI Commands

```bash
# Install Sentry CLI
curl -sL https://sentry.io/get-cli/ | bash

# Setup configuration values
export SENTRY_AUTH_TOKEN=<your-token>
export SENTRY_ORG=cultural-sound-lab
export SENTRY_PROJECT=javascript-nextjs  # or express-api
export VERSION=$(sentry-cli releases propose-version)

# Create release
sentry-cli releases new "$VERSION"
sentry-cli releases set-commits "$VERSION" --auto
sentry-cli releases finalize "$VERSION"
```

## Automatic Deployments

### GitHub Actions

The project includes two workflows:

1. **`.github/workflows/deploy.yml`** - Deploys web app with Sentry releases
2. **`.github/workflows/deploy-api.yml`** - Deploys API with Sentry releases

These workflows automatically:
- Build the application
- Create Sentry releases
- Upload source maps
- Associate commits
- Deploy to production
- Notify about deployment status

### Vercel Integration

If using Vercel, the deployment workflow will:
1. Build your Next.js app
2. Deploy to Vercel
3. Create a Sentry release
4. Upload source maps
5. Associate the deployment with the release

## Source Maps

Source maps are automatically uploaded for:
- **Web App**: `.next/static` directory mapped to `~/_next/static`
- **API**: `dist` directory mapped to `~/dist`

## Sentry Configuration

### Web App Configuration

- **Client**: `apps/web/sentry.client.config.ts`
- **Server**: `apps/web/sentry.server.config.ts`
- **Edge**: `apps/web/sentry.edge.config.ts`

### API Configuration

- **Initialization**: `apps/api/src/instrument.js`
- **Configuration**: `apps/api/src/config/sentry.ts`

## Troubleshooting

### Common Issues

1. **Missing Auth Token**
   ```bash
   Error: Invalid token
   ```
   Solution: Ensure `SENTRY_AUTH_TOKEN` is set correctly

2. **Source Maps Not Uploading**
   ```bash
   Error: No files found
   ```
   Solution: Run `npm run build` before creating releases

3. **Release Already Exists**
   ```bash
   Error: Release already exists
   ```
   Solution: Use a different version or delete the existing release

### Debugging Commands

```bash
# Check CLI configuration
sentry-cli info

# List releases
sentry-cli releases list

# Check release details
sentry-cli releases info <version>

# Test source map upload
sentry-cli releases files <version> upload-sourcemaps ./dist --dry-run
```

## Best Practices

1. **Always create releases before deploying**
2. **Use semantic versioning** for release names
3. **Upload source maps** for better debugging
4. **Associate commits** with releases for tracking
5. **Test releases** in staging before production

## Monitoring

After setup, you can:
- View releases in the Sentry dashboard
- Get notified about new deployments
- Track issues by release
- Monitor performance across versions

## Links

- [Sentry Releases Documentation](https://docs.sentry.io/product/releases/)
- [Sentry CLI Documentation](https://docs.sentry.io/product/cli/)
- [Next.js Sentry Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Node.js Sentry Integration](https://docs.sentry.io/platforms/javascript/guides/node/)