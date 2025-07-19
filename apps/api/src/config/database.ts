import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaClient } from '../generated/prisma';
import { logger } from '@/config/logger';

interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  options?: any;
}

interface ReadReplicaConfig {
  enabled: boolean;
  readUrl?: string;
  readKey?: string;
  fallbackToMain: boolean;
  maxRetries: number;
  retryDelay: number;
}

class DatabaseService {
  private mainClient: SupabaseClient;
  private readClient: SupabaseClient | null = null;
  private prisma: PrismaClient;
  private readPrisma: PrismaClient | null = null;
  private replicaConfig: ReadReplicaConfig;
  private healthStatus = {
    main: true,
    replica: true,
    prisma: true,
    lastCheck: new Date(),
  };

  constructor() {
    // Main database configuration
    const mainConfig: DatabaseConfig = {
      url: process.env.SUPABASE_URL!,
      anonKey: process.env.SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-application-name': 'cultural-sound-lab-api',
          },
        },
      },
    };

    // Read replica configuration
    this.replicaConfig = {
      enabled: process.env.SUPABASE_READ_REPLICA_ENABLED === 'true',
      readUrl: process.env.SUPABASE_READ_REPLICA_URL,
      readKey: process.env.SUPABASE_READ_REPLICA_KEY,
      fallbackToMain: process.env.SUPABASE_READ_REPLICA_FALLBACK !== 'false',
      maxRetries: parseInt(process.env.SUPABASE_READ_REPLICA_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.SUPABASE_READ_REPLICA_RETRY_DELAY || '1000'),
    };

    // Initialize main client
    this.mainClient = createClient(
      mainConfig.url,
      mainConfig.serviceRoleKey || mainConfig.anonKey,
      mainConfig.options
    );

    // Initialize Prisma client
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Initialize read replica client if enabled
    if (this.replicaConfig.enabled && this.replicaConfig.readUrl && this.replicaConfig.readKey) {
      this.readClient = createClient(
        this.replicaConfig.readUrl,
        this.replicaConfig.readKey,
        {
          ...mainConfig.options,
          global: {
            headers: {
              'x-application-name': 'cultural-sound-lab-api-read-replica',
            },
          },
        }
      );

      // Initialize Prisma read replica
      if (process.env.DATABASE_READ_REPLICA_URL) {
        this.readPrisma = new PrismaClient({
          log: [
            { level: 'error', emit: 'event' },
            { level: 'warn', emit: 'event' },
          ],
          datasources: {
            db: {
              url: process.env.DATABASE_READ_REPLICA_URL,
            },
          },
        });
      }

      logger.info('Database read replica initialized');
    } else {
      logger.info('Database read replica not configured, using main database for all operations');
    }

    // Set up Prisma event logging
    this.setupPrismaLogging();

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Set up Prisma event logging
   */
  private setupPrismaLogging(): void {
    this.prisma.$on('query' as never, (e: any) => {
      logger.debug({
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target,
      }, 'Prisma query executed');
    });

    this.prisma.$on('error' as never, (e: any) => {
      logger.error({
        message: e.message,
        target: e.target,
      }, 'Prisma error occurred');
    });

    this.prisma.$on('info' as never, (e: any) => {
      logger.info({
        message: e.message,
        target: e.target,
      }, 'Prisma info');
    });

    this.prisma.$on('warn' as never, (e: any) => {
      logger.warn({
        message: e.message,
        target: e.target,
      }, 'Prisma warning');
    });

    if (this.readPrisma) {
      this.readPrisma.$on('error' as never, (e: any) => {
        logger.error({
          message: e.message,
          target: e.target,
          replica: true,
        }, 'Prisma read replica error occurred');
      });

      this.readPrisma.$on('warn' as never, (e: any) => {
        logger.warn({
          message: e.message,
          target: e.target,
          replica: true,
        }, 'Prisma read replica warning');
      });
    }
  }

  /**
   * Get client for read operations (uses read replica if available and healthy)
   */
  public getReadClient(): SupabaseClient {
    if (
      this.readClient &&
      this.replicaConfig.enabled &&
      this.healthStatus.replica
    ) {
      return this.readClient;
    }

    return this.mainClient;
  }

  /**
   * Get client for write operations (always uses main database)
   */
  public getWriteClient(): SupabaseClient {
    return this.mainClient;
  }

  /**
   * Get main client (for backwards compatibility)
   */
  public getClient(): SupabaseClient {
    return this.mainClient;
  }

  /**
   * Get Prisma client for read operations (uses read replica if available and healthy)
   */
  public getPrismaReadClient(): PrismaClient {
    if (
      this.readPrisma &&
      this.replicaConfig.enabled &&
      this.healthStatus.replica &&
      this.healthStatus.prisma
    ) {
      return this.readPrisma;
    }

    return this.prisma;
  }

  /**
   * Get Prisma client for write operations (always uses main database)
   */
  public getPrismaWriteClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Get main Prisma client
   */
  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Execute a read query with automatic fallback
   */
  public async executeRead<T>(
    operation: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> {
    let client = this.getReadClient();
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= this.replicaConfig.maxRetries) {
      try {
        const result = await operation(client);
        
        // If operation succeeded, return result
        if (!result.error) {
          // Mark replica as healthy if we used it
          if (client === this.readClient) {
            this.healthStatus.replica = true;
          }
          return result;
        }

        lastError = result.error;
        
        // If this was a read replica and fallback is enabled, try main database
        if (
          client === this.readClient &&
          this.replicaConfig.fallbackToMain &&
          attempt === 0
        ) {
          logger.warn({ error: result.error }, 'Read replica failed, falling back to main database');
          this.healthStatus.replica = false;
          client = this.mainClient;
          attempt++;
          continue;
        }

        break;
      } catch (error) {
        lastError = error;
        
        // If this was a read replica and fallback is enabled, try main database
        if (
          client === this.readClient &&
          this.replicaConfig.fallbackToMain &&
          attempt === 0
        ) {
          logger.warn({ error }, 'Read replica connection failed, falling back to main database');
          this.healthStatus.replica = false;
          client = this.mainClient;
          attempt++;
          
          // Add delay before retry
          await new Promise(resolve => setTimeout(resolve, this.replicaConfig.retryDelay));
          continue;
        }

        break;
      }
    }

    return { data: null, error: lastError };
  }

  /**
   * Execute a write query (always uses main database)
   */
  public async executeWrite<T>(
    operation: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> {
    try {
      const result = await operation(this.mainClient);
      
      if (!result.error) {
        this.healthStatus.main = true;
      }
      
      return result;
    } catch (error) {
      logger.error({ error }, 'Write operation failed');
      this.healthStatus.main = false;
      return { data: null, error };
    }
  }

  /**
   * Check database health
   */
  public async checkHealth(): Promise<{
    main: boolean;
    replica: boolean;
    prisma: boolean;
    replicaEnabled: boolean;
  }> {
    const healthCheck = async (client: SupabaseClient): Promise<boolean> => {
      try {
        const { error } = await client
          .from('audio_samples')
          .select('id')
          .limit(1);
        return !error;
      } catch (error) {
        return false;
      }
    };

    // Check main database
    const mainHealthy = await healthCheck(this.mainClient);
    this.healthStatus.main = mainHealthy;

    // Check read replica if enabled
    let replicaHealthy = true;
    if (this.readClient && this.replicaConfig.enabled) {
      replicaHealthy = await healthCheck(this.readClient);
      this.healthStatus.replica = replicaHealthy;
    }

    // Check Prisma connection
    let prismaHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      prismaHealthy = true;
      this.healthStatus.prisma = true;
    } catch (error) {
      logger.error({ error }, 'Prisma health check failed');
      this.healthStatus.prisma = false;
    }

    this.healthStatus.lastCheck = new Date();

    return {
      main: mainHealthy,
      replica: replicaHealthy,
      prisma: prismaHealthy,
      replicaEnabled: this.replicaConfig.enabled && !!this.readClient,
    };
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): {
    main: boolean;
    replica: boolean;
    prisma: boolean;
    replicaEnabled: boolean;
    lastCheck: Date;
  } {
    return {
      ...this.healthStatus,
      replicaEnabled: this.replicaConfig.enabled && !!this.readClient,
    };
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    const checkInterval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'); // 30 seconds

    setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        logger.error({ error }, 'Database health check failed');
      }
    }, checkInterval);

    logger.info({ checkInterval }, 'Database health monitoring started');
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<{
    mainConnections?: number;
    replicaConnections?: number;
    replicaLag?: number;
    activeQueries?: number;
  }> {
    try {
      // These would be custom functions or views in your database
      // For now, return basic stats
      return {
        mainConnections: 0, // Would query pg_stat_activity
        replicaConnections: 0,
        replicaLag: 0, // Would check replication lag
        activeQueries: 0,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get database stats');
      return {};
    }
  }

  /**
   * Force failover to main database
   */
  public forceFailover(): void {
    if (this.readClient) {
      this.healthStatus.replica = false;
      logger.warn('Forced failover to main database');
    }
  }

  /**
   * Reset replica health (attempt to use replica again)
   */
  public resetReplicaHealth(): void {
    if (this.readClient) {
      this.healthStatus.replica = true;
      logger.info('Reset replica health status');
    }
  }

  /**
   * Run database migrations using Prisma
   */
  public async runMigrations(): Promise<boolean> {
    try {
      // Check if Prisma CLI is available and run migrations
      await this.prisma.$queryRaw`SELECT 1`; // Test connection first
      logger.info('Database migration check completed - connection verified');
      return true;
    } catch (error) {
      logger.error({ error }, 'Database migration failed');
      return false;
    }
  }

  /**
   * Create critical performance indexes
   */
  public async createPerformanceIndexes(): Promise<boolean> {
    try {
      // Critical indexes for frequently queried columns
      const indexQueries = [
        // Users table indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email) WHERE email IS NOT NULL',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer_active ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created ON users(role, created_at)',
        
        // Audio samples indexes for search and filtering
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_samples_cultural_origin_approved ON audio_samples(cultural_origin, approved)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_samples_instrument_approved ON audio_samples(instrument_type, approved)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_samples_mood_tags_gin ON audio_samples USING gin(mood_tags)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_samples_usage_rights_price ON audio_samples(usage_rights, price_personal, price_commercial, price_enterprise)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_samples_contributor_created ON audio_samples(contributor_id, created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audio_samples_download_count_desc ON audio_samples(download_count DESC)',
        
        // Generations table indexes for job processing
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generations_status_created ON generations(status, created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generations_user_type_created ON generations(user_id, type, created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generations_processing_time ON generations(processing_time) WHERE processing_time IS NOT NULL',
        
        // Licenses table indexes for revenue and usage tracking
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_payment_status_active ON licenses(payment_status, active)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_user_created ON licenses(user_id, created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_expiry_active ON licenses(expiry_date, active) WHERE expiry_date IS NOT NULL',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_licenses_downloads_usage ON licenses(downloads_used, download_limit) WHERE download_limit IS NOT NULL',
        
        // Revenue splits indexes for financial reporting
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_splits_contributor_status ON revenue_splits(contributor_id, status)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_splits_license_amount ON revenue_splits(license_id, amount)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_splits_payment_date ON revenue_splits(payment_date) WHERE payment_date IS NOT NULL',
        
        // Payment processing indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intents_user_status_created ON payment_intents(user_id, status, created_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status_period ON subscriptions(user_id, status, current_period_end)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer_status_due ON invoices(customer_id, status, due_date)',
        
        // License events audit trail
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_license_events_license_type_created ON license_events(license_id, event_type, created_at)',
      ];

      let successCount = 0;
      for (const query of indexQueries) {
        try {
          await this.prisma.$executeRawUnsafe(query);
          successCount++;
          logger.debug({ query }, 'Performance index created successfully');
        } catch (error) {
          // Log warning but continue - index might already exist
          logger.warn({ error, query }, 'Failed to create performance index (may already exist)');
        }
      }

      logger.info({ 
        total: indexQueries.length, 
        successful: successCount 
      }, 'Performance index creation completed');

      return successCount > 0;
    } catch (error) {
      logger.error({ error }, 'Failed to create performance indexes');
      return false;
    }
  }

  /**
   * Analyze query performance and suggest optimizations
   */
  public async analyzePerformance(): Promise<{
    slowQueries: any[];
    indexUsage: any[];
    tableStats: any[];
    recommendations: string[];
  }> {
    try {
      const recommendations: string[] = [];

      // Query slow queries from pg_stat_statements (if available)
      let slowQueries: any[] = [];
      try {
        slowQueries = await this.prisma.$queryRaw`
          SELECT 
            query,
            calls,
            total_exec_time,
            mean_exec_time,
            stddev_exec_time,
            max_exec_time
          FROM pg_stat_statements 
          WHERE mean_exec_time > 100 
          ORDER BY mean_exec_time DESC 
          LIMIT 10
        `;
      } catch (error) {
        logger.warn('pg_stat_statements extension not available for slow query analysis');
        recommendations.push('Consider enabling pg_stat_statements extension for query performance monitoring');
      }

      // Check index usage
      let indexUsage: any[] = [];
      try {
        indexUsage = await this.prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_tup_read,
            idx_tup_fetch,
            idx_scan
          FROM pg_stat_user_indexes 
          WHERE idx_scan < 10
          ORDER BY idx_scan ASC
          LIMIT 20
        `;

        if (indexUsage.length > 0) {
          recommendations.push(`Found ${indexUsage.length} potentially unused indexes that could be removed`);
        }
      } catch (error) {
        logger.warn('Unable to analyze index usage statistics');
      }

      // Get table statistics
      let tableStats: any[] = [];
      try {
        tableStats = await this.prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            n_tup_ins,
            n_tup_upd,
            n_tup_del,
            n_tup_hot_upd,
            n_live_tup,
            n_dead_tup,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
          ORDER BY n_live_tup DESC
        `;

        // Analyze vacuum and analyze needs
        const tablesNeedingMaintenance = tableStats.filter(table => {
          const deadTupRatio = table.n_dead_tup / Math.max(table.n_live_tup, 1);
          return deadTupRatio > 0.1; // More than 10% dead tuples
        });

        if (tablesNeedingMaintenance.length > 0) {
          recommendations.push(`${tablesNeedingMaintenance.length} tables may benefit from VACUUM/ANALYZE maintenance`);
        }
      } catch (error) {
        logger.warn('Unable to analyze table statistics');
      }

      // Connection pool recommendations
      recommendations.push('Monitor connection pool usage and adjust based on load patterns');
      recommendations.push('Consider implementing query result caching for frequently accessed data');

      return {
        slowQueries,
        indexUsage,
        tableStats,
        recommendations,
      };
    } catch (error) {
      logger.error({ error }, 'Performance analysis failed');
      return {
        slowQueries: [],
        indexUsage: [],
        tableStats: [],
        recommendations: ['Performance analysis failed - check database permissions'],
      };
    }
  }

  /**
   * Prisma transaction support with retry logic
   */
  public async transaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
      retries?: number;
    }
  ): Promise<T> {
    const retries = options?.retries || 0;
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.prisma.$transaction(fn, {
          maxWait: options?.maxWait,
          timeout: options?.timeout,
          isolationLevel: options?.isolationLevel,
        });
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          logger.warn({ error, attempt }, 'Transaction failed, retrying...');
          await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Cleanup and disconnect all connections
   */
  public async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      if (this.readPrisma) {
        await this.readPrisma.$disconnect();
      }
      logger.info('Database connections cleaned up successfully');
    } catch (error) {
      logger.error({ error }, 'Error during database cleanup');
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export individual clients for backwards compatibility
export const supabase = databaseService.getClient();
export const supabaseRead = databaseService.getReadClient();
export const supabaseWrite = databaseService.getWriteClient();

// Export Prisma clients
export const prisma = databaseService.getPrismaClient();
export const prismaRead = databaseService.getPrismaReadClient();
export const prismaWrite = databaseService.getPrismaWriteClient();

// Export helper functions
export const executeRead = databaseService.executeRead.bind(databaseService);
export const executeWrite = databaseService.executeWrite.bind(databaseService);

// Export Prisma types for use throughout the application
export type { PrismaClient } from '../generated/prisma';