/**
 * Product Hunt Platform Integration
 *
 * Supports posting products, getting analytics, and managing launches
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
import { RetryStrategy, RateLimiter, PlatformError } from '../error-handling';

export class ProductHuntPlatform implements Platform {
  readonly id = 'producthunt';
  readonly name = 'Product Hunt';
  readonly type: PlatformType = 'CONTENT_PLATFORM';
  readonly companyTypes: CompanyType[] = ['MARKETING', 'CONTENT'];

  private credentials: PlatformCredentials | null = null;
  private retryStrategy: RetryStrategy;
  private rateLimiter: RateLimiter;
  private apiBaseUrl = 'https://api.producthunt.com/v2/api/graphql';

  constructor() {
    this.retryStrategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 1000,
    });

    // Product Hunt API rate limit: 100 requests per hour
    this.rateLimiter = new RateLimiter({
      maxRequests: 100,
      windowMs: 60 * 60 * 1000,
    });
  }

  /**
   * Authenticate with Product Hunt
   */
  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      if (!credentials.accessToken) {
        return {
          success: false,
          error: 'Access token is required',
        };
      }

      this.credentials = credentials;

      // Verify token by fetching user info
      const query = `
        query {
          viewer {
            id
            username
            name
          }
        }
      `;

      const response = await this.graphqlRequest(query);

      if (response.errors) {
        return {
          success: false,
          error: response.errors[0].message,
        };
      }

      console.log(`[ProductHuntPlatform] Authenticated as @${response.data.viewer.username}`);

      return {
        success: true,
        accessToken: credentials.accessToken,
      };
    } catch (error: any) {
      console.error('[ProductHuntPlatform] Authentication failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refresh authentication (Product Hunt uses long-lived tokens)
   */
  async refreshAuth(refreshToken: string): Promise<AuthResult> {
    // Product Hunt uses long-lived access tokens
    // No refresh needed
    return {
      success: true,
      accessToken: this.credentials?.accessToken || '',
    };
  }

  /**
   * Publish a product or post
   */
  async publish(content: Content): Promise<PublishResult> {
    if (!this.credentials) {
      throw new PlatformError('producthunt', 'NOT_AUTHENTICATED', 'Not authenticated');
    }

    return this.retryStrategy.execute(async () => {
      await this.rateLimiter.checkLimit('publish');

      try {
        // Create a post (comment on a product)
        const mutation = `
          mutation($input: CreatePostInput!) {
            createPost(input: $input) {
              post {
                id
                url
                body
                createdAt
              }
            }
          }
        `;

        const variables = {
          input: {
            body: content.body,
            // productId: content.metadata?.productId, // Required for posting on a product
          },
        };

        const response = await this.graphqlRequest(mutation, variables);

        if (response.errors) {
          throw new PlatformError(
            'producthunt',
            'PUBLISH_FAILED',
            response.errors[0].message,
            400
          );
        }

        const post = response.data.createPost.post;

        console.log(`[ProductHuntPlatform] Post published: ${post.url}`);

        return {
          success: true,
          id: post.id,
          url: post.url,
          metadata: {
            publishedAt: new Date(post.createdAt),
          },
        };
      } catch (error: any) {
        console.error('[ProductHuntPlatform] Publish failed:', error.message);
        throw new PlatformError('producthunt', 'PUBLISH_FAILED', error.message);
      }
    });
  }

  /**
   * Fetch posts or products
   */
  async fetch(query: FetchQuery): Promise<FetchResult> {
    if (!this.credentials) {
      throw new PlatformError('producthunt', 'NOT_AUTHENTICATED', 'Not authenticated');
    }

    return this.retryStrategy.execute(async () => {
      await this.rateLimiter.checkLimit('fetch');

      try {
        // Fetch user's posts
        const graphqlQuery = `
          query($first: Int!) {
            viewer {
              posts(first: $first) {
                edges {
                  node {
                    id
                    body
                    url
                    createdAt
                    votesCount
                  }
                }
              }
            }
          }
        `;

        const variables = {
          first: query.limit || 10,
        };

        const response = await this.graphqlRequest(graphqlQuery, variables);

        if (response.errors) {
          throw new PlatformError(
            'producthunt',
            'FETCH_FAILED',
            response.errors[0].message,
            400
          );
        }

        const posts = response.data.viewer.posts.edges.map((edge: any) => ({
          id: edge.node.id,
          content: edge.node.body,
          url: edge.node.url,
          publishedAt: new Date(edge.node.createdAt),
          metrics: {
            votes: edge.node.votesCount,
          },
        }));

        return {
          success: true,
          data: posts,
          total: posts.length,
        };
      } catch (error: any) {
        console.error('[ProductHuntPlatform] Fetch failed:', error.message);
        throw new PlatformError('producthunt', 'FETCH_FAILED', error.message);
      }
    });
  }

  /**
   * Update a post (not supported)
   */
  async update(id: string, content: Content): Promise<UpdateResult> {
    throw new PlatformError(
      'producthunt',
      'NOT_SUPPORTED',
      'Product Hunt does not support editing posts',
      400
    );
  }

  /**
   * Delete a post
   */
  async delete(id: string): Promise<DeleteResult> {
    if (!this.credentials) {
      throw new PlatformError('producthunt', 'NOT_AUTHENTICATED', 'Not authenticated');
    }

    return this.retryStrategy.execute(async () => {
      await this.rateLimiter.checkLimit('delete');

      try {
        const mutation = `
          mutation($input: DeletePostInput!) {
            deletePost(input: $input) {
              success
            }
          }
        `;

        const variables = {
          input: {
            postId: id,
          },
        };

        const response = await this.graphqlRequest(mutation, variables);

        if (response.errors) {
          throw new PlatformError(
            'producthunt',
            'DELETE_FAILED',
            response.errors[0].message,
            400
          );
        }

        console.log(`[ProductHuntPlatform] Post deleted: ${id}`);

        return {
          success: true,
        };
      } catch (error: any) {
        console.error('[ProductHuntPlatform] Delete failed:', error.message);
        throw new PlatformError('producthunt', 'DELETE_FAILED', error.message);
      }
    });
  }

  /**
   * Get analytics
   */
  async getAnalytics(timeRange: TimeRange): Promise<Analytics> {
    if (!this.credentials) {
      throw new PlatformError('producthunt', 'NOT_AUTHENTICATED', 'Not authenticated');
    }

    return this.retryStrategy.execute(async () => {
      await this.rateLimiter.checkLimit('analytics');

      try {
        // Fetch user's products and their metrics
        const query = `
          query {
            viewer {
              madeProducts {
                edges {
                  node {
                    id
                    name
                    votesCount
                    commentsCount
                  }
                }
              }
            }
          }
        `;

        const response = await this.graphqlRequest(query);

        if (response.errors) {
          throw new PlatformError(
            'producthunt',
            'ANALYTICS_FAILED',
            response.errors[0].message,
            400
          );
        }

        const products = response.data.viewer.madeProducts.edges;

        let totalVotes = 0;
        let totalComments = 0;

        products.forEach((edge: any) => {
          totalVotes += edge.node.votesCount;
          totalComments += edge.node.commentsCount;
        });

        return {
          views: 0, // Not available in API
          likes: totalVotes,
          shares: 0,
          comments: totalComments,
          engagement: 0,
          followers: 0,
          reach: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          customMetrics: {
            products: products.length,
            avgVotesPerProduct: products.length > 0 ? totalVotes / products.length : 0,
          },
        };
      } catch (error: any) {
        console.error('[ProductHuntPlatform] Analytics failed:', error.message);
        throw new PlatformError('producthunt', 'ANALYTICS_FAILED', error.message);
      }
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthStatus> {
    try {
      if (!this.credentials) {
        return {
          healthy: false,
          latency: 0,
          error: 'Not authenticated',
        };
      }

      const start = Date.now();

      const query = `
        query {
          viewer {
            id
          }
        }
      `;

      await this.graphqlRequest(query);

      const latency = Date.now() - start;

      return {
        healthy: true,
        latency,
      };
    } catch (error: any) {
      return {
        healthy: false,
        latency: 0,
        error: error.message,
      };
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    console.log('[ProductHuntPlatform] Webhook received:', payload.event);
    // Product Hunt webhook handling
  }

  /**
   * Disconnect from platform
   */
  async disconnect(): Promise<void> {
    this.credentials = null;
    console.log('[ProductHuntPlatform] Disconnected');
  }

  /**
   * Make GraphQL request
   */
  private async graphqlRequest(query: string, variables?: any): Promise<any> {
    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials?.accessToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
