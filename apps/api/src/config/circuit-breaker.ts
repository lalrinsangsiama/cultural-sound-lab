import CircuitBreaker from 'opossum';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { logger } from '@/config/logger';
// Circuit breaker metrics now stored in memory instead of Redis

export interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  rollingCountTimeout: number;
  rollingCountBuckets: number;
  name: string;
  monitoringEnabled: boolean;
}

export interface ServiceMetrics {
  requests: number;
  failures: number;
  successes: number;
  timeouts: number;
  circuitOpenTime?: number;
  averageResponseTime: number;
  lastError?: string;
}

class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private metrics: Map<string, ServiceMetrics> = new Map();
  private readonly defaultConfig: Partial<CircuitBreakerConfig>;

  constructor() {
    this.defaultConfig = {
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '30000'), // 30 seconds
      errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD || '50'), // 50%
      resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT || '60000'), // 1 minute
      rollingCountTimeout: parseInt(process.env.CIRCUIT_BREAKER_ROLLING_TIMEOUT || '60000'), // 1 minute
      rollingCountBuckets: parseInt(process.env.CIRCUIT_BREAKER_ROLLING_BUCKETS || '10'), // 10 buckets
      monitoringEnabled: process.env.CIRCUIT_BREAKER_MONITORING !== 'false',
    };
  }

  /**
   * Create a circuit breaker for HTTP requests
   */
  public createHttpBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    const finalConfig = { ...this.defaultConfig, name: serviceName, ...config };

    const httpFunction = async (requestConfig: AxiosRequestConfig): Promise<AxiosResponse> => {
      const startTime = Date.now();
      
      try {
        const response = await axios(requestConfig);
        this.recordSuccess(serviceName, Date.now() - startTime);
        return response;
      } catch (error) {
        this.recordFailure(serviceName, error, Date.now() - startTime);
        throw error;
      }
    };

    const breaker = new CircuitBreaker(httpFunction, {
      timeout: finalConfig.timeout,
      errorThresholdPercentage: finalConfig.errorThresholdPercentage,
      resetTimeout: finalConfig.resetTimeout,
      rollingCountTimeout: finalConfig.rollingCountTimeout,
      rollingCountBuckets: finalConfig.rollingCountBuckets,
      name: finalConfig.name,
    });

    this.setupBreakerEvents(breaker, serviceName);
    this.breakers.set(serviceName, breaker);
    this.initializeMetrics(serviceName);

    logger.info({ serviceName, config: finalConfig }, 'Circuit breaker created');
    return breaker;
  }

  /**
   * Create a circuit breaker for generic async functions
   */
  public createGenericBreaker<T extends any[], R>(
    serviceName: string,
    asyncFunction: (...args: T) => Promise<R>,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    const finalConfig = { ...this.defaultConfig, name: serviceName, ...config };

    const wrappedFunction = async (...args: T): Promise<R> => {
      const startTime = Date.now();
      
      try {
        const result = await asyncFunction(...args);
        this.recordSuccess(serviceName, Date.now() - startTime);
        return result;
      } catch (error) {
        this.recordFailure(serviceName, error, Date.now() - startTime);
        throw error;
      }
    };

    const breaker = new CircuitBreaker(wrappedFunction, {
      timeout: finalConfig.timeout,
      errorThresholdPercentage: finalConfig.errorThresholdPercentage,
      resetTimeout: finalConfig.resetTimeout,
      rollingCountTimeout: finalConfig.rollingCountTimeout,
      rollingCountBuckets: finalConfig.rollingCountBuckets,
      name: finalConfig.name,
    });

    this.setupBreakerEvents(breaker, serviceName);
    this.breakers.set(serviceName, breaker);
    this.initializeMetrics(serviceName);

    logger.info({ serviceName, config: finalConfig }, 'Generic circuit breaker created');
    return breaker;
  }

  /**
   * Get circuit breaker for a service
   */
  public getBreaker(serviceName: string): CircuitBreaker | null {
    return this.breakers.get(serviceName) || null;
  }

  /**
   * Get metrics for a service
   */
  public getMetrics(serviceName: string): ServiceMetrics | null {
    return this.metrics.get(serviceName) || null;
  }

  /**
   * Get all service metrics
   */
  public getAllMetrics(): Record<string, ServiceMetrics> {
    const allMetrics: Record<string, ServiceMetrics> = {};
    this.metrics.forEach((metrics, serviceName) => {
      allMetrics[serviceName] = { ...metrics };
    });
    return allMetrics;
  }

  /**
   * Get circuit breaker status for all services
   */
  public getServiceStatuses(): Record<string, {
    state: string;
    stats: any;
    metrics: ServiceMetrics;
  }> {
    const statuses: Record<string, any> = {};
    
    this.breakers.forEach((breaker, serviceName) => {
      const metrics = this.metrics.get(serviceName);
      statuses[serviceName] = {
        state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
        stats: breaker.stats,
        metrics: metrics || this.createEmptyMetrics(),
      };
    });

    return statuses;
  }

  /**
   * Force open a circuit breaker
   */
  public forceOpen(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.open();
      logger.warn({ serviceName }, 'Circuit breaker forced open');
    }
  }

  /**
   * Force close a circuit breaker
   */
  public forceClose(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.close();
      logger.info({ serviceName }, 'Circuit breaker forced closed');
    }
  }

  /**
   * Setup event handlers for circuit breaker
   */
  private setupBreakerEvents(breaker: CircuitBreaker, serviceName: string): void {
    breaker.on('open', () => {
      const metrics = this.metrics.get(serviceName);
      if (metrics) {
        metrics.circuitOpenTime = Date.now();
      }
      logger.warn({ serviceName }, 'Circuit breaker opened');
      this.persistMetrics(serviceName);
    });

    breaker.on('halfOpen', () => {
      logger.info({ serviceName }, 'Circuit breaker half-open');
    });

    breaker.on('close', () => {
      const metrics = this.metrics.get(serviceName);
      if (metrics) {
        metrics.circuitOpenTime = undefined;
      }
      logger.info({ serviceName }, 'Circuit breaker closed');
      this.persistMetrics(serviceName);
    });

    breaker.on('reject', () => {
      this.recordRejection(serviceName);
    });

    breaker.on('timeout', () => {
      this.recordTimeout(serviceName);
    });

    breaker.on('failure', (error: Error) => {
      logger.error({ serviceName, error: error.message }, 'Circuit breaker failure');
    });

    breaker.on('success', () => {
      logger.debug({ serviceName }, 'Circuit breaker success');
    });
  }

  /**
   * Initialize metrics for a service
   */
  private initializeMetrics(serviceName: string): void {
    this.metrics.set(serviceName, this.createEmptyMetrics());
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): ServiceMetrics {
    return {
      requests: 0,
      failures: 0,
      successes: 0,
      timeouts: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Record successful request
   */
  private recordSuccess(serviceName: string, responseTime: number): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.requests++;
    metrics.successes++;
    metrics.averageResponseTime = this.updateAverage(
      metrics.averageResponseTime,
      responseTime,
      metrics.successes
    );

    this.persistMetrics(serviceName);
  }

  /**
   * Record failed request
   */
  private recordFailure(serviceName: string, error: any, responseTime: number): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.requests++;
    metrics.failures++;
    metrics.lastError = error?.message || 'Unknown error';
    metrics.averageResponseTime = this.updateAverage(
      metrics.averageResponseTime,
      responseTime,
      metrics.requests
    );

    this.persistMetrics(serviceName);
  }

  /**
   * Record timeout
   */
  private recordTimeout(serviceName: string): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.requests++;
    metrics.timeouts++;
    metrics.lastError = 'Request timeout';

    this.persistMetrics(serviceName);
  }

  /**
   * Record rejection (circuit open)
   */
  private recordRejection(serviceName: string): void {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) return;

    metrics.requests++;
    metrics.lastError = 'Circuit breaker open';

    this.persistMetrics(serviceName);
  }

  /**
   * Update rolling average
   */
  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  /**
   * Persist metrics to Redis for monitoring
   */
  private async persistMetrics(serviceName: string): Promise<void> {
    // Metrics are already stored in memory Map
    // No external persistence needed for single-instance deployment
  }

  /**
   * Load metrics from Redis
   */
  public async loadMetrics(serviceName: string): Promise<void> {
    // Metrics are already in memory - no loading needed
    // For single-instance deployment, metrics persist in memory only
  }

  /**
   * Reset metrics for a service
   */
  public resetMetrics(serviceName: string): void {
    this.metrics.set(serviceName, this.createEmptyMetrics());
    logger.info({ serviceName }, 'Circuit breaker metrics reset');
  }

  /**
   * Get health status of all circuit breakers
   */
  public getHealthStatus(): {
    healthy: string[];
    unhealthy: string[];
    degraded: string[];
  } {
    const healthy: string[] = [];
    const unhealthy: string[] = [];
    const degraded: string[] = [];

    this.breakers.forEach((breaker, serviceName) => {
      if (breaker.opened) {
        unhealthy.push(serviceName);
      } else if (breaker.halfOpen) {
        degraded.push(serviceName);
      } else {
        healthy.push(serviceName);
      }
    });

    return { healthy, unhealthy, degraded };
  }
}

// Export singleton instance
export const circuitBreakerService = new CircuitBreakerService();

// Create pre-configured circuit breakers for common services
export const aiServiceBreaker = circuitBreakerService.createHttpBreaker('ai-service', {
  timeout: 300000, // 5 minutes for AI generation
  errorThresholdPercentage: 60,
  resetTimeout: 120000, // 2 minutes
});

export const stripeBreaker = circuitBreakerService.createHttpBreaker('stripe', {
  timeout: 15000, // 15 seconds
  errorThresholdPercentage: 30,
  resetTimeout: 60000, // 1 minute
});

export const supabaseBreaker = circuitBreakerService.createGenericBreaker(
  'supabase',
  async (operation: () => Promise<any>) => operation(),
  {
    timeout: 10000, // 10 seconds
    errorThresholdPercentage: 40,
    resetTimeout: 30000, // 30 seconds
  }
);