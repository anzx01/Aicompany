// Memory Router - tRPC router for memory operations

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import {
  storeMemory,
  searchMemories,
  getRecentMemories,
  getImportantMemories,
  updateMemoryImportance,
  pruneMemories,
  getMemoryStats,
  deleteMemory,
} from '@/lib/memory'

export const memoryRouter = router({
  /**
   * Store a new memory
   */
  store: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        type: z.enum(['PRODUCT', 'MARKETING', 'CUSTOMER', 'DECISION', 'TASK', 'CONVERSATION']),
        content: z.string().min(1).max(10000),
        importance: z.number().min(0).max(100).optional().default(50),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await storeMemory(
        input.companyId,
        input.type,
        input.content,
        input.importance,
        input.metadata
      )
    }),

  /**
   * Search memories using semantic similarity
   */
  search: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        query: z.string().min(1).max(1000),
        type: z.enum(['PRODUCT', 'MARKETING', 'CUSTOMER', 'DECISION', 'TASK', 'CONVERSATION']).optional(),
        limit: z.number().min(1).max(50).optional().default(10),
        minImportance: z.number().min(0).max(100).optional().default(0),
        minSimilarity: z.number().min(0).max(1).optional().default(0.7),
      })
    )
    .query(async ({ input }) => {
      return await searchMemories(input)
    }),

  /**
   * Get recent memories
   */
  getRecent: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        limit: z.number().min(1).max(100).optional().default(20),
        type: z.enum(['PRODUCT', 'MARKETING', 'CUSTOMER', 'DECISION', 'TASK', 'CONVERSATION']).optional(),
      })
    )
    .query(async ({ input }) => {
      return await getRecentMemories(input.companyId, input.limit, input.type)
    }),

  /**
   * Get important memories
   */
  getImportant: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ input }) => {
      return await getImportantMemories(input.companyId, input.limit)
    }),

  /**
   * Update memory importance
   */
  updateImportance: protectedProcedure
    .input(
      z.object({
        memoryId: z.string().uuid(),
        importance: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      await updateMemoryImportance(input.memoryId, input.importance)
      return { success: true }
    }),

  /**
   * Prune old, low-importance memories
   */
  prune: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        olderThanDays: z.number().min(1).max(365).optional().default(90),
        maxImportance: z.number().min(0).max(100).optional().default(30),
      })
    )
    .mutation(async ({ input }) => {
      const deletedCount = await pruneMemories(
        input.companyId,
        input.olderThanDays,
        input.maxImportance
      )
      return { deletedCount }
    }),

  /**
   * Get memory statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      return await getMemoryStats(input.companyId)
    }),

  /**
   * Delete a memory
   */
  delete: protectedProcedure
    .input(
      z.object({
        memoryId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      await deleteMemory(input.memoryId)
      return { success: true }
    }),
})
