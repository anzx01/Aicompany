// Heartbeat Router - tRPC router for heartbeat operations

import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import {
  executeHeartbeat,
  executeAllHeartbeats,
  needsHeartbeat,
} from '@/lib/heartbeat'

export const heartbeatRouter = router({
  /**
   * Execute heartbeat for a specific company
   */
  execute: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return await executeHeartbeat(input.companyId)
    }),

  /**
   * Execute heartbeat for all active companies
   * This should be called by a cron job
   */
  executeAll: protectedProcedure
    .mutation(async () => {
      return await executeAllHeartbeats()
    }),

  /**
   * Check if a company needs a heartbeat
   */
  needsHeartbeat: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const needs = await needsHeartbeat(input.companyId)
      return { needsHeartbeat: needs }
    }),
})
