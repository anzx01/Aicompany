/**
 * Twitter Platform Integration - Real Implementation
 *
 * Uses Twitter API v2 for actual integration
 * Requires Twitter API credentials (OAuth 2.0)
 */

import { TwitterApi } from 'twitter-api-v2'
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
} from '../types'
import { RetryStrategy, RateLimiter } from '../error-handling'

export class TwitterPlatformReal implements Platform {
  readonly id = 'twitter'
  readonly name = 'Twitter/X'
  readonly type: PlatformType = 'SOCIAL_MEDIA'
  readonly companyTypes: CompanyType[] = ['MARKETING', 'CONTENT']

  private credentials: PlatformCredentials | null = null
  private client: TwitterApi | null = null
  private retryStrategy: RetryStrategy
  private rateLimiter: RateLimiter

  constructor() {
    this.retryStrategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 1000,
    })

    // Twitter API rate limit: 300 requests per 15 minutes
    this.rateLimiter = new RateLimiter({
      maxRequests: 300,
      windowMs: 15 * 60 * 1000,
    })
  }

  /**
   * Authenticate with Twitter API
   */
  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      this.credentials = credentials

      // Initialize Twitter client with OAuth 2.0
      this.client = new TwitterApi({
        appKey: credentials.apiKey || process.env.TWITTER_API_KEY || '',
        appSecret: credentials.apiSecret || process.env.TWITTER_API_SECRET || '',
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret,
      })

      // Verify credentials by getting user info
      const user = await this.client.v2.me()

      return {
        success: true,
        accessToken: credentials.accessToken,
        expiresAt: credentials.expiresAt,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }
    }
  }

  /**
   * Check platform health
   */
  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now()

    try {
      if (!this.client) {
        return {
          healthy: false,
          latency: 0,
          error: 'Not authenticated',
        }
      }

      // Simple health check: verify credentials
      await this.client.v2.me()

      return {
        healthy: true,
        latency: Date.now() - startTime,
      }
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Health check failed',
      }
    }
  }

  /**
   * Publish content to Twitter
   */
  async publish(content: Content): Promise<PublishResult> {
    if (!this.client) {
      throw new Error('Not authenticated')
    }

    await this.rateLimiter.checkLimit('publish')

    return this.retryStrategy.execute(async () => {
      // Format tweet text
      let tweetText = content.body

      // Add tags as hashtags
      if (content.tags && content.tags.length > 0) {
        const hashtags = content.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')
        tweetText = `${tweetText}\n\n${hashtags}`
      }

      // Twitter has a 280 character limit
      if (tweetText.length > 280) {
        tweetText = tweetText.substring(0, 277) + '...'
      }

      // Post tweet
      const tweet = await this.client!.v2.tweet(tweetText)

      return {
        success: true,
        id: tweet.data.id,
        url: `https://twitter.com/i/web/status/${tweet.data.id}`,
      }
    })
  }

  /**
   * Fetch content from Twitter
   */
  async fetch(query: FetchQuery): Promise<FetchResult> {
    if (!this.client) {
      throw new Error('Not authenticated')
    }

    await this.rateLimiter.checkLimit('fetch')

    return this.retryStrategy.execute(async () => {
      const limit = query.limit || 10

      // Get user's tweets
      const user = await this.client!.v2.me()
      const tweets = await this.client!.v2.userTimeline(user.data.id, {
        max_results: Math.min(limit, 100),
        'tweet.fields': ['created_at', 'public_metrics', 'text'],
      })

      const items = tweets.data.data.map(tweet => ({
        id: tweet.id,
        content: tweet.text,
        url: `https://twitter.com/i/web/status/${tweet.id}`,
        publishedAt: new Date(tweet.created_at!),
        metrics: {
          views: tweet.public_metrics?.impression_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          shares: tweet.public_metrics?.retweet_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
        },
      }))

      return {
        success: true,
        data: items,
        total: items.length,
      }
    })
  }

  /**
   * Update existing content
   * Note: Twitter doesn't support editing tweets (except for Twitter Blue)
   */
  async update(id: string, content: Content): Promise<UpdateResult> {
    throw new Error('Twitter does not support editing tweets')
  }

  /**
   * Delete content from Twitter
   */
  async delete(id: string): Promise<DeleteResult> {
    if (!this.client) {
      throw new Error('Not authenticated')
    }

    await this.rateLimiter.checkLimit('delete')

    return this.retryStrategy.execute(async () => {
      await this.client!.v2.deleteTweet(id)

      return {
        success: true,
        deletedAt: new Date(),
      }
    })
  }

  /**
   * Get analytics for Twitter account
   */
  async getAnalytics(timeRange: TimeRange): Promise<Analytics> {
    if (!this.client) {
      throw new Error('Not authenticated')
    }

    await this.rateLimiter.checkLimit('analytics')

    return this.retryStrategy.execute(async () => {
      // Get user info
      const user = await this.client!.v2.me({
        'user.fields': ['public_metrics'],
      })

      // Get recent tweets for engagement metrics
      const tweets = await this.client!.v2.userTimeline(user.data.id, {
        max_results: 100,
        'tweet.fields': ['created_at', 'public_metrics'],
        start_time: timeRange.start.toISOString(),
        end_time: timeRange.end.toISOString(),
      })

      // Calculate totals
      let totalImpressions = 0
      let totalLikes = 0
      let totalRetweets = 0
      let totalReplies = 0

      for (const tweet of tweets.data.data) {
        totalImpressions += tweet.public_metrics?.impression_count || 0
        totalLikes += tweet.public_metrics?.like_count || 0
        totalRetweets += tweet.public_metrics?.retweet_count || 0
        totalReplies += tweet.public_metrics?.reply_count || 0
      }

      const totalEngagements = totalLikes + totalRetweets + totalReplies
      const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0

      return {
        views: totalImpressions,
        likes: totalLikes,
        shares: totalRetweets,
        comments: totalReplies,
        followers: user.data.public_metrics?.followers_count || 0,
        engagementRate,
        timeRange,
      }
    })
  }

  /**
   * Handle webhook events from Twitter
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Twitter webhook handling
    // This would process events like mentions, DMs, etc.
    console.log('Twitter webhook received:', payload.event)
  }

  /**
   * Refresh authentication token
   */
  async refreshAuth(): Promise<AuthResult> {
    if (!this.credentials) {
      return {
        success: false,
        error: 'No credentials to refresh',
      }
    }

    // Re-authenticate with existing credentials
    return await this.authenticate(this.credentials)
  }

  /**
   * Disconnect from platform
   */
  async disconnect(): Promise<void> {
    this.credentials = null
    this.client = null
  }
}
