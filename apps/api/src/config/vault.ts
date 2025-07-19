import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

interface VaultConfig {
  addr: string;
  token: string;
  namespace?: string;
  enabled: boolean;
  secretPath: string;
  cacheTtl: number;
  authMethod: 'token' | 'aws' | 'kubernetes';
  retryAttempts: number;
  retryDelay: number;
}

interface VaultSecret {
  [key: string]: string | number | boolean;
}

interface VaultResponse {
  data: {
    data: VaultSecret;
    metadata?: {
      version: number;
      created_time: string;
      deletion_time?: string;
      destroyed: boolean;
    };
  };
}

class VaultClient {
  private client: AxiosInstance | null = null;
  private config: VaultConfig;
  private cache: Map<string, { value: VaultSecret; expiry: number }> = new Map();
  private authenticated: boolean = false;

  constructor() {
    this.config = {
      addr: process.env.VAULT_ADDR || 'https://vault.company.com',
      token: process.env.VAULT_TOKEN || '',
      namespace: process.env.VAULT_NAMESPACE,
      enabled: process.env.SECRETS_PROVIDER === 'vault' && !!process.env.VAULT_ADDR,
      secretPath: process.env.VAULT_SECRET_PATH || 'cultural-sound-lab',
      cacheTtl: parseInt(process.env.VAULT_CACHE_TTL || '300') * 1000, // 5 minutes default
      authMethod: (process.env.VAULT_AUTH_METHOD as 'token' | 'aws' | 'kubernetes') || 'token',
      retryAttempts: parseInt(process.env.VAULT_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.VAULT_RETRY_DELAY || '1000'),
    };

    if (this.config.enabled) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    try {
      this.client = axios.create({
        baseURL: this.config.addr,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.namespace && { 'X-Vault-Namespace': this.config.namespace }),
        },
      });

      // Add request interceptor for authentication
      this.client.interceptors.request.use((config) => {
        if (this.config.token) {
          config.headers['X-Vault-Token'] = this.config.token;
        }
        return config;
      });

      // Add response interceptor for error handling
      this.client.interceptors.response.use(
        (response) => response,
        (error) => {
          logger.error('Vault API error:', {
            status: error.response?.status,
            message: error.response?.data?.errors || error.message,
            path: error.config?.url,
          });
          return Promise.reject(error);
        }
      );

      logger.info('Vault client initialized');
    } catch (error) {
      logger.error('Failed to initialize Vault client:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Authenticate with Vault using the configured auth method
   */
  async authenticate(): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    if (this.config.authMethod === 'token' && this.config.token) {
      // Token authentication - just verify the token is valid
      try {
        await this.client.get('/v1/auth/token/lookup-self');
        this.authenticated = true;
        logger.info('Successfully authenticated with Vault using token');
        return true;
      } catch (error) {
        logger.error('Token authentication failed:', error);
        return false;
      }
    }

    // TODO: Implement AWS and Kubernetes auth methods
    if (this.config.authMethod === 'aws') {
      logger.warn('AWS auth method not yet implemented');
      return false;
    }

    if (this.config.authMethod === 'kubernetes') {
      logger.warn('Kubernetes auth method not yet implemented');
      return false;
    }

    return false;
  }

  /**
   * Read a secret from Vault
   */
  async readSecret(path?: string): Promise<VaultSecret | null> {
    if (!this.config.enabled || !this.client) {
      logger.debug('Vault not enabled, skipping secret retrieval');
      return null;
    }

    const secretPath = path || this.config.secretPath;
    const cacheKey = secretPath;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      logger.debug(`Returning cached secret for ${secretPath}`);
      return cached.value;
    }

    if (!this.authenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        logger.error('Failed to authenticate with Vault');
        return null;
      }
    }

    try {
      // Try KV v2 first, then fall back to KV v1
      let response: VaultResponse;
      
      try {
        // KV v2 format: /v1/secret/data/path
        response = await this.client.get(`/v1/secret/data/${secretPath}`);
        
        if (!response.data?.data?.data) {
          throw new Error('No data in KV v2 response');
        }
        
        // Cache the result
        this.cache.set(cacheKey, {
          value: response.data.data.data as unknown as VaultSecret,
          expiry: Date.now() + this.config.cacheTtl,
        });

        logger.info(`Successfully retrieved secret from Vault KV v2: ${secretPath}`);
        return response.data.data.data as unknown as VaultSecret;
      } catch (error) {
        // Fall back to KV v1 format: /v1/secret/path
        logger.debug('KV v2 failed, trying KV v1');
        response = await this.client.get(`/v1/secret/${secretPath}`);
        
        if (!response.data?.data) {
          throw new Error('No data in KV v1 response');
        }

        // Cache the result
        this.cache.set(cacheKey, {
          value: response.data.data as VaultSecret,
          expiry: Date.now() + this.config.cacheTtl,
        });

        logger.info(`Successfully retrieved secret from Vault KV v1: ${secretPath}`);
        return response.data.data as VaultSecret;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Secret not found in Vault: ${secretPath}`);
      } else if (error.response?.status === 403) {
        logger.error(`Access denied to Vault secret: ${secretPath}`);
      } else {
        logger.error(`Failed to read secret from Vault: ${secretPath}`, error);
      }
      return null;
    }
  }

  /**
   * Write a secret to Vault
   */
  async writeSecret(data: VaultSecret, path?: string): Promise<boolean> {
    if (!this.config.enabled || !this.client) {
      return false;
    }

    if (!this.authenticated) {
      const authSuccess = await this.authenticate();
      if (!authSuccess) {
        logger.error('Failed to authenticate with Vault');
        return false;
      }
    }

    const secretPath = path || this.config.secretPath;

    try {
      // Try KV v2 first, then fall back to KV v1
      try {
        // KV v2 format: /v1/secret/data/path
        await this.client.post(`/v1/secret/data/${secretPath}`, {
          data: data,
        });
        logger.info(`Successfully wrote secret to Vault KV v2: ${secretPath}`);
      } catch (error) {
        // Fall back to KV v1 format: /v1/secret/path
        await this.client.post(`/v1/secret/${secretPath}`, data);
        logger.info(`Successfully wrote secret to Vault KV v1: ${secretPath}`);
      }

      // Invalidate cache
      this.cache.delete(secretPath);
      return true;
    } catch (error) {
      logger.error(`Failed to write secret to Vault: ${secretPath}`, error);
      return false;
    }
  }

  /**
   * Load secrets and merge with environment variables
   */
  async loadSecrets(): Promise<Record<string, string>> {
    if (!this.config.enabled) {
      logger.debug('Vault not enabled, using environment variables only');
      return process.env as Record<string, string>;
    }

    try {
      const secrets = await this.readSecret();
      if (!secrets) {
        logger.warn('No secrets retrieved from Vault');
        return process.env as Record<string, string>;
      }

      // Convert all secret values to strings
      const stringSecrets: Record<string, string> = {};
      Object.entries(secrets).forEach(([key, value]) => {
        stringSecrets[key] = String(value);
      });

      // Merge secrets with environment variables (env vars take precedence)
      const mergedConfig = { ...stringSecrets, ...process.env };
      
      logger.info(`Loaded ${Object.keys(stringSecrets).length} secrets from Vault`);
      
      // Update process.env with secrets (only if not already set)
      Object.entries(stringSecrets).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });

      return mergedConfig as Record<string, string>;
    } catch (error) {
      logger.error('Failed to load secrets from Vault:', error);
      logger.warn('Falling back to environment variables only');
      return process.env as Record<string, string>;
    }
  }

  /**
   * Store current environment variables as a secret
   */
  async storeEnvironmentSecrets(path?: string): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

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

    const secretsToStore: VaultSecret = {};
    sensitiveKeys.forEach(key => {
      if (process.env[key]) {
        secretsToStore[key] = process.env[key]!;
      }
    });

    if (Object.keys(secretsToStore).length === 0) {
      logger.warn('No sensitive environment variables found to store');
      return false;
    }

    return await this.writeSecret(secretsToStore, path);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Vault cache cleared');
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    sealed?: boolean;
    version?: string;
    error?: string;
  }> {
    if (!this.config.enabled || !this.client) {
      return { healthy: false, error: 'Vault not enabled' };
    }

    try {
      const response = await this.client.get('/v1/sys/health');
      return {
        healthy: true,
        sealed: response.data.sealed,
        version: response.data.version,
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Get configuration status
   */
  getStatus(): {
    enabled: boolean;
    addr: string;
    secretPath: string;
    authenticated: boolean;
    cacheSize: number;
  } {
    return {
      enabled: this.config.enabled,
      addr: this.config.addr,
      secretPath: this.config.secretPath,
      authenticated: this.authenticated,
      cacheSize: this.cache.size,
    };
  }
}

// Export singleton instance
export const vaultClient = new VaultClient();

// Helper functions
export const loadVaultSecrets = async (): Promise<void> => {
  if (process.env.SECRETS_PROVIDER === 'vault') {
    logger.info('Loading secrets from Vault...');
    await vaultClient.loadSecrets();
  }
};

export const validateVaultConfiguration = (): boolean => {
  if (process.env.SECRETS_PROVIDER === 'vault') {
    const required = ['VAULT_ADDR', 'VAULT_TOKEN'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.error(`Missing required Vault configuration: ${missing.join(', ')}`);
      return false;
    }
  }
  
  return true;
};

// Initialize Vault on module load if configured
if (process.env.SECRETS_PROVIDER === 'vault') {
  loadVaultSecrets().catch(error => {
    logger.error('Failed to load Vault secrets on module initialization:', error);
  });
}

export default vaultClient;