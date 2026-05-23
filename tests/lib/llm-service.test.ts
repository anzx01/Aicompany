import { describe, it, expect } from 'vitest';
import { LLMService } from '@/lib/llm/service';
import { CostTracker } from '@/lib/llm/cost-tracker';

describe('LLMService', () => {
  it('calculates token cost correctly', () => {
    const cost = CostTracker.calculateCost({
      model: 'deepseek-chat',
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
    });

    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('tracks cost history', () => {
    const tracker = new CostTracker();

    tracker.trackUsage({
      model: 'deepseek-chat',
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
      cost: 0.001,
      timestamp: new Date(),
    });

    const total = tracker.getTotalCost();
    expect(total).toBe(0.001);
  });

  it('applies prompt caching correctly', () => {
    const costWithoutCache = CostTracker.calculateCost({
      model: 'deepseek-chat',
      inputTokens: 10000,
      outputTokens: 1000,
      cacheCreationTokens: 0,
      cacheReadTokens: 0,
    });

    const costWithCache = CostTracker.calculateCost({
      model: 'deepseek-chat',
      inputTokens: 1000,
      outputTokens: 1000,
      cacheCreationTokens: 9000,
      cacheReadTokens: 9000,
    });

    // 使用缓存应该更便宜
    expect(costWithCache).toBeLessThan(costWithoutCache);
  });
});

describe('Model Selection', () => {
  it('selects appropriate model based on task complexity', () => {
    const service = new LLMService();

    // 简单任务应该使用便宜的模型
    const simpleModel = service.selectModel('simple');
    expect(simpleModel).toBe('deepseek-chat');

    // 复杂任务应该使用更强大的模型
    const complexModel = service.selectModel('complex');
    expect(['deepseek-reasoner', 'claude-3-5-sonnet-20241022']).toContain(complexModel);
  });
});
