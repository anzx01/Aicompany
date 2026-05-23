/**
 * OpenClaw tRPC Router
 *
 * API endpoints for container management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { containerManager } from '@/lib/openclaw';

export const openclawRouter = router({
  /**
   * Create a container for a company
   */
  createContainer: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const containerId = await containerManager.createContainer(input.companyId);
      return { containerId };
    }),

  /**
   * Execute a command in the container
   */
  executeCommand: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        command: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const result = await containerManager.executeCommand(
        input.companyId,
        input.command
      );
      return result;
    }),

  /**
   * Write a file to the container
   */
  writeFile: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        path: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await containerManager.writeFile(
        input.companyId,
        input.path,
        input.content
      );
      return { success: true };
    }),

  /**
   * Read a file from the container
   */
  readFile: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        path: z.string(),
      })
    )
    .query(async ({ input }) => {
      const content = await containerManager.readFile(
        input.companyId,
        input.path
      );
      return { content };
    }),

  /**
   * Get container status
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const status = await containerManager.getContainerStatus(input.companyId);
      return status;
    }),

  /**
   * Get resource usage
   */
  getResourceUsage: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const usage = await containerManager.getResourceUsage(input.companyId);
      return usage;
    }),

  /**
   * Start a container
   */
  startContainer: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await containerManager.startContainer(input.companyId);
      return { success: true };
    }),

  /**
   * Stop a container
   */
  stopContainer: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await containerManager.stopContainer(input.companyId);
      return { success: true };
    }),

  /**
   * Restart a container
   */
  restartContainer: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await containerManager.restartContainer(input.companyId);
      return { success: true };
    }),

  /**
   * Remove a container
   */
  removeContainer: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await containerManager.removeContainer(input.companyId);
      return { success: true };
    }),

  /**
   * Health check
   */
  healthCheck: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const healthy = await containerManager.healthCheck(input.companyId);
      return { healthy };
    }),
});
