/**
 * Error Handling Utilities
 *
 * Retry strategy and rate limiting for platform integrations
 */

/**
 * Retry Strategy
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export class RetryStrategy {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 30000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      retryableErrors: options.retryableErrors ?? [
        'ETIMEDOUT',
        'ECONNRESET',
        'ENOTFOUND',
        'RATE_LIMIT',
        '429',
        '500',
        '502',
        '503',
        '504',
      ],
    };
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.options.initialDelay;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        if (!isRetryable || attempt === this.options.maxRetries) {
          throw error;
        }

        // Log retry attempt
        console.log(
          `[RetryStrategy] Attempt ${attempt + 1}/${this.options.maxRetries} failed. Retrying in ${delay}ms...`,
          error.message
        );

        // Wait before retrying
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(delay * this.options.backoffMultiplier, this.options.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    const statusCode = error.statusCode?.toString() || error.status?.toString() || '';

    return this.options.retryableErrors!.some(
      (retryableError) =>
        errorMessage.includes(retryableError) ||
        errorCode.includes(retryableError) ||
        statusCode.includes(retryableError)
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Rate Limiter
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];

    // Remove old requests outside the window
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      const oldestRequest = timestamps[0];
      const resetTime = oldestRequest + this.config.windowMs;
      const waitTime = resetTime - now;

      console.log(
        `[RateLimiter] Rate limit exceeded for ${key}. Reset in ${waitTime}ms`
      );
      throw new Error('Rate limit exceeded');
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(key, timestamps);

    return true;
  }

  /**
   * Wait until rate limit allows request
   */
  async waitForLimit(key: string): Promise<void> {
    while (true) {
      try {
        await this.checkLimit(key);
        break;
      } catch (error) {
        await this.sleep(1000);
      }
    }
  }

  /**
   * Execute function with rate limiting
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    await this.waitForLimit(key);
    return await fn();
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    return Math.max(0, this.config.maxRequests - timestamps.length);
  }

  /**
   * Get reset time for rate limit
   */
  getResetTime(key: string): Date | null {
    const timestamps = this.requests.get(key);
    if (!timestamps || timestamps.length === 0) {
      return null;
    }

    const oldestRequest = timestamps[0];
    return new Date(oldestRequest + this.config.windowMs);
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Platform Error
 */
export class PlatformError extends Error {
  constructor(
    public platformId: string,
    public code: string,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}
