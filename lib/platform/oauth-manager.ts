/**
 * OAuth Manager
 *
 * Manage OAuth authentication flows for platforms
 */

import { PlatformCredentials, AuthResult } from './types';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { platformConnections } from '@/lib/db/schema';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export interface OAuthState {
  companyId: string;
  platformId: string;
  returnUrl?: string;
  timestamp: number;
}

export class OAuthManager {
  private static instance: OAuthManager;
  private pendingStates: Map<string, OAuthState> = new Map();

  private constructor() {}

  static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(
    config: OAuthConfig,
    state: OAuthState
  ): string {
    const stateToken = this.generateStateToken();
    this.pendingStates.set(stateToken, state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      state: stateToken,
      response_type: 'code',
    });

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCode(
    config: OAuthConfig,
    code: string,
    stateToken: string
  ): Promise<{ credentials: PlatformCredentials; state: OAuthState }> {
    // Verify state token
    const state = this.pendingStates.get(stateToken);
    if (!state) {
      throw new Error('Invalid or expired state token');
    }

    // Remove used state
    this.pendingStates.delete(stateToken);

    // Exchange code for token
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const data = await response.json();

    const credentials: PlatformCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };

    return { credentials, state };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    config: OAuthConfig,
    refreshToken: string
  ): Promise<PlatformCredentials> {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  }

  /**
   * Save platform connection
   */
  async saveConnection(
    companyId: string,
    platformId: string,
    credentials: PlatformCredentials
  ): Promise<void> {
    // Check if connection already exists
    const [existing] = await db
      .select()
      .from(platformConnections)
      .where(
        and(
          eq(platformConnections.company_id, companyId),
          eq(platformConnections.platform, platformId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing connection
      await db
        .update(platformConnections)
        .set({
          credentials: credentials as any,
          connected: true,
          updated_at: new Date(),
        })
        .where(eq(platformConnections.id, existing.id));
    } else {
      // Create new connection
      await db.insert(platformConnections).values({
        company_id: companyId,
        platform: platformId,
        credentials: credentials as any,
        connected: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    console.log(
      `[OAuthManager] Saved connection: ${companyId} -> ${platformId}`
    );
  }

  /**
   * Disconnect platform
   */
  async disconnect(companyId: string, platformId: string): Promise<void> {
    await db
      .delete(platformConnections)
      .where(
        and(
          eq(platformConnections.company_id, companyId),
          eq(platformConnections.platform, platformId)
        )
      );

    console.log(
      `[OAuthManager] Disconnected: ${companyId} -> ${platformId}`
    );
  }

  /**
   * Get platform credentials
   */
  async getCredentials(
    companyId: string,
    platformId: string
  ): Promise<PlatformCredentials | null> {
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
      return null;
    }

    return connection.credentials as PlatformCredentials;
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(credentials: PlatformCredentials): boolean {
    if (!credentials.expiresAt) {
      return false;
    }

    // Refresh if expires in less than 5 minutes
    const expiresAt = new Date(credentials.expiresAt);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;

    return expiresAt.getTime() - now.getTime() < fiveMinutes;
  }

  /**
   * Generate random state token
   */
  private generateStateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Clean up expired states
   */
  cleanupExpiredStates(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [token, state] of this.pendingStates.entries()) {
      if (now - state.timestamp > maxAge) {
        this.pendingStates.delete(token);
      }
    }
  }
}

// Export singleton instance
export const oauthManager = OAuthManager.getInstance();

// Clean up expired states every 5 minutes
setInterval(() => {
  oauthManager.cleanupExpiredStates();
}, 5 * 60 * 1000);
