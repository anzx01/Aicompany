/**
 * Twitter Platform Integration
 *
 * Mock implementation for Twitter/X platform
 * In production, replace with actual Twitter API v2 calls
 */

import {
  Platform,
  PlatformType,
  CompanyType,
  PlatformCredentials,
  AuthResult,
  HealthStatus,
  Content,
  PublishResult,
  FetchQuery,
  FetchResult,
  UpdateResult,
  DeleteResult,
  TimeRange,
  Analytics,
  WebhookPayload,
} from '../types';
import { RetryStrategy, RateLimiter } from '../error-handling';

export class TwitterPlatform implements Platform {
  readonly id = 'twitter';
  readonly name = 'Twitter/X';
  readonly type: PlatformType = 'SOCIAL_MEDIA';
  readonly companyTypes: CompanyType[] = ['MARKETING', 'CONTENT'];

  private credentials: PlatformCredentials | null = null;
  private retryStrategy: RetryStrategy;
  private rateLimiter: RateLimiter;

  constructor() {
    this.retryStrategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 1000,
    });

    // Twitter API rate limit: 300 requests per 15 minutes
    this.rateLimiter = new RateLimiter({
      maxRequests: 300,
      windowMs: 15 * 60 * 1000,
    });
  }

  /**
   * Authenticate with Twitter
   */
  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      // Mock authentication
      // In production, verify credentials with Twitter API
      if (!credentials.accessToken) {
        return {
          success: false,
          error: 'Access token is required',
        };
      }

      this.credentials = credentials;

      console.log('[TwitterPlatform] Authenticated successfully');

      return {
        success: true,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
      };
    } catch (error: any) {
      console.error('[TwitterPlatform] Authentication failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh authentication
   */
  async refreshAuth(refreshToken: string): Promise<AuthResult> {
    try {
      // Mock token refresh
      // In production, call Twitter OAuth2 token endpoint
      const newAccessToken = `mock_access_token_${Date.now()}`;

      this.credentials = {
        ...this.credentials,
        accessToken: newAccessToken,
        refreshToken,
      };

      console.log('[TwitterPlatform] Token refreshed successfully');

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken,
      };
    } catch (error: any) {
      console.error('[TwitterPlatform] Token refresh failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Disconnect from Twitter
   */
  async disconnect(): Promise<void> {
    this.credentials = null;
    console.log('[TwitterPlatform] Disconnected');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      if (!this.credentials) {
        return {
          healthy: false,
          latency: Date.now() - startTime,
          error: 'Not authenticated',
        };
      }

      // Mock health check
      // In production, call Twitter API /2/users/me endpoint
      await this.sleep(100); // Simulate API call

      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency,
        rateLimit: {
          remaining: this.rateLimiter.getRemaining('twitter'),
          reset: this.rateLimiter.getResetTime('twitter') || new Date(),
        },
      };
    } catch (error: any) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Publish a tweet
   */
  async publish(content: Content): Promise<PublishResult> {
    try {
      if (!this.credentials) {
        throw new Error('Not authenticated');
      }

      // Rate limiting
      await this.rateLimiter.waitForLimit('twitter');

      // Retry logic
      return await this.retryStrategy.execute(async () => {
        // Mock tweet creation
        // In production, call Twitter API POST /2/tweets
        const tweetText = this.formatTweetText(content);

        if (tweetText.length > 280) {
          throw new Error('Tweet exceeds 280 characters');
        }

        await this.sleep(200); // Simulate API call

        const tweetId = `mock_tweet_${Date.now()}`;
        const tweetUrl = `https://twitter.com/user/status/${tweetId}`;

        console.log('[TwitterPlatform] Published tweet:', tweetId);

        return {
          success: true,
          id: tweetId,
          url: tweetUrl,
          metadata: {
            text: tweetText,
            length: tweetText.length,
          },
        };
      });
    } catch (error: any) {
      console.error('[TwitterPlatform] Publish failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch tweets
   */
  async fetch(query: FetchQuery): Promise<FetchResult> {
    try {
      if (!this.credentials) {
        throw new Error('Not authenticated');
      }

      // Rate limiting
      await this.rateLimiter.waitForLimit('twitter');

      // Mock fetch
      // In production, call Twitter API GET /2/tweets/search/recent
      await this.sleep(150); // Simulate API call

      const mockTweets = [
        {
          id: 'mock_tweet_1',
          text: 'This is a mock tweet #1',
          created_at: new Date().toISOString(),
          public_metrics: {
            like_count: 10,
            retweet_count: 5,
            reply_count: 2,
            impression_count: 100,
          },
        },
        {
          id: 'mock_tweet_2',
          text: 'This is a mock tweet #2',
          created_at: new Date().toISOString(),
          public_metrics: {
            like_count: 20,
            retweet_count: 8,
            reply_count: 4,
            impression_count: 200,
          },
        },
      ];

      console.log('[TwitterPlatform] Fetched tweets:', mockTweets.length);

      return {
        success: true,
        data: mockTweets,
        total: mockTweets.length,
      };
    } catch (error: any) {
      console.error('[TwitterPlatform] Fetch failed:', error.message);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  /**
   * Update a tweet (not supported by Twitter API)
   */
  async update(id: string, content: Partial<Content>): Promise<UpdateResult> {
    return {
      success: false,
      error: 'Twitter does not support editing tweets',
    };
  }

  /**
   * Delete a tweet
   */
  async delete(id: string): Promise<DeleteResult> {
    try {
      if (!this.credentials) {
        throw new Error('Not authenticated');
      }

      // Rate limiting
      await this.rateLimiter.waitForLimit('twitter');

      // Mock delete
      // In production, call Twitter API DELETE /2/tweets/:id
      await this.sleep(150); // Simulate API call

      console.log('[TwitterPlatform] Deleted tweet:', id);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('[TwitterPlatform] Delete failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(timeRange: TimeRange): Promise<Analytics> {
    try {
      if (!this.credentials) {
        throw new Error('Not authenticated');
      }

      // Rate limiting
      await this.rateLimiter.waitForLimit('twitter');

      // Mock analytics
      // In production, call Twitter API GET /2/tweets/:id/metrics
      await this.sleep(200); // Simulate API call

      const analytics: Analytics = {
        views: 5000,
        likes: 250,
        shares: 100,
        comments: 50,
        clicks: 150,
        followers: 1200,
        engagement_rate: 8.5,
      };

      console.log('[TwitterPlatform] Retrieved analytics');

      return analytics;
    } catch (error: any) {
      console.error('[TwitterPlatform] Analytics failed:', error.message);
      return {};
    }
  }

  /**
   * Handle webhook
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log('[TwitterPlatform] Received webhook:', payload.event);

    // Handle different webhook events
    switch (payload.event) {
      case 'tweet.created':
        console.log('[TwitterPlatform] New tweet created:', payload.data);
        break;
      case 'tweet.deleted':
        console.log('[TwitterPlatform] Tweet deleted:', payload.data);
        break;
      case 'user.followed':
        console.log('[TwitterPlatform] New follower:', payload.data);
        break;
      default:
        console.log('[TwitterPlatform] Unknown event:', payload.event);
    }
  }

  /**
   * Format content as tweet text
   */
  private formatTweetText(content: Content): string {
    let text = '';

    if (content.title) {
      text += content.title + '\n\n';
    }

    text += content.body;

    if (content.tags && content.tags.length > 0) {
      text += '\n\n' + content.tags.map((tag) => `#${tag}`).join(' ');
    }

    return text.trim();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
