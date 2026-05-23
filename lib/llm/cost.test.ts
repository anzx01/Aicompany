/**
 * Cost Calculation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCost,
  calculatePromptCachingCost,
  estimateTotalCost,
} from '@/lib/llm/cost';

describe('Cost Calculation', () => {
  describe('calculateCost', () => {
    it('should calculate cost for Claude Sonnet correctly', () => {
      const cost = calculateCost('claude-3-5-sonnet-20241022', 1000, 500);

      // Input: $3/MTok, Output: $15/MTok
      // (1000 * 3 + 500 * 15) / 1,000,000 = 0.0105
      expect(cost).toBeCloseTo(0.0105, 4);
    });

    it('should calculate cost for DeepSeek correctly', () => {
      const cost = calculateCost('deepseek-chat', 1000, 500);

      // Input: $0.14/MTok, Output: $0.28/MTok
      // (1000 * 0.14 + 500 * 0.28) / 1,000,000 = 0.00028
      expect(cost).toBeCloseTo(0.00028, 6);
    });

    it('should return 0 for unknown model', () => {
      const cost = calculateCost('unknown-model', 1000, 500);
      expect(cost).toBe(0);
    });

    it('should handle zero tokens', () => {
      const cost = calculateCost('claude-3-5-sonnet-20241022', 0, 0);
      expect(cost).toBe(0);
    });
  });

  describe('calculatePromptCachingCost', () => {
    it('should calculate cached cost correctly', () => {
      const cost = calculatePromptCachingCost(
        'claude-3-5-sonnet-20241022',
        1000,
        500,
        800 // 80% cache hit
      );

      // Cache read: $0.30/MTok, Regular input: $3/MTok, Output: $15/MTok
      // (800 * 0.30 + 200 * 3 + 500 * 15) / 1,000,000 = 0.00834
      expect(cost).toBeCloseTo(0.00834, 5);
    });

    it('should handle 100% cache hit', () => {
      const cost = calculatePromptCachingCost(
        'claude-3-5-sonnet-20241022',
        1000,
        500,
        1000
      );

      // All input from cache
      // (1000 * 0.30 + 500 * 15) / 1,000,000 = 0.0078
      expect(cost).toBeCloseTo(0.0078, 4);
    });

    it('should handle 0% cache hit', () => {
      const cost = calculatePromptCachingCost(
        'claude-3-5-sonnet-20241022',
        1000,
        500,
        0
      );

      // Same as regular cost
      const regularCost = calculateCost('claude-3-5-sonnet-20241022', 1000, 500);
      expect(cost).toBe(regularCost);
    });
  });

  describe('estimateTotalCost', () => {
    it('should estimate monthly cost correctly', () => {
      const estimate = estimateTotalCost({
        agentCount: 5,
        tasksPerDay: 10,
        avgInputTokens: 1000,
        avgOutputTokens: 500,
        cacheHitRate: 0.8,
      });

      expect(estimate.dailyCost).toBeGreaterThan(0);
      expect(estimate.monthlyCost).toBe(estimate.dailyCost * 30);
      expect(estimate.withoutCaching).toBeGreaterThan(estimate.monthlyCost);
      expect(estimate.savings).toBeGreaterThan(0);
      expect(estimate.savingsPercentage).toBeGreaterThan(0);
      expect(estimate.savingsPercentage).toBeLessThan(100);
    });

    it('should handle zero tasks', () => {
      const estimate = estimateTotalCost({
        agentCount: 5,
        tasksPerDay: 0,
        avgInputTokens: 1000,
        avgOutputTokens: 500,
        cacheHitRate: 0.8,
      });

      expect(estimate.dailyCost).toBe(0);
      expect(estimate.monthlyCost).toBe(0);
    });
  });
});
