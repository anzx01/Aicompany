// LLM Service Types

export type ModelTier = 'fast' | 'balanced' | 'powerful'

export type ModelProvider = 'anthropic' | 'openai'

export interface ModelConfig {
  provider: ModelProvider
  model: string
  maxTokens: number
  temperature: number
  costPer1kInput: number  // USD per 1k input tokens
  costPer1kOutput: number // USD per 1k output tokens
  supportsCaching?: boolean
  cacheCostPer1kInput?: number // USD per 1k cached input tokens
}

export interface LLMRequest {
  tier: ModelTier
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  temperature?: number
  useCache?: boolean
}

export interface LLMResponse {
  content: string
  model: string
  provider: ModelProvider
  usage: {
    inputTokens: number
    outputTokens: number
    cacheCreationTokens?: number
    cacheReadTokens?: number
  }
  cost: {
    inputCost: number
    outputCost: number
    cacheCost?: number
    totalCost: number
  }
  latency: number // milliseconds
}

export interface LLMError {
  error: string
  provider: ModelProvider
  model: string
  code?: string
}
