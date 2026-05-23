// LLM Cost Tracker - Track and persist LLM usage costs

import { db } from '@/lib/db'
import { costs } from '@/lib/db/schema'
import type { LLMResponse } from './types'

export interface CostRecord {
  companyId: string
  agentId?: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  cacheTokens?: number
  totalCost: number
  metadata?: Record<string, any>
}

/**
 * Track LLM usage cost in database
 */
export async function trackCost(
  response: LLMResponse,
  record: Omit<CostRecord, 'model' | 'provider' | 'inputTokens' | 'outputTokens' | 'cacheTokens' | 'totalCost'>
): Promise<void> {
  try {
    // Convert USD to cents (integer)
    const amountInCents = Math.round(response.cost.totalCost * 100)

    await db.insert(costs).values({
      company_id: record.companyId,
      agent_id: record.agentId || null,
      category: 'ai_api',
      amount: amountInCents,
      currency: 'USD',
      description: `${response.provider}/${response.model}`,
      metadata: {
        model: response.model,
        provider: response.provider,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheCreationTokens: response.usage.cacheCreationTokens,
        cacheReadTokens: response.usage.cacheReadTokens,
        inputCost: response.cost.inputCost,
        outputCost: response.cost.outputCost,
        cacheCost: response.cost.cacheCost,
        latency: response.latency,
        ...record.metadata,
      },
    })
  } catch (error) {
    console.error('Failed to track LLM cost:', error)
    // Don't throw - cost tracking failure shouldn't break the main flow
  }
}

/**
 * Get total costs for a company
 */
export async function getCompanyCosts(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCost: number
  costByProvider: Record<string, number>
  costByModel: Record<string, number>
  totalTokens: {
    input: number
    output: number
    cached: number
  }
}> {
  // This would require a more complex query with date filtering
  // For now, return a simplified version
  const records = await db.query.costs.findMany({
    where: (costs, { eq, and, gte, lte }) => {
      const conditions = [eq(costs.company_id, companyId)]

      if (startDate) {
        conditions.push(gte(costs.created_at, startDate))
      }

      if (endDate) {
        conditions.push(lte(costs.created_at, endDate))
      }

      return and(...conditions)
    },
  })

  let totalCost = 0
  const costByProvider: Record<string, number> = {}
  const costByModel: Record<string, number> = {}
  const totalTokens = { input: 0, output: 0, cached: 0 }

  for (const record of records) {
    // Convert cents to dollars
    const amountInDollars = Number(record.amount) / 100
    totalCost += amountInDollars

    const metadata = record.metadata as any
    if (metadata?.provider) {
      costByProvider[metadata.provider] = (costByProvider[metadata.provider] || 0) + amountInDollars
    }

    if (metadata?.model) {
      costByModel[metadata.model] = (costByModel[metadata.model] || 0) + amountInDollars
    }

    if (metadata?.inputTokens) {
      totalTokens.input += metadata.inputTokens
    }

    if (metadata?.outputTokens) {
      totalTokens.output += metadata.outputTokens
    }

    if (metadata?.cacheReadTokens) {
      totalTokens.cached += metadata.cacheReadTokens
    }
  }

  return {
    totalCost,
    costByProvider,
    costByModel,
    totalTokens,
  }
}

/**
 * Get cost statistics for an agent
 */
export async function getAgentCosts(
  agentId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCost: number
  totalCalls: number
  averageCostPerCall: number
  totalTokens: number
}> {
  const records = await db.query.costs.findMany({
    where: (costs, { eq, and, gte, lte }) => {
      const conditions = [eq(costs.agent_id, agentId)]

      if (startDate) {
        conditions.push(gte(costs.created_at, startDate))
      }

      if (endDate) {
        conditions.push(lte(costs.created_at, endDate))
      }

      return and(...conditions)
    },
  })

  let totalCost = 0
  let totalTokens = 0

  for (const record of records) {
    // Convert cents to dollars
    const amountInDollars = Number(record.amount) / 100
    totalCost += amountInDollars

    const metadata = record.metadata as any
    if (metadata?.inputTokens) {
      totalTokens += metadata.inputTokens
    }
    if (metadata?.outputTokens) {
      totalTokens += metadata.outputTokens
    }
  }

  return {
    totalCost,
    totalCalls: records.length,
    averageCostPerCall: records.length > 0 ? totalCost / records.length : 0,
    totalTokens,
  }
}

/**
 * Get cost statistics for all agents in a company
 */
export async function getCompanyAgentsCosts(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  agentId: string
  agentName: string | null
  role: string | null
  totalCost: number
  totalCalls: number
  totalTokens: number
}>> {
  const records = await db.query.costs.findMany({
    where: (costs, { eq, and, gte, lte, isNotNull }) => {
      const conditions = [
        eq(costs.company_id, companyId),
        isNotNull(costs.agent_id)
      ]

      if (startDate) {
        conditions.push(gte(costs.created_at, startDate))
      }

      if (endDate) {
        conditions.push(lte(costs.created_at, endDate))
      }

      return and(...conditions)
    },
  })

  // Group by agent
  const agentStats: Record<string, {
    totalCost: number
    totalCalls: number
    totalTokens: number
  }> = {}

  for (const record of records) {
    const agentId = record.agent_id!
    if (!agentStats[agentId]) {
      agentStats[agentId] = {
        totalCost: 0,
        totalCalls: 0,
        totalTokens: 0,
      }
    }

    const amountInDollars = Number(record.amount) / 100
    agentStats[agentId].totalCost += amountInDollars
    agentStats[agentId].totalCalls += 1

    const metadata = record.metadata as any
    if (metadata?.inputTokens) {
      agentStats[agentId].totalTokens += metadata.inputTokens
    }
    if (metadata?.outputTokens) {
      agentStats[agentId].totalTokens += metadata.outputTokens
    }
  }

  // Get agent details
  const { agents } = await import('@/lib/db/schema')
  const agentDetails = await db.query.agents.findMany({
    where: (agents, { eq, inArray }) =>
      eq(agents.company_id, companyId),
  })

  const agentMap = new Map(agentDetails.map(a => [a.id, a]))

  return Object.entries(agentStats).map(([agentId, stats]) => {
    const agent = agentMap.get(agentId)
    return {
      agentId,
      agentName: agent?.name || null,
      role: agent?.role || null,
      ...stats,
    }
  })
}

/**
 * Estimate cost before making a call
 */
export function estimateCost(
  tier: 'fast' | 'balanced' | 'powerful',
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): number {
  const { MODEL_CONFIGS, calculateCost } = require('./config')
  const config = MODEL_CONFIGS[tier]
  const cost = calculateCost(config, estimatedInputTokens, estimatedOutputTokens)
  return cost.totalCost
}
