// LLM Model Configuration

import { ModelConfig, ModelTier } from './types'

// Model pricing as of 2025 (USD per 1M tokens)
export const MODEL_CONFIGS: Record<ModelTier, ModelConfig> = {
  // Fast tier: DeepSeek Chat - Best for simple tasks
  fast: {
    provider: 'openai',
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    costPer1kInput: 0.001,      // $1 per 1M input tokens
    costPer1kOutput: 0.002,     // $2 per 1M output tokens
    supportsCaching: false,
  },

  // Balanced tier: DeepSeek Chat - Best for most tasks
  balanced: {
    provider: 'openai',
    model: 'deepseek-chat',
    maxTokens: 8192,
    temperature: 0.7,
    costPer1kInput: 0.001,      // $1 per 1M input tokens
    costPer1kOutput: 0.002,     // $2 per 1M output tokens
    supportsCaching: false,
  },

  // Powerful tier: DeepSeek Chat - Best for complex reasoning
  powerful: {
    provider: 'openai',
    model: 'deepseek-chat',
    maxTokens: 4096,
    temperature: 0.7,
    costPer1kInput: 0.001,      // $1 per 1M input tokens (DeepSeek pricing)
    costPer1kOutput: 0.002,     // $2 per 1M output tokens
    supportsCaching: false,
  },
}

// Task-to-tier mapping recommendations
export const TASK_TIER_RECOMMENDATIONS: Record<string, ModelTier> = {
  // Fast tier tasks
  'social_media_post': 'fast',
  'email_draft': 'fast',
  'simple_summary': 'fast',
  'keyword_extraction': 'fast',
  'sentiment_analysis': 'fast',

  // Balanced tier tasks
  'content_generation': 'balanced',
  'code_review': 'balanced',
  'task_planning': 'balanced',
  'decision_making': 'balanced',
  'report_generation': 'balanced',

  // Powerful tier tasks
  'complex_analysis': 'powerful',
  'strategic_planning': 'powerful',
  'code_generation': 'powerful',
  'research_synthesis': 'powerful',
  'architecture_design': 'powerful',
}

// Get recommended tier for a task type
export function getRecommendedTier(taskType: string): ModelTier {
  return TASK_TIER_RECOMMENDATIONS[taskType] || 'balanced'
}

// Calculate cost for a given usage
export function calculateCost(
  config: ModelConfig,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens: number = 0,
  cacheReadTokens: number = 0
): {
  inputCost: number
  outputCost: number
  cacheCost: number
  totalCost: number
} {
  const inputCost = (inputTokens / 1000) * config.costPer1kInput
  const outputCost = (outputTokens / 1000) * config.costPer1kOutput

  let cacheCost = 0
  if (config.supportsCaching && config.cacheCostPer1kInput) {
    // Cache creation cost (full price)
    cacheCost += (cacheCreationTokens / 1000) * config.costPer1kInput
    // Cache read cost (discounted price)
    cacheCost += (cacheReadTokens / 1000) * config.cacheCostPer1kInput
  }

  return {
    inputCost,
    outputCost,
    cacheCost,
    totalCost: inputCost + outputCost + cacheCost,
  }
}
