import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  DescribeSecretCommand,
  PutSecretValueCommand,
  GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import { logger } from './logger';

interface SecretValue {
  [key: string]: string;
}

interface SecretsManagerConfig {
  region: string;
  secretName: string;
  enabled: boolean;
  autoCreate: boolean;
  cacheTtl: number;
}

class SecretsManager {
  private client: SecretsManagerClient | null = null;
  private config: SecretsManagerConfig;
  private cache: Map<string, { value: SecretValue; expiry: number }> = new Map();

  constructor() {
    this.config = {
      region: process.env.AWS_SECRETS_MANAGER_REGION || 'us-east-1',
      secretName: process.env.AWS_SECRETS_MANAGER_SECRET_NAME || 'cultural-sound-lab/production',
      enabled: process.env.SECRETS_PROVIDER === 'aws' || process.env.NODE_ENV === 'production',
      autoCreate: process.env.AWS_SECRETS_AUTO_CREATE === 'true',
      cacheTtl: parseInt(process.env.AWS_SECRETS_CACHE_TTL || '300') * 1000, // 5 minutes default
    };

    if (this.config.enabled) {
      try {
        this.client = new SecretsManagerClient({
          region: this.config.region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });
        logger.info('AWS Secrets Manager client initialized');
      } catch (error) {
        logger.error('Failed to initialize AWS Secrets Manager client:', error);
        this.config.enabled = false;
      }
    }
  }

  /**
   * Get a secret value from AWS Secrets Manager
   */
  async getSecret(secretName?: string): Promise<SecretValue | null> {
    if (!this.config.enabled || !this.client) {
      logger.debug('Secrets Manager not enabled, skipping secret retrieval');
      return null;
    }

    const name = secretName || this.config.secretName;
    
    // Check cache first
    const cached = this.cache.get(name);
    if (cached && Date.now() < cached.expiry) {
      logger.debug(`Returning cached secret for ${name}`);
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: name });
      const response: GetSecretValueCommandOutput = await this.client.send(command);
      
      if (!response.SecretString) {
        logger.warn(`Secret ${name} has no string value`);
        return null;
      }

      const secretValue = JSON.parse(response.SecretString) as SecretValue;
      
      // Cache the result
      this.cache.set(name, {
        value: secretValue,
        expiry: Date.now() + this.config.cacheTtl,
      });

      logger.info(`Successfully retrieved secret ${name}`);
      return secretValue;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        logger.warn(`Secret ${name} not found in AWS Secrets Manager`);
        
        if (this.config.autoCreate) {
          logger.info(`Attempting to create secret ${name}`);
          await this.createSecret(name, {});
          return {};
        }
      } else {
        logger.error(`Failed to retrieve secret ${name}:`, error);
      }
      return null;
    }
  }

  /**
   * Create a new secret in AWS Secrets Manager
   */
  async createSecret(secretName: string, secretValue: SecretValue): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    try {
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
        Description: `Cultural Sound Lab secrets for ${process.env.NODE_ENV} environment`,
        Tags: [
          { Key: 'Project', Value: 'cultural-sound-lab' },
          { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
          { Key: 'Service', Value: 'api' },
          { Key: 'CreatedBy', Value: 'cultural-sound-lab-api' },
        ],
      });

      await this.client.send(command);
      logger.info(`Successfully created secret ${secretName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to create secret ${secretName}:`, error);
      return false;
    }
  }

  /**
   * Update an existing secret in AWS Secrets Manager
   */
  async updateSecret(secretName: string, secretValue: SecretValue): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    try {
      const command = new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue),
      });

      await this.client.send(command);
      
      // Invalidate cache
      this.cache.delete(secretName);
      
      logger.info(`Successfully updated secret ${secretName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to update secret ${secretName}:`, error);
      return false;
    }
  }

  /**
   * Check if a secret exists
   */
  async secretExists(secretName: string): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    try {
      const command = new DescribeSecretCommand({ SecretId: secretName });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return false;
      }
      logger.error(`Error checking if secret ${secretName} exists:`, error);
      return false;
    }
  }

  /**
   * Load secrets and merge with environment variables
   */
  async loadSecrets(): Promise<Record<string, string>> {
    if (!this.config.enabled) {
      logger.debug('Secrets Manager not enabled, using environment variables only');
      return process.env as Record<string, string>;
    }

    try {
      const secrets = await this.getSecret();
      if (!secrets) {
        logger.warn('No secrets retrieved from AWS Secrets Manager');
        return process.env as Record<string, string>;
      }

      // Merge secrets with environment variables (env vars take precedence)
      const mergedConfig = { ...secrets, ...process.env };
      
      logger.info(`Loaded ${Object.keys(secrets).length} secrets from AWS Secrets Manager`);
      
      // Update process.env with secrets (only if not already set)
      Object.entries(secrets).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });

      return mergedConfig as Record<string, string>;
    } catch (error) {
      logger.error('Failed to load secrets from AWS Secrets Manager:', error);
      logger.warn('Falling back to environment variables only');
      return process.env as Record<string, string>;
    }
  }

  /**
   * Store current environment variables as a secret
   */
  async storeEnvironmentSecrets(secretName?: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const name = secretName || this.config.secretName;
    
    // Extract sensitive environment variables
    const sensitiveKeys = [
      'JWT_SECRET',
      'REFRESH_TOKEN_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'SENDGRID_API_KEY',
      'SENTRY_DSN',
      'REDIS_PASSWORD',
      'DB_PASSWORD',
      'AWS_SECRET_ACCESS_KEY',
      'MINIO_SECRET_KEY',
    ];

    const secretsToStore: SecretValue = {};
    sensitiveKeys.forEach(key => {
      if (process.env[key]) {
        secretsToStore[key] = process.env[key]!;
      }
    });

    if (Object.keys(secretsToStore).length === 0) {
      logger.warn('No sensitive environment variables found to store');
      return false;
    }

    const exists = await this.secretExists(name);
    
    if (exists) {
      return await this.updateSecret(name, secretsToStore);
    } else {
      return await this.createSecret(name, secretsToStore);
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Secrets cache cleared');
  }

  /**
   * Get configuration status
   */
  getStatus(): {
    enabled: boolean;
    region: string;
    secretName: string;
    cacheSize: number;
  } {
    return {
      enabled: this.config.enabled,
      region: this.config.region,
      secretName: this.config.secretName,
      cacheSize: this.cache.size,
    };
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();

// Helper functions for common operations
export const loadProductionSecrets = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    logger.info('Loading production secrets from AWS Secrets Manager...');
    await secretsManager.loadSecrets();
  }
};

export const validateSecretsConfiguration = (): boolean => {
  if (process.env.SECRETS_PROVIDER === 'aws') {
    const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SECRETS_MANAGER_SECRET_NAME'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.error(`Missing required AWS Secrets Manager configuration: ${missing.join(', ')}`);
      return false;
    }
  }
  
  return true;
};

// Initialize secrets on module load for production
if (process.env.NODE_ENV === 'production' && process.env.SECRETS_PROVIDER === 'aws') {
  loadProductionSecrets().catch(error => {
    logger.error('Failed to load production secrets on module initialization:', error);
  });
}

export default secretsManager;