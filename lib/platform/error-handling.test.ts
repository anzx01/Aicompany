/**
 * Platform Error Handling Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformError, RetryStrategy, RateLimiter } from '@/lib/platform/error-handling';

describe('Platform Error Handling', () => {
  describe('PlatformError', () => {
    it('should create error with all properties', () => {
      const error = new PlatformError(
        'twitter',
        'RATE_LIMIT',
        'Rate limit exceeded',
        429
      );

      expect(error.platformId).toBe('twitter');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('PlatformError');
    });

    it('should be instanceof Error', () => {
      const error = new PlatformError('twitter', 'RATE_LIMIT', 'Test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('RetryStrategy', () => {
    let strategy: RetryStrategy;

    beforeEach(() => {
      strategy = new RetryStrategy({
        maxRetries: 3,
        initialDelay: 100,
      });
    });

    it('should succeed on first try', async () => {
      const fn = async () => 'success';
      const result = await strategy.execute(fn);
      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          const error: any = new Error('RATE_LIMIT');
          error.code = 'RATE_LIMIT';
          throw error;
        }
        return 'success';
      };

      const result = await strategy.execute(fn);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Permanent failure');
      };

      await expect(strategy.execute(fn)).rejects.toThrow('Permanent failure');
    });

    it('should use exponential backoff', async () => {
      let attempts = 0;

      const fn = async () => {
        attempts++;
        if (attempts < 4) {
          const error: any = new Error('RATE_LIMIT');
          error.code = 'RATE_LIMIT';
          throw error;
        }
        return 'success';
      };

      const startTime = Date.now();
      await strategy.execute(fn);
      const totalTime = Date.now() - startTime;

      // With exponential backoff: 100ms + 200ms + 400ms = 700ms minimum
      expect(totalTime).toBeGreaterThanOrEqual(600);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      // Should not throw
      await limiter.checkLimit('test');
      await limiter.checkLimit('test');
      await limiter.checkLimit('test');
    });

    it('should throw when limit exceeded', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      await limiter.checkLimit('test');
      await limiter.checkLimit('test');

      await expect(limiter.checkLimit('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('should reset after window expires', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100, // 100ms window
      });

      await limiter.checkLimit('test');
      await limiter.checkLimit('test');

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should not throw
      await limiter.checkLimit('test');
    });

    it('should track different keys separately', async () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      await limiter.checkLimit('key1');
      await limiter.checkLimit('key1');

      // Different key should have its own limit
      await limiter.checkLimit('key2');
      await limiter.checkLimit('key2');

      // Both keys should be at limit
      await expect(limiter.checkLimit('key1')).rejects.toThrow();
      await expect(limiter.checkLimit('key2')).rejects.toThrow();
    });
  });
});
