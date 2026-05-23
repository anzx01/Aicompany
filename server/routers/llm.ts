// LLM Router - tRPC router for LLM operations

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { callLLM, batchCallLLM, trackCost, getCompanyCosts, getAgentCosts, getCompanyAgentsCosts, estimateCost } from '@/lib/llm'
import type { LLMRequest } from '@/lib/llm'

export const llmRouter = router({
  /**
   * Test LLM call with a simple prompt
   */
  test: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['fast', 'balanced', 'powerful']),
        prompt: z.string().min(1).max(10000),
        systemPrompt: z.string().optional(),
        useCache: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const request: LLMRequest = {
        tier: input.tier,
        systemPrompt: input.systemPrompt || 'You are a helpful AI assistant.',
        userPrompt: input.prompt,
        useCache: input.useCache,
      }

      const response = await callLLM(request)

      if ('error' in response) {
        throw new Error(response.error)
      }

      return {
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        cost: response.cost,
        latency: response.latency,
      }
    }),

  /**
   * Call LLM for a specific company/agent
   */
  generate: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        agentId: z.string().uuid().optional(),
        tier: z.enum(['fast', 'balanced', 'powerful']),
        systemPrompt: z.string().min(1),
        userPrompt: z.string().min(1).max(50000),
        useCache: z.boolean().optional(),
        trackCost: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const request: LLMRequest = {
        tier: input.tier,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        useCache: input.useCache,
      }

      const response = await callLLM(request)

      if ('error' in response) {
        throw new Error(response.error)
      }

      // Track cost if enabled
      if (input.trackCost) {
        await trackCost(response, {
          companyId: input.companyId,
          agentId: input.agentId,
        })
      }

      return {
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        cost: response.cost,
        latency: response.latency,
      }
    }),

  /**
   * Batch call multiple LLM requests
   */
  batchCall: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        requests: z.array(
          z.object({
            tier: z.enum(['fast', 'balanced', 'powerful']),
            systemPrompt: z.string().min(1),
            userPrompt: z.string().min(1).max(50000),
            useCache: z.boolean().optional(),
          })
        ).min(1).max(10),
        trackCost: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const responses = await batchCallLLM(input.requests)

      // Track costs for successful responses
      if (input.trackCost) {
        for (const response of responses) {
          if (!('error' in response)) {
            await trackCost(response, {
              companyId: input.companyId,
            })
          }
        }
      }

      return responses.map((response) => {
        if ('error' in response) {
          return {
            error: response.error,
            model: response.model,
            provider: response.provider,
          }
        }

        return {
          content: response.content,
          model: response.model,
          provider: response.provider,
          usage: response.usage,
          cost: response.cost,
          latency: response.latency,
        }
      })
    }),

  /**
   * Get cost statistics for a company
   */
  getCompanyCosts: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getCompanyCosts(input.companyId, input.startDate, input.endDate)
    }),

  /**
   * Get cost statistics for an agent
   */
  getAgentCosts: protectedProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getAgentCosts(input.agentId, input.startDate, input.endDate)
    }),

  /**
   * Get cost statistics for all agents in a company
   */
  getCompanyAgentsCosts: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getCompanyAgentsCosts(input.companyId, input.startDate, input.endDate)
    }),

  /**
   * Estimate cost before making a call
   */
  estimateCost: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['fast', 'balanced', 'powerful']),
        estimatedInputTokens: z.number().min(1).max(1000000),
        estimatedOutputTokens: z.number().min(1).max(100000),
      })
    )
    .query(({ input }) => {
      const cost = estimateCost(
        input.tier,
        input.estimatedInputTokens,
        input.estimatedOutputTokens
      )

      return {
        estimatedCost: cost,
        tier: input.tier,
        inputTokens: input.estimatedInputTokens,
        outputTokens: input.estimatedOutputTokens,
      }
    }),
})
