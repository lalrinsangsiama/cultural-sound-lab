import { secretsManager } from './secrets-manager';
import { vaultClient } from './vault';
import { logger } from './logger';

export type SecretsProvider = 'env' | 'aws' | 'vault';

interface SecretsConfig {
  provider: SecretsProvider;
  autoLoad: boolean;
  cacheEnabled: boolean;
  fallbackToEnv: boolean;
  required: string[];
  sensitive: string[];
}

class SecretsService {
  private config: SecretsConfig;
  private loaded: boolean = false;

  constructor() {
    this.config = {
      provider: (process.env.SECRETS_PROVIDER as SecretsProvider) || 'env',
      autoLoad: process.env.SECRETS_AUTO_LOAD !== 'false',
      cacheEnabled: process.env.SECRETS_CACHE_ENABLED !== 'false',
      fallbackToEnv: process.env.SECRETS_FALLBACK_TO_ENV !== 'false',
      required: this.getRequiredSecrets(),
      sensitive: this.getSensitiveSecrets(),
    };
  }

  private getRequiredSecrets(): string[] {
    const base = ['NODE_ENV'];
    
    if (process.env.NODE_ENV === 'production') {
      return [
        ...base,
        'JWT_SECRET',
        'SESSION_SECRET',
      ];
    }
    
    return base;
  }

  private getSensitiveSecrets(): string[] {
    return [
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
      'VAULT_TOKEN',
      'HUGGINGFACE_TOKEN',
    ];
  }

  /**
   * Load secrets based on the configured provider
   */
  async loadSecrets(): Promise<Record<string, string>> {
    if (this.loaded && this.config.cacheEnabled) {
      logger.debug('Secrets already loaded, skipping reload');
      return process.env as Record<string, string>;
    }

    try {
      let secrets: Record<string, string> = {};

      switch (this.config.provider) {
        case 'aws':
          logger.info('Loading secrets from AWS Secrets Manager...');
          secrets = await secretsManager.loadSecrets();
          break;

        case 'vault':
          logger.info('Loading secrets from HashiCorp Vault...');
          secrets = await vaultClient.loadSecrets();
          break;

        case 'env':
        default:
          logger.info('Using environment variables only');
          secrets = process.env as Record<string, string>;
          break;
      }

      // Validate required secrets are present
      const missing = this.config.required.filter(key => !secrets[key]);
      if (missing.length > 0) {
        const error = `Missing required secrets: ${missing.join(', ')}`;
        logger.error(error);
        
        if (!this.config.fallbackToEnv || this.config.provider === 'env') {
          throw new Error(error);
        }
        
        logger.warn('Falling back to environment variables');
        secrets = process.env as Record<string, string>;
      }

      this.loaded = true;
      logger.info(`✅ Secrets loaded successfully using ${this.config.provider} provider`);
      
      // Log non-sensitive configuration for debugging
      if (process.env.NODE_ENV === 'development') {
        const nonSensitiveKeys = Object.keys(secrets).filter(
          key => !this.config.sensitive.includes(key) && !key.includes('SECRET') && !key.includes('KEY')
        );
        logger.debug('Non-sensitive configuration loaded:', 
          Object.fromEntries(nonSensitiveKeys.map(key => [key, secrets[key]]))
        );
      }

      return secrets;
    } catch (error) {
      logger.error('Failed to load secrets:', error);
      
      if (this.config.fallbackToEnv && this.config.provider !== 'env') {
        logger.warn('Falling back to environment variables');
        return process.env as Record<string, string>;
      }
      
      throw error;
    }
  }

  /**
   * Store secrets to the configured provider
   */
  async storeSecrets(secrets?: Record<string, string>): Promise<boolean> {
    if (this.config.provider === 'env') {
      logger.warn('Cannot store secrets when using env provider');
      return false;
    }

    try {
      let success = false;

      switch (this.config.provider) {
        case 'aws':
          success = await secretsManager.storeEnvironmentSecrets();
          break;

        case 'vault':
          success = await vaultClient.storeEnvironmentSecrets();
          break;
      }

      if (success) {
        logger.info(`✅ Secrets stored successfully to ${this.config.provider}`);
      } else {
        logger.error(`❌ Failed to store secrets to ${this.config.provider}`);
      }

      return success;
    } catch (error) {
      logger.error('Failed to store secrets:', error);
      return false;
    }
  }

  /**
   * Get a specific secret value
   */
  getSecret(key: string): string | undefined {
    return process.env[key];
  }

  /**
   * Check if a secret exists
   */
  hasSecret(key: string): boolean {
    return !!process.env[key];
  }

  /**
   * Get secrets status
   */
  getStatus(): {
    provider: SecretsProvider;
    loaded: boolean;
    requiredSecretsPresent: boolean;
    missingRequired: string[];
    providerStatus: any;
  } {
    const missingRequired = this.config.required.filter(key => !process.env[key]);
    
    let providerStatus: any = {};
    
    switch (this.config.provider) {
      case 'aws':
        providerStatus = secretsManager.getStatus();
        break;
      case 'vault':
        providerStatus = vaultClient.getStatus();
        break;
      case 'env':
        providerStatus = { source: 'environment variables' };
        break;
    }

    return {
      provider: this.config.provider,
      loaded: this.loaded,
      requiredSecretsPresent: missingRequired.length === 0,
      missingRequired,
      providerStatus,
    };
  }

  /**
   * Validate secrets configuration
   */
  validateConfiguration(): boolean {
    switch (this.config.provider) {
      case 'aws':
        return this.validateAWSConfiguration();
      case 'vault':
        return this.validateVaultConfiguration();
      case 'env':
        return true;
      default:
        logger.error(`Unknown secrets provider: ${this.config.provider}`);
        return false;
    }
  }

  private validateAWSConfiguration(): boolean {
    const required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.error(`Missing AWS Secrets Manager configuration: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  }

  private validateVaultConfiguration(): boolean {
    const required = ['VAULT_ADDR', 'VAULT_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.error(`Missing Vault configuration: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Clear cached secrets
   */
  clearCache(): void {
    this.loaded = false;
    
    switch (this.config.provider) {
      case 'aws':
        secretsManager.clearCache();
        break;
      case 'vault':
        vaultClient.clearCache();
        break;
    }
    
    logger.debug('Secrets cache cleared');
  }

  /**
   * Reload secrets
   */
  async reloadSecrets(): Promise<Record<string, string>> {
    this.clearCache();
    return await this.loadSecrets();
  }

  /**
   * Health check for secrets provider
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    provider: SecretsProvider;
    error?: string;
  }> {
    try {
      switch (this.config.provider) {
        case 'aws':
          // Test AWS Secrets Manager connectivity
          const awsSecret = await secretsManager.getSecret();
          return { healthy: true, provider: 'aws' };

        case 'vault':
          // Test Vault connectivity
          const vaultHealth = await vaultClient.getHealthStatus();
          return { 
            healthy: vaultHealth.healthy, 
            provider: 'vault',
            error: vaultHealth.error
          };

        case 'env':
          // Environment variables are always available
          return { healthy: true, provider: 'env' };

        default:
          return { 
            healthy: false, 
            provider: this.config.provider,
            error: 'Unknown provider'
          };
      }
    } catch (error) {
      return {
        healthy: false,
        provider: this.config.provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const secretsService = new SecretsService();

// Helper functions for common operations
export const initializeSecrets = async (): Promise<void> => {
  logger.info('🔐 Initializing secrets management...');
  
  // Validate configuration
  const configValid = secretsService.validateConfiguration();
  if (!configValid) {
    throw new Error('Invalid secrets configuration');
  }
  
  // Load secrets
  await secretsService.loadSecrets();
  
  // Log status
  const status = secretsService.getStatus();
  logger.info('Secrets management initialized:', {
    provider: status.provider,
    loaded: status.loaded,
    requiredSecretsPresent: status.requiredSecretsPresent,
  });
  
  if (!status.requiredSecretsPresent) {
    logger.error('Required secrets missing:', status.missingRequired);
    throw new Error(`Missing required secrets: ${status.missingRequired.join(', ')}`);
  }
};

export const getSecret = (key: string, defaultValue?: string): string | undefined => {
  return secretsService.getSecret(key) || defaultValue;
};

export const requireSecret = (key: string): string => {
  const value = secretsService.getSecret(key);
  if (!value) {
    throw new Error(`Required secret ${key} is not set`);
  }
  return value;
};

export const secretsHealthCheck = async () => {
  return await secretsService.healthCheck();
};

export default secretsService;