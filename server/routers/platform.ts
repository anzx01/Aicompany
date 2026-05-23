/**
 * Platform tRPC Router
 *
 * API endpoints for platform integrations
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { platformRegistry } from '@/lib/platform/registry';
import { oauthManager } from '@/lib/platform/oauth-manager';
import { healthMonitor } from '@/lib/platform/health-monitor';
import { TwitterPlatform } from '@/lib/platform/platforms/twitter';
import { TwitterPlatformReal } from '@/lib/platform/platforms/twitter-real';
import { GitHubPlatform } from '@/lib/platform/platforms/github';
import { ProductHuntPlatform } from '@/lib/platform/platforms/producthunt';

// Register platforms
platformRegistry.register('twitter', TwitterPlatform);
platformRegistry.register('twitter-real', TwitterPlatformReal);
platformRegistry.register('github', GitHubPlatform);
platformRegistry.register('producthunt', ProductHuntPlatform);

export const platformRouter = router({
  /**
   * Get all available platforms
   */
  list: protectedProcedure.query(async () => {
    const platforms = platformRegistry.getRegisteredPlatforms();
    return platforms;
  }),

  /**
   * Get connected platforms for a company
   */
  getConnected: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const platforms = await platformRegistry.getCompanyPlatforms(input.companyId);
      return platforms.map((p) => ({
        platformId: p.connection.platformId,
        status: p.connection.status,
        lastHealthCheck: p.connection.lastHealthCheck,
      }));
    }),

  /**
   * Connect a platform (save credentials)
   */
  connect: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
        credentials: z.object({
          accessToken: z.string().optional(),
          refreshToken: z.string().optional(),
          apiKey: z.string().optional(),
          apiSecret: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await oauthManager.saveConnection(
        input.companyId,
        input.platformId,
        input.credentials
      );

      return { success: true };
    }),

  /**
   * Disconnect a platform
   */
  disconnect: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await oauthManager.disconnect(input.companyId, input.platformId);
      return { success: true };
    }),

  /**
   * Publish content to a platform
   */
  publish: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
        content: z.object({
          title: z.string().optional(),
          body: z.string(),
          summary: z.string().optional(),
          tags: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const result = await platformRegistry.getPlatformForConnection(
        input.companyId,
        input.platformId
      );

      if (!result) {
        throw new Error('Platform not connected');
      }

      const publishResult = await result.platform.publish(input.content);
      return publishResult;
    }),

  /**
   * Get platform analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
        timeRange: z.object({
          start: z.date(),
          end: z.date(),
        }),
      })
    )
    .query(async ({ input }) => {
      const result = await platformRegistry.getPlatformForConnection(
        input.companyId,
        input.platformId
      );

      if (!result) {
        throw new Error('Platform not connected');
      }

      const analytics = await result.platform.getAnalytics(input.timeRange);
      return analytics;
    }),

  /**
   * Check platform health
   */
  healthCheck: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await healthMonitor.checkPlatform(
        input.companyId,
        input.platformId
      );
      return result;
    }),

  /**
   * Get platform health history
   */
  getHealthHistory: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const history = healthMonitor.getHistory(input.companyId, input.platformId);
      return history;
    }),

  /**
   * Get platform uptime
   */
  getUptime: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platformId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const uptime = healthMonitor.getUptime(input.companyId, input.platformId);
      const avgLatency = healthMonitor.getAverageLatency(
        input.companyId,
        input.platformId
      );

      return {
        uptime,
        avgLatency,
      };
    }),
});
