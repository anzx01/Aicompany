/**
 * LLM Cost Calculation Utilities
 *
 * Provides functions for calculating LLM API costs
 */

/**
 * Model pricing (per 1M tokens)
 */
const MODEL_PRICING = {
  // Claude models
  'claude-3-5-sonnet-20241022': {
    input: 3.0,
    output: 15.0,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25,
    cacheWrite: 0.30,
    cacheRead: 0.03,
  },
  // DeepSeek models
  'deepseek-chat': {
    input: 0.14,
    output: 0.28,
    cacheWrite: 0.14,
    cacheRead: 0.014,
  },
  // OpenAI models (for embeddings)
  'text-embedding-3-small': {
    input: 0.02,
    output: 0,
    cacheWrite: 0,
    cacheRead: 0,
  },
} as const;

/**
 * Calculate cost for a given model and token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

  if (!pricing) {
    console.warn(`Unknown model: ${model}, returning 0 cost`);
    return 0;
  }

  const inputCost = (inputTokens * pricing.input) / 1_000_000;
  const outputCost = (outputTokens * pricing.output) / 1_000_000;

  return inputCost + outputCost;
}

/**
 * Calculate cost with prompt caching
 */
export function calculatePromptCachingCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number
): number {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];

  if (!pricing) {
    console.warn(`Unknown model: ${model}, returning 0 cost`);
    return 0;
  }

  const regularInputTokens = inputTokens - cachedTokens;
  const cachedCost = (cachedTokens * pricing.cacheRead) / 1_000_000;
  const inputCost = (regularInputTokens * pricing.input) / 1_000_000;
  const outputCost = (outputTokens * pricing.output) / 1_000_000;

  return cachedCost + inputCost + outputCost;
}

/**
 * Estimate total cost for a period
 */
export function estimateTotalCost(params: {
  agentCount: number;
  tasksPerDay: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  cacheHitRate: number;
}): {
  dailyCost: number;
  monthlyCost: number;
  withoutCaching: number;
  savings: number;
  savingsPercentage: number;
} {
  const { agentCount, tasksPerDay, avgInputTokens, avgOutputTokens, cacheHitRate } = params;

  // Use DeepSeek as default model for estimation
  const model = 'deepseek-chat';

  // Calculate cost per task with caching
  const cachedTokens = Math.floor(avgInputTokens * cacheHitRate);
  const costPerTask = calculatePromptCachingCost(
    model,
    avgInputTokens,
    avgOutputTokens,
    cachedTokens
  );

  // Calculate cost per task without caching
  const costPerTaskWithoutCaching = calculateCost(model, avgInputTokens, avgOutputTokens);

  // Calculate daily and monthly costs
  const dailyCost = costPerTask * tasksPerDay * agentCount;
  const monthlyCost = dailyCost * 30;

  // Calculate savings
  const withoutCaching = costPerTaskWithoutCaching * tasksPerDay * agentCount * 30;
  const savings = withoutCaching - monthlyCost;
  const savingsPercentage = withoutCaching > 0 ? (savings / withoutCaching) * 100 : 0;

  return {
    dailyCost,
    monthlyCost,
    withoutCaching,
    savings,
    savingsPercentage,
  };
}

/**
 * Get model pricing information
 */
export function getModelPricing(model: string) {
  return MODEL_PRICING[model as keyof typeof MODEL_PRICING] || null;
}

/**
 * Get all available models
 */
export function getAvailableModels(): string[] {
  return Object.keys(MODEL_PRICING);
}
