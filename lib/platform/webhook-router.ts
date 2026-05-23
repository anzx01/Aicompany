/**
 * Webhook Router
 *
 * Route and handle webhooks from different platforms
 */

import { WebhookPayload } from './types';
import { platformRegistry } from './registry';
import crypto from 'crypto';

export interface WebhookHandler {
  platformId: string;
  handler: (payload: WebhookPayload) => Promise<void>;
}

export interface WebhookSignatureConfig {
  secret: string;
  header: string;
  algorithm: 'sha1' | 'sha256' | 'sha512';
}

export class WebhookRouter {
  private static instance: WebhookRouter;
  private handlers: Map<string, WebhookHandler> = new Map();

  private constructor() {}

  static getInstance(): WebhookRouter {
    if (!WebhookRouter.instance) {
      WebhookRouter.instance = new WebhookRouter();
    }
    return WebhookRouter.instance;
  }

  /**
   * Register a webhook handler
   */
  register(platformId: string, handler: (payload: WebhookPayload) => Promise<void>): void {
    this.handlers.set(platformId, { platformId, handler });
    console.log(`[WebhookRouter] Registered handler for ${platformId}`);
  }

  /**
   * Handle incoming webhook
   */
  async handle(
    platformId: string,
    payload: any,
    signature?: string,
    signatureConfig?: WebhookSignatureConfig
  ): Promise<void> {
    // Verify signature if provided
    if (signature && signatureConfig) {
      const isValid = this.verifySignature(payload, signature, signatureConfig);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Get handler
    const handler = this.handlers.get(platformId);
    if (!handler) {
      console.error(`[WebhookRouter] No handler found for ${platformId}`);
      throw new Error(`No webhook handler for platform: ${platformId}`);
    }

    // Parse payload
    const webhookPayload: WebhookPayload = {
      event: payload.event || payload.type || 'unknown',
      data: payload,
      timestamp: new Date(payload.timestamp || Date.now()),
      signature,
    };

    // Execute handler
    try {
      await handler.handler(webhookPayload);
      console.log(`[WebhookRouter] Successfully handled webhook for ${platformId}`);
    } catch (error: any) {
      console.error(
        `[WebhookRouter] Error handling webhook for ${platformId}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Handle webhook using platform instance
   */
  async handleWithPlatform(
    companyId: string,
    platformId: string,
    payload: any,
    signature?: string,
    signatureConfig?: WebhookSignatureConfig
  ): Promise<void> {
    // Verify signature if provided
    if (signature && signatureConfig) {
      const isValid = this.verifySignature(payload, signature, signatureConfig);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Get platform instance
    const result = await platformRegistry.getPlatformForConnection(
      companyId,
      platformId
    );

    if (!result) {
      throw new Error(`Platform not found or not connected: ${platformId}`);
    }

    // Parse payload
    const webhookPayload: WebhookPayload = {
      event: payload.event || payload.type || 'unknown',
      data: payload,
      timestamp: new Date(payload.timestamp || Date.now()),
      signature,
    };

    // Call platform's webhook handler
    await result.platform.handleWebhook(webhookPayload);
    console.log(
      `[WebhookRouter] Successfully handled webhook for ${platformId} (company: ${companyId})`
    );
  }

  /**
   * Verify webhook signature
   */
  verifySignature(
    payload: any,
    signature: string,
    config: WebhookSignatureConfig
  ): boolean {
    try {
      const payloadString =
        typeof payload === 'string' ? payload : JSON.stringify(payload);

      const hmac = crypto.createHmac(config.algorithm, config.secret);
      hmac.update(payloadString);
      const expectedSignature = hmac.digest('hex');

      // Compare signatures (constant-time comparison)
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error: any) {
      console.error('[WebhookRouter] Signature verification failed:', error.message);
      return false;
    }
  }

  /**
   * Generate webhook signature (for testing)
   */
  generateSignature(payload: any, config: WebhookSignatureConfig): string {
    const payloadString =
      typeof payload === 'string' ? payload : JSON.stringify(payload);

    const hmac = crypto.createHmac(config.algorithm, config.secret);
    hmac.update(payloadString);
    return hmac.digest('hex');
  }

  /**
   * Unregister a webhook handler
   */
  unregister(platformId: string): void {
    this.handlers.delete(platformId);
    console.log(`[WebhookRouter] Unregistered handler for ${platformId}`);
  }

  /**
   * Get all registered platforms
   */
  getRegisteredPlatforms(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers
   */
  clearAll(): void {
    this.handlers.clear();
    console.log('[WebhookRouter] Cleared all handlers');
  }
}

// Export singleton instance
export const webhookRouter = WebhookRouter.getInstance();
