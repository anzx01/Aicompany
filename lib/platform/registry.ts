/**
 * Platform Registry
 *
 * Factory pattern for managing platform instances
 */

import { Platform, PlatformConnection } from './types';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { platformConnections } from '@/lib/db/schema';

export class PlatformRegistry {
  private static instance: PlatformRegistry;
  private platforms: Map<string, new () => Platform> = new Map();
  private instances: Map<string, Platform> = new Map();

  private constructor() {}

  static getInstance(): PlatformRegistry {
    if (!PlatformRegistry.instance) {
      PlatformRegistry.instance = new PlatformRegistry();
    }
    return PlatformRegistry.instance;
  }

  /**
   * Register a platform class
   */
  register(platformId: string, platformClass: new () => Platform): void {
    this.platforms.set(platformId, platformClass);
    console.log(`[PlatformRegistry] Registered platform: ${platformId}`);
  }

  /**
   * Get a platform instance
   */
  getPlatform(platformId: string): Platform | null {
    // Return cached instance if exists
    if (this.instances.has(platformId)) {
      return this.instances.get(platformId)!;
    }

    // Create new instance
    const PlatformClass = this.platforms.get(platformId);
    if (!PlatformClass) {
      console.error(`[PlatformRegistry] Platform not found: ${platformId}`);
      return null;
    }

    const instance = new PlatformClass();
    this.instances.set(platformId, instance);
    return instance;
  }

  /**
   * Get all registered platform IDs
   */
  getRegisteredPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Get platform instance for a company connection
   */
  async getPlatformForConnection(
    companyId: string,
    platformId: string
  ): Promise<{ platform: Platform; connection: PlatformConnection } | null> {
    // Get platform instance
    const platform = this.getPlatform(platformId);
    if (!platform) {
      return null;
    }

    // Get connection from database
    const [connection] = await db
      .select()
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.company_id, companyId),
          eq(platformConnections.platform, platformId)
        )
      )
      .limit(1);

    if (!connection) {
      console.error(
        `[PlatformRegistry] Connection not found: ${companyId} -> ${platformId}`
      );
      return null;
    }

    // Authenticate platform with stored credentials
    const authResult = await platform.authenticate(connection.credentials as any);
    if (!authResult.success) {
      console.error(
        `[PlatformRegistry] Authentication failed: ${platformId}`,
        authResult.error
      );
      return null;
    }

    return {
      platform,
      connection: {
        id: connection.id,
        companyId: connection.company_id,
        platformId: connection.platform,
        credentials: connection.credentials as any,
        status: connection.connected ? 'CONNECTED' : 'DISCONNECTED',
        lastHealthCheck: connection.last_sync_at || undefined,
        createdAt: connection.created_at,
        updatedAt: connection.updated_at,
      },
    };
  }

  /**
   * Get all connected platforms for a company
   */
  async getCompanyPlatforms(companyId: string): Promise<
    Array<{
      platform: Platform;
      connection: PlatformConnection;
    }>
  > {
    const connections = await db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.company_id, companyId));

    const results = [];
    for (const conn of connections) {
      const result = await this.getPlatformForConnection(
        companyId,
        conn.platform
      );
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Clear cached instances (useful for testing)
   */
  clearCache(): void {
    this.instances.clear();
  }
}

// Export singleton instance
export const platformRegistry = PlatformRegistry.getInstance();
