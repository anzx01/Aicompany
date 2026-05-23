// LLM Service - Main service for interacting with LLMs

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { MODEL_CONFIGS, calculateCost } from './config'
import type { LLMRequest, LLMResponse, LLMError } from './types'

// Initialize clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
})

/**
 * Call LLM with automatic model selection based on tier
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse | LLMError> {
  const startTime = Date.now()
  const config = MODEL_CONFIGS[request.tier]

  try {
    if (config.provider === 'anthropic') {
      if (!anthropic) {
        return {
          error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY in .env.local',
          provider: 'anthropic',
          model: config.model,
          code: 'NO_API_KEY',
        }
      }
      return await callAnthropic(request, config, startTime)
    } else {
      return await callOpenAI(request, config, startTime)
    }
  } catch (error: any) {
    return {
      error: error.message || 'Unknown error',
      provider: config.provider,
      model: config.model,
      code: error.code,
    }
  }
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(
  request: LLMRequest,
  config: typeof MODEL_CONFIGS.fast,
  startTime: number
): Promise<LLMResponse> {
  if (!anthropic) {
    throw new Error('Anthropic client not initialized')
  }

  const maxTokens = request.maxTokens || config.maxTokens
  const temperature = request.temperature ?? config.temperature

  // Build message with optional caching
  const systemBlocks: Anthropic.Messages.MessageCreateParams['system'] = []

  if (request.useCache && config.supportsCaching) {
    // Use prompt caching for system prompt
    systemBlocks.push({
      type: 'text',
      text: request.systemPrompt,
      cache_control: { type: 'ephemeral' },
    })
  } else {
    systemBlocks.push({
      type: 'text',
      text: request.systemPrompt,
    })
  }

  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: maxTokens,
    temperature,
    system: systemBlocks,
    messages: [
      {
        role: 'user',
        content: request.userPrompt,
      },
    ],
  })

  const latency = Date.now() - startTime

  // Extract usage information
  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const cacheCreationTokens = (response.usage as any).cache_creation_input_tokens || 0
  const cacheReadTokens = (response.usage as any).cache_read_input_tokens || 0

  // Calculate costs
  const cost = calculateCost(
    config,
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheReadTokens
  )

  // Extract content
  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as Anthropic.Messages.TextBlock).text)
    .join('\n')

  return {
    content,
    model: config.model,
    provider: 'anthropic',
    usage: {
      inputTokens,
      outputTokens,
      cacheCreationTokens,
      cacheReadTokens,
    },
    cost,
    latency,
  }
}

/**
 * Call OpenAI GPT API
 */
async function callOpenAI(
  request: LLMRequest,
  config: typeof MODEL_CONFIGS.powerful,
  startTime: number
): Promise<LLMResponse> {
  const maxTokens = request.maxTokens || config.maxTokens
  const temperature = request.temperature ?? config.temperature

  const response = await openai.chat.completions.create({
    model: config.model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'system',
        content: request.systemPrompt,
      },
      {
        role: 'user',
        content: request.userPrompt,
      },
    ],
  })

  const latency = Date.now() - startTime

  // Extract usage information
  const inputTokens = response.usage?.prompt_tokens || 0
  const outputTokens = response.usage?.completion_tokens || 0

  // Calculate costs
  const cost = calculateCost(config, inputTokens, outputTokens)

  // Extract content
  const content = response.choices[0]?.message?.content || ''

  return {
    content,
    model: config.model,
    provider: 'openai',
    usage: {
      inputTokens,
      outputTokens,
    },
    cost,
    latency,
  }
}

/**
 * Batch call multiple LLM requests in parallel
 */
export async function batchCallLLM(
  requests: LLMRequest[]
): Promise<Array<LLMResponse | LLMError>> {
  return Promise.all(requests.map((request) => callLLM(request)))
}

/**
 * Stream LLM response (for real-time UI updates)
 * Note: This is a simplified version. Full streaming implementation would require
 * more complex handling of SSE (Server-Sent Events) or WebSockets
 */
export async function* streamLLM(request: LLMRequest): AsyncGenerator<string> {
  const config = MODEL_CONFIGS[request.tier]

  if (config.provider === 'anthropic') {
    if (!anthropic) {
      throw new Error('Anthropic client not initialized')
    }

    const stream = await anthropic.messages.stream({
      model: config.model,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature ?? config.temperature,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text
      }
    }
  } else {
    // OpenAI streaming
    const stream = await openai.chat.completions.create({
      model: config.model,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature ?? config.temperature,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt,
        },
        {
          role: 'user',
          content: request.userPrompt,
        },
      ],
      stream: true,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
