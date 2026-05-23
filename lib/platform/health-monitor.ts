/**
 * Health Monitor
 *
 * Monitor platform health and connectivity
 */

import { Platform, HealthStatus } from './types';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { platformConnections } from '@/lib/db/schema';

export interface HealthCheckResult {
  platformId: string;
  companyId: string;
  status: HealthStatus;
  timestamp: Date;
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private checkInterval: NodeJS.Timeout | null = null;
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();

  private constructor() {}

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Start periodic health checks
   */
  start(intervalMs: number = 300000): void {
    // 5 minutes default
    if (this.checkInterval) {
      console.log('[HealthMonitor] Already running');
      return;
    }

    console.log(`[HealthMonitor] Starting health checks every ${intervalMs}ms`);

    this.checkInterval = setInterval(async () => {
      await this.checkAllPlatforms();
    }, intervalMs);

    // Run initial check
    this.checkAllPlatforms();
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[HealthMonitor] Stopped health checks');
    }
  }

  /**
   * Check health of all platforms
   */
  async checkAllPlatforms(): Promise<HealthCheckResult[]> {
    console.log('[HealthMonitor] Running health checks...');

    const connections = await db.select().from(platformConnections);

    const results: HealthCheckResult[] = [];

    for (const conn of connections) {
      try {
        const result = await this.checkPlatform(conn.company_id, conn.platform);
        results.push(result);

        // Update database
        await db
          .update(platformConnections)
          .set({
            connected: result.status.healthy,
            last_sync_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(platformConnections.id, conn.id));
      } catch (error: any) {
        console.error(
          `[HealthMonitor] Health check failed for ${conn.platform}:`,
          error.message
        );
      }
    }

    console.log(`[HealthMonitor] Completed ${results.length} health checks`);
    return results;
  }

  /**
   * Check health of a specific platform
   */
  async checkPlatform(
    companyId: string,
    platformId: string
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Get platform instance from registry
      const { platformRegistry } = await import('./registry');
      const result = await platformRegistry.getPlatformForConnection(
        companyId,
        platformId
      );

      if (!result) {
        throw new Error('Platform not found or not connected');
      }

      // Perform health check
      const status = await result.platform.healthCheck();

      // Store in history
      const key = `${companyId}:${platformId}`;
      const history = this.healthHistory.get(key) || [];
      const checkResult: HealthCheckResult = {
        platformId,
        companyId,
        status,
        timestamp: new Date(),
      };

      history.push(checkResult);

      // Keep only last 100 checks
      if (history.length > 100) {
        history.shift();
      }

      this.healthHistory.set(key, history);

      return checkResult;
    } catch (error: any) {
      const latency = Date.now() - startTime;

      const checkResult: HealthCheckResult = {
        platformId,
        companyId,
        status: {
          healthy: false,
          latency,
          error: error.message,
        },
        timestamp: new Date(),
      };

      return checkResult;
    }
  }

  /**
   * Get health history for a platform
   */
  getHistory(companyId: string, platformId: string): HealthCheckResult[] {
    const key = `${companyId}:${platformId}`;
    return this.healthHistory.get(key) || [];
  }

  /**
   * Get latest health status
   */
  getLatestStatus(companyId: string, platformId: string): HealthStatus | null {
    const history = this.getHistory(companyId, platformId);
    if (history.length === 0) {
      return null;
    }
    return history[history.length - 1].status;
  }

  /**
   * Get uptime percentage
   */
  getUptime(companyId: string, platformId: string): number {
    const history = this.getHistory(companyId, platformId);
    if (history.length === 0) {
      return 0;
    }

    const healthyChecks = history.filter((check) => check.status.healthy).length;
    return (healthyChecks / history.length) * 100;
  }

  /**
   * Get average latency
   */
  getAverageLatency(companyId: string, platformId: string): number {
    const history = this.getHistory(companyId, platformId);
    if (history.length === 0) {
      return 0;
    }

    const totalLatency = history.reduce(
      (sum, check) => sum + check.status.latency,
      0
    );
    return totalLatency / history.length;
  }

  /**
   * Clear history
   */
  clearHistory(companyId?: string, platformId?: string): void {
    if (companyId && platformId) {
      const key = `${companyId}:${platformId}`;
      this.healthHistory.delete(key);
    } else {
      this.healthHistory.clear();
    }
  }
}

// Export singleton instance
export const healthMonitor = HealthMonitor.getInstance();
