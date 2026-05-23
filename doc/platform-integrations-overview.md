# 平台集成架构概览

## 1. 概述

本文档定义了 AI Company Builder v0.2 的统一平台集成架构，支持 4 种公司类型的平台连接：
- **营销公司 (MARKETING)**：社交媒体、广告平台
- **内容公司 (CONTENT)**：发布平台、内容管理系统
- **客服公司 (CUSTOMER_SERVICE)**：客服工单系统、聊天平台
- **开发公司 (DEVELOPMENT)**：代码托管、部署平台

## 2. 平台分类

### 2.1 营销平台 (Marketing Platforms)

| 平台 | 用途 | 优先级 | API 成本 |
|------|------|--------|----------|
| Twitter/X | 社交媒体营销、品牌曝光 | P0 | 免费（基础）/ $100/月（Pro） |
| Product Hunt | 产品发布、早期用户获取 | P0 | 免费 |
| Reddit | 社区营销、用户反馈 | P1 | 免费 |
| LinkedIn | B2B 营销、专业网络 | P1 | 免费（基础）/ $75/月（Marketing API） |
| Facebook Ads | 付费广告投放 | P2 | 按消费计费 |
| Google Ads | 搜索广告 | P2 | 按消费计费 |

### 2.2 内容平台 (Content Platforms)

| 平台 | 用途 | 优先级 | API 成本 |
|------|------|--------|----------|
| Medium | 博客发布、内容分发 | P0 | 免费 |
| YouTube | 视频内容发布 | P0 | 免费 |
| Ghost | 自托管博客平台 | P1 | 免费（自托管）/ $9/月（托管） |
| Substack | Newsletter 发布 | P1 | 免费 |
| WordPress | 博客平台、CMS | P2 | 免费 |
| Dev.to | 技术博客社区 | P2 | 免费 |

### 2.3 客服平台 (Customer Service Platforms)

| 平台 | 用途 | 优先级 | API 成本 |
|------|------|--------|----------|
| Zendesk | 工单系统、客户支持 | P0 | $49/月起 |
| Intercom | 实时聊天、客户沟通 | P0 | $39/月起 |
| Help Scout | 邮件客服、知识库 | P1 | $20/月起 |
| Freshdesk | 工单系统 | P1 | 免费（基础）/ $15/月起 |
| Discord | 社区支持 | P2 | 免费 |

### 2.4 开发平台 (Development Platforms)

| 平台 | 用途 | 优先级 | API 成本 |
|------|------|--------|----------|
| GitHub | 代码托管、CI/CD | P0 | 免费（公开仓库）/ $4/月起 |
| Vercel | 前端部署、Serverless | P0 | 免费（Hobby）/ $20/月起 |
| Railway | 后端部署、数据库 | P1 | $5/月起（按使用量） |
| GitLab | 代码托管、DevOps | P1 | 免费（基础）/ $19/月起 |
| Netlify | 静态网站部署 | P2 | 免费（基础）/ $19/月起 |

### 2.5 通用平台 (Universal Platforms)

| 平台 | 用途 | 优先级 | API 成本 |
|------|------|--------|----------|
| Stripe | 支付处理 | P0 | 2.9% + $0.30/笔 |
| Gumroad | 数字产品销售 | P1 | 10% + $0.30/笔 |
| Lemon Squeezy | 数字产品销售（含税务） | P1 | 5% + $0.50/笔 |

## 3. 统一接口设计

### 3.1 Platform Interface

所有平台集成必须实现统一的 `Platform` 接口：

```typescript
export interface Platform {
  // 平台元数据
  readonly id: string;
  readonly name: string;
  readonly type: PlatformType;
  readonly companyTypes: CompanyType[];

  // 认证
  authenticate(credentials: PlatformCredentials): Promise<AuthResult>;
  refreshAuth(refreshToken: string): Promise<AuthResult>;
  disconnect(): Promise<void>;

  // 健康检查
  healthCheck(): Promise<HealthStatus>;

  // 核心操作
  publish(content: Content): Promise<PublishResult>;
  fetch(query: FetchQuery): Promise<FetchResult>;
  update(id: string, content: Partial<Content>): Promise<UpdateResult>;
  delete(id: string): Promise<DeleteResult>;

  // 分析数据
  getAnalytics(timeRange: TimeRange): Promise<Analytics>;

  // Webhook
  handleWebhook(payload: WebhookPayload): Promise<void>;
}

export type PlatformType =
  | 'SOCIAL_MEDIA'
  | 'CONTENT_PLATFORM'
  | 'CUSTOMER_SERVICE'
  | 'DEVELOPMENT'
  | 'PAYMENT';

export type CompanyType =
  | 'MARKETING'
  | 'CONTENT'
  | 'CUSTOMER_SERVICE'
  | 'DEVELOPMENT';

export interface PlatformCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  [key: string]: any;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface HealthStatus {
  healthy: boolean;
  latency: number;
  rateLimit?: {
    remaining: number;
    reset: Date;
  };
  error?: string;
}
```

### 3.2 Content Interface

统一的内容格式，支持多平台发布：

```typescript
export interface Content {
  // 基础信息
  title?: string;
  body: string;
  summary?: string;

  // 媒体
  images?: MediaFile[];
  videos?: MediaFile[];
  attachments?: MediaFile[];

  // 元数据
  tags?: string[];
  categories?: string[];
  publishAt?: Date;

  // 平台特定
  platformSpecific?: {
    [platformId: string]: any;
  };
}

export interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'document';
  mimeType: string;
  size: number;
  alt?: string;
}
```

## 4. 平台注册表 (Factory Pattern)

使用 Factory Pattern 管理所有平台实例：

```typescript
export class PlatformRegistry {
  private platforms: Map<string, Platform> = new Map();

  register(platform: Platform): void {
    this.platforms.set(platform.id, platform);
  }

  get(platformId: string): Platform | undefined {
    return this.platforms.get(platformId);
  }

  getByType(type: PlatformType): Platform[] {
    return Array.from(this.platforms.values())
      .filter(p => p.type === type);
  }

  getByCompanyType(companyType: CompanyType): Platform[] {
    return Array.from(this.platforms.values())
      .filter(p => p.companyTypes.includes(companyType));
  }

  listAll(): Platform[] {
    return Array.from(this.platforms.values());
  }
}

// 全局注册表实例
export const platformRegistry = new PlatformRegistry();

// 注册所有平台
platformRegistry.register(new TwitterPlatform());
platformRegistry.register(new ProductHuntPlatform());
platformRegistry.register(new MediumPlatform());
platformRegistry.register(new ZendeskPlatform());
platformRegistry.register(new GitHubPlatform());
platformRegistry.register(new StripePlatform());
// ... 其他平台
```

## 5. 错误处理策略

### 5.1 重试逻辑

使用指数退避策略处理临时性错误：

```typescript
export class RetryStrategy {
  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      retryableErrors = [408, 429, 500, 502, 503, 504],
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // 检查是否可重试
        if (
          attempt === maxRetries ||
          !this.isRetryable(error, retryableErrors)
        ) {
          throw error;
        }

        // 等待后重试
        await this.sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError!;
  }

  private isRetryable(error: any, retryableErrors: number[]): boolean {
    if (error.statusCode) {
      return retryableErrors.includes(error.statusCode);
    }
    return error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: number[];
}
```

### 5.2 速率限制

实现 Token Bucket 算法处理 API 速率限制：

```typescript
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // 等待足够的 tokens
    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000;
    await this.sleep(waitTime);
    this.tokens = 0;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 为每个平台配置速率限制
export const rateLimiters = {
  twitter: new RateLimiter(300, 300 / (15 * 60)), // 300 requests per 15 min
  productHunt: new RateLimiter(100, 100 / 3600), // 100 requests per hour
  medium: new RateLimiter(1000, 1000 / 3600), // 1000 requests per hour
  github: new RateLimiter(5000, 5000 / 3600), // 5000 requests per hour
  stripe: new RateLimiter(100, 100 / 1), // 100 requests per second
};
```

### 5.3 健康监控

定期检查平台健康状态：

```typescript
export class HealthMonitor {
  private healthStatus: Map<string, HealthStatus> = new Map();

  async checkAll(platforms: Platform[]): Promise<Map<string, HealthStatus>> {
    const checks = platforms.map(async platform => {
      try {
        const status = await platform.healthCheck();
        this.healthStatus.set(platform.id, status);
        return { platformId: platform.id, status };
      } catch (error) {
        const errorStatus: HealthStatus = {
          healthy: false,
          latency: -1,
          error: (error as Error).message,
        };
        this.healthStatus.set(platform.id, errorStatus);
        return { platformId: platform.id, status: errorStatus };
      }
    });

    await Promise.all(checks);
    return this.healthStatus;
  }

  getStatus(platformId: string): HealthStatus | undefined {
    return this.healthStatus.get(platformId);
  }

  isHealthy(platformId: string): boolean {
    const status = this.healthStatus.get(platformId);
    return status?.healthy ?? false;
  }
}
```

## 6. OAuth 流程

### 6.1 统一 OAuth 接口

```typescript
export interface OAuthProvider {
  // 获取授权 URL
  getAuthorizationUrl(state: string, scopes: string[]): string;

  // 交换授权码获取 token
  exchangeCode(code: string): Promise<OAuthTokens>;

  // 刷新 token
  refreshToken(refreshToken: string): Promise<OAuthTokens>;

  // 撤销 token
  revokeToken(token: string): Promise<void>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export class OAuthManager {
  private providers: Map<string, OAuthProvider> = new Map();

  register(platformId: string, provider: OAuthProvider): void {
    this.providers.set(platformId, provider);
  }

  async startFlow(
    platformId: string,
    scopes: string[]
  ): Promise<{ url: string; state: string }> {
    const provider = this.providers.get(platformId);
    if (!provider) {
      throw new Error(`OAuth provider not found: ${platformId}`);
    }

    const state = this.generateState();
    const url = provider.getAuthorizationUrl(state, scopes);

    // 存储 state 用于验证
    await this.saveState(state, platformId);

    return { url, state };
  }

  async completeFlow(
    code: string,
    state: string
  ): Promise<{ platformId: string; tokens: OAuthTokens }> {
    // 验证 state
    const platformId = await this.validateState(state);
    if (!platformId) {
      throw new Error('Invalid OAuth state');
    }

    const provider = this.providers.get(platformId);
    if (!provider) {
      throw new Error(`OAuth provider not found: ${platformId}`);
    }

    const tokens = await provider.exchangeCode(code);
    return { platformId, tokens };
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async saveState(state: string, platformId: string): Promise<void> {
    // 存储到数据库或缓存，设置过期时间（如 10 分钟）
  }

  private async validateState(state: string): Promise<string | null> {
    // 从数据库或缓存验证并获取 platformId
    return null;
  }
}
```

### 6.2 OAuth 回调处理

```typescript
// Next.js API Route: /api/oauth/callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return Response.json(
      { error: `OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return Response.json(
      { error: 'Missing code or state' },
      { status: 400 }
    );
  }

  try {
    const { platformId, tokens } = await oauthManager.completeFlow(code, state);

    // 保存 tokens 到数据库
    await savePlatformTokens(platformId, tokens);

    // 重定向到成功页面
    return Response.redirect('/dashboard?oauth=success');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect('/dashboard?oauth=error');
  }
}
```

## 7. Webhook 处理

### 7.1 统一 Webhook 架构

```typescript
export interface WebhookHandler {
  // 验证 webhook 签名
  verifySignature(payload: string, signature: string): boolean;

  // 处理 webhook 事件
  handleEvent(event: WebhookEvent): Promise<void>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: any;
}

export class WebhookRouter {
  private handlers: Map<string, WebhookHandler> = new Map();

  register(platformId: string, handler: WebhookHandler): void {
    this.handlers.set(platformId, handler);
  }

  async route(platformId: string, request: Request): Promise<Response> {
    const handler = this.handlers.get(platformId);
    if (!handler) {
      return Response.json(
        { error: 'Platform not found' },
        { status: 404 }
      );
    }

    try {
      const payload = await request.text();
      const signature = request.headers.get('x-signature') || '';

      // 验证签名
      if (!handler.verifySignature(payload, signature)) {
        return Response.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }

      // 解析事件
      const event = JSON.parse(payload);

      // 异步处理事件（避免阻塞响应）
      this.processEventAsync(handler, event);

      // 立即返回 200
      return Response.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private async processEventAsync(
    handler: WebhookHandler,
    event: any
  ): Promise<void> {
    try {
      await handler.handleEvent(event);
    } catch (error) {
      console.error('Event processing error:', error);
      // 可以实现重试逻辑或死信队列
    }
  }
}
```

### 7.2 Webhook 端点

```typescript
// Next.js API Route: /api/webhooks/[platform]
export async function POST(
  request: Request,
  { params }: { params: { platform: string } }
) {
  const platformId = params.platform;
  return await webhookRouter.route(platformId, request);
}
```

## 8. 实现优先级

### 8.1 按公司类型排序

#### Phase 1: 营销公司 (Week 1-2)
- **P0 平台**：
  - Twitter/X：社交媒体营销核心
  - Product Hunt：产品发布必备
  - Stripe：支付处理
- **实现内容**：
  - OAuth 认证流程
  - 发布内容到 Twitter
  - Product Hunt 产品发布
  - 基础分析数据获取

#### Phase 2: 内容公司 (Week 3-4)
- **P0 平台**：
  - Medium：博客发布核心
  - YouTube：视频内容发布
  - Stripe：支付处理
- **实现内容**：
  - Medium 文章发布
  - YouTube 视频上传和管理
  - 内容分析和统计

#### Phase 3: 客服公司 (Week 5)
- **P0 平台**：
  - Zendesk：工单系统
  - Intercom：实时聊天
- **实现内容**：
  - 工单创建和管理
  - 实时聊天集成
  - 客户数据同步

#### Phase 4: 开发公司 (Week 6)
- **P0 平台**：
  - GitHub：代码托管
  - Vercel：部署平台
- **实现内容**：
  - 仓库管理
  - CI/CD 集成
  - 部署自动化

### 8.2 按重要性排序

| 优先级 | 平台 | 公司类型 | 理由 |
|--------|------|----------|------|
| P0 | Twitter/X | MARKETING | 社交媒体营销核心，用户基数大 |
| P0 | Product Hunt | MARKETING | 产品发布必备，早期用户获取 |
| P0 | Medium | CONTENT | 博客发布核心，内容分发广泛 |
| P0 | YouTube | CONTENT | 视频内容主流平台 |
| P0 | Zendesk | CUSTOMER_SERVICE | 企业级工单系统标准 |
| P0 | Intercom | CUSTOMER_SERVICE | 实时聊天主流选择 |
| P0 | GitHub | DEVELOPMENT | 代码托管行业标准 |
| P0 | Vercel | DEVELOPMENT | 前端部署最佳实践 |
| P0 | Stripe | ALL | 支付处理行业标准 |
| P1 | Reddit | MARKETING | 社区营销重要渠道 |
| P1 | LinkedIn | MARKETING | B2B 营销必备 |
| P1 | Ghost | CONTENT | 自托管博客优选 |
| P1 | Substack | CONTENT | Newsletter 主流平台 |
| P1 | Help Scout | CUSTOMER_SERVICE | 邮件客服优选 |
| P1 | Railway | DEVELOPMENT | 后端部署便捷方案 |
| P1 | Gumroad | ALL | 数字产品销售简单方案 |
| P2 | Facebook Ads | MARKETING | 付费广告可选 |
| P2 | Google Ads | MARKETING | 搜索广告可选 |
| P2 | WordPress | CONTENT | 传统博客平台 |
| P2 | Freshdesk | CUSTOMER_SERVICE | 工单系统备选 |
| P2 | GitLab | DEVELOPMENT | GitHub 备选方案 |

## 9. 平台实现示例

### 9.1 Twitter Platform

```typescript
export class TwitterPlatform implements Platform {
  readonly id = 'twitter';
  readonly name = 'Twitter/X';
  readonly type: PlatformType = 'SOCIAL_MEDIA';
  readonly companyTypes: CompanyType[] = ['MARKETING'];

  private client: TwitterApi;
  private rateLimiter: RateLimiter;
  private retryStrategy: RetryStrategy;

  constructor(credentials: PlatformCredentials) {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });
    this.rateLimiter = rateLimiters.twitter;
    this.retryStrategy = new RetryStrategy();
  }

  async authenticate(credentials: PlatformCredentials): Promise<AuthResult> {
    try {
      // OAuth 1.0a 认证流程
      const authLink = await this.client.generateAuthLink();
      return {
        success: true,
        accessToken: authLink.oauth_token,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async refreshAuth(refreshToken: string): Promise<AuthResult> {
    // Twitter OAuth 1.0a 不需要刷新
    return { success: true };
  }

  async disconnect(): Promise<void> {
    // 清理本地凭证
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.rateLimiter.acquire();
      const response = await this.client.v2.me();
      const latency = Date.now() - start;

      return {
        healthy: true,
        latency,
        rateLimit: {
          remaining: response.rateLimit?.remaining || 0,
          reset: new Date(response.rateLimit?.reset || 0),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: (error as Error).message,
      };
    }
  }

  async publish(content: Content): Promise<PublishResult> {
    await this.rateLimiter.acquire();

    return this.retryStrategy.execute(async () => {
      const tweetText = this.formatTweet(content);

      // 上传媒体（如果有）
      const mediaIds: string[] = [];
      if (content.images && content.images.length > 0) {
        for (const image of content.images.slice(0, 4)) {
          const mediaId = await this.uploadMedia(image.url);
          mediaIds.push(mediaId);
        }
      }

      // 发布推文
      const tweet = await this.client.v2.tweet({
        text: tweetText,
        media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined,
      });

      return {
        success: true,
        id: tweet.data.id,
        url: `https://twitter.com/i/web/status/${tweet.data.id}`,
      };
    });
  }

  async fetch(query: FetchQuery): Promise<FetchResult> {
    await this.rateLimiter.acquire();

    return this.retryStrategy.execute(async () => {
      const tweets = await this.client.v2.userTimeline(query.userId, {
        max_results: query.limit || 10,
      });

      return {
        success: true,
        data: tweets.data.data,
      };
    });
  }

  async update(id: string, content: Partial<Content>): Promise<UpdateResult> {
    // Twitter 不支持编辑推文（除了 Twitter Blue）
    throw new Error('Twitter does not support editing tweets');
  }

  async delete(id: string): Promise<DeleteResult> {
    await this.rateLimiter.acquire();

    return this.retryStrategy.execute(async () => {
      await this.client.v2.deleteTweet(id);
      return { success: true };
    });
  }

  async getAnalytics(timeRange: TimeRange): Promise<Analytics> {
    await this.rateLimiter.acquire();

    return this.retryStrategy.execute(async () => {
      // 获取推文分析数据
      const metrics = await this.client.v2.tweetMetrics();

      return {
        impressions: metrics.impression_count,
        engagements: metrics.engagement_count,
        clicks: metrics.url_link_clicks,
        likes: metrics.like_count,
        retweets: metrics.retweet_count,
        replies: metrics.reply_count,
      };
    });
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // 处理 Twitter webhook 事件
    const event = payload.data;

    switch (event.type) {
      case 'tweet.created':
        // 处理新推文
        break;
      case 'user.followed':
        // 处理新关注者
        break;
      default:
        console.log('Unknown event type:', event.type);
    }
  }

  private formatTweet(content: Content): string {
    let text = content.body;

    // Twitter 字符限制
    if (text.length > 280) {
      text = text.substring(0, 277) + '...';
    }

    // 添加标签
    if (content.tags && content.tags.length > 0) {
      const tags = content.tags.map(tag => `#${tag}`).join(' ');
      text = `${text}\n\n${tags}`;
    }

    return text;
  }

  private async uploadMedia(url: string): Promise<string> {
    // 下载图片
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    // 上传到 Twitter
    const mediaId = await this.client.v1.uploadMedia(Buffer.from(buffer), {
      mimeType: response.headers.get('content-type') || 'image/jpeg',
    });

    return mediaId;
  }
}

export interface PublishResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

export interface FetchQuery {
  userId?: string;
  limit?: number;
  since?: Date;
  until?: Date;
}

export interface FetchResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface Analytics {
  impressions: number;
  engagements: number;
  clicks: number;
  likes: number;
  retweets: number;
  replies: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface WebhookPayload {
  data: any;
}
```

## 10. 成本分析

### 10.1 API 成本对比

| 平台 | 免费额度 | 付费计划 | 估算月成本（1000 用户） |
|------|----------|----------|-------------------------|
| Twitter/X | 基础 API 免费 | Pro: $100/月 | $100 |
| Product Hunt | 完全免费 | N/A | $0 |
| Reddit | 完全免费 | N/A | $0 |
| LinkedIn | 基础免费 | Marketing API: $75/月 | $75 |
| Medium | 完全免费 | N/A | $0 |
| YouTube | 完全免费 | N/A | $0 |
| Ghost | 自托管免费 | 托管: $9/月 | $9 |
| Substack | 完全免费 | N/A | $0 |
| Zendesk | N/A | $49/月起 | $49 |
| Intercom | N/A | $39/月起 | $39 |
| Help Scout | N/A | $20/月起 | $20 |
| GitHub | 公开仓库免费 | Team: $4/用户/月 | $4 |
| Vercel | Hobby 免费 | Pro: $20/月 | $20 |
| Railway | N/A | 按使用量: ~$5/月 | $5 |
| Stripe | N/A | 2.9% + $0.30/笔 | 按交易量 |
| Gumroad | N/A | 10% + $0.30/笔 | 按交易量 |

### 10.2 总成本估算

**最小可行配置（MVP）**：
- Twitter Pro: $100/月
- 其他免费平台: $0
- **总计**: ~$100/月

**完整配置（所有 P0 平台）**：
- Twitter Pro: $100/月
- Zendesk: $49/月
- Intercom: $39/月
- Vercel Pro: $20/月
- GitHub Team: $4/月
- Railway: $5/月
- **总计**: ~$217/月

**企业配置（所有平台）**：
- 上述 P0 平台: $217/月
- LinkedIn Marketing API: $75/月
- Ghost 托管: $9/月
- Help Scout: $20/月
- **总计**: ~$321/月

## 11. 安全考虑

### 11.1 凭证存储

```typescript
// 使用加密存储敏感凭证
export class CredentialStore {
  async save(
    platformId: string,
    userId: string,
    credentials: PlatformCredentials
  ): Promise<void> {
    const encrypted = await this.encrypt(JSON.stringify(credentials));

    await db.insert('platform_credentials', {
      platformId,
      userId,
      credentials: encrypted,
      updatedAt: new Date(),
    });
  }

  async get(
    platformId: string,
    userId: string
  ): Promise<PlatformCredentials | null> {
    const record = await db.query('platform_credentials')
      .where({ platformId, userId })
      .first();

    if (!record) return null;

    const decrypted = await this.decrypt(record.credentials);
    return JSON.parse(decrypted);
  }

  private async encrypt(data: string): Promise<string> {
    // 使用 AES-256-GCM 加密
    const key = process.env.ENCRYPTION_KEY!;
    // ... 加密实现
    return '';
  }

  private async decrypt(data: string): Promise<string> {
    // 解密
    const key = process.env.ENCRYPTION_KEY!;
    // ... 解密实现
    return '';
  }
}
```

### 11.2 权限控制

```typescript
export class PermissionManager {
  async checkPermission(
    userId: string,
    platformId: string,
    action: string
  ): Promise<boolean> {
    // 检查用户是否有权限访问该平台
    const connection = await db.query('platform_connections')
      .where({ userId, platformId })
      .first();

    if (!connection || !connection.connected) {
      return false;
    }

    // 检查具体操作权限
    const permissions = connection.permissions || [];
    return permissions.includes(action);
  }
}
```

## 12. 测试策略

### 12.1 单元测试

```typescript
describe('TwitterPlatform', () => {
  let platform: TwitterPlatform;

  beforeEach(() => {
    platform = new TwitterPlatform({
      accessToken: 'test-token',
      accessSecret: 'test-secret',
    });
  });

  it('should publish a tweet', async () => {
    const content: Content = {
      body: 'Test tweet',
      tags: ['test'],
    };

    const result = await platform.publish(content);
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    // 测试速率限制
  });

  it('should retry on temporary errors', async () => {
    // 测试重试逻辑
  });
});
```

### 12.2 集成测试

```typescript
describe('Platform Integration', () => {
  it('should connect to Twitter', async () => {
    const result = await platformRegistry.get('twitter')?.authenticate({
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    });

    expect(result?.success).toBe(true);
  });

  it('should publish to multiple platforms', async () => {
    const content: Content = {
      body: 'Multi-platform test',
    };

    const platforms = ['twitter', 'medium'];
    const results = await Promise.all(
      platforms.map(id =>
        platformRegistry.get(id)?.publish(content)
      )
    );

    results.forEach(result => {
      expect(result?.success).toBe(true);
    });
  });
});
```

## 13. 监控和日志

### 13.1 日志记录

```typescript
export class PlatformLogger {
  async log(event: PlatformEvent): Promise<void> {
    await db.insert('platform_logs', {
      platformId: event.platformId,
      userId: event.userId,
      action: event.action,
      status: event.status,
      duration: event.duration,
      error: event.error,
      timestamp: new Date(),
    });
  }

  async getRecentErrors(platformId: string, limit: number = 10): Promise<any[]> {
    return db.query('platform_logs')
      .where({ platformId, status: 'error' })
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }
}

export interface PlatformEvent {
  platformId: string;
  userId: string;
  action: string;
  status: 'success' | 'error';
  duration: number;
  error?: string;
}
```

### 13.2 性能监控

```typescript
export class PerformanceMonitor {
  async trackApiCall(
    platformId: string,
    endpoint: string,
    duration: number
  ): Promise<void> {
    await db.insert('api_metrics', {
      platformId,
      endpoint,
      duration,
      timestamp: new Date(),
    });
  }

  async getAverageLatency(
    platformId: string,
    timeRange: TimeRange
  ): Promise<number> {
    const metrics = await db.query('api_metrics')
      .where({ platformId })
      .whereBetween('timestamp', [timeRange.start, timeRange.end]);

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }
}
```

## 14. 总结

本文档定义了 AI Company Builder v0.2 的统一平台集成架构，包括：

1. **平台分类**：按公司类型组织的 20+ 平台
2. **统一接口**：`Platform` 接口和 `Content` 格式
3. **平台注册表**：Factory Pattern 管理平台实例
4. **错误处理**：重试逻辑、速率限制、健康监控
5. **OAuth 流程**：统一认证和 token 管理
6. **Webhook 处理**：异步事件处理架构
7. **实现优先级**：按公司类型和重要性排序
8. **成本分析**：详细的 API 成本对比
9. **安全考虑**：凭证加密和权限控制
10. **测试策略**：单元测试和集成测试
11. **监控日志**：性能监控和错误追踪

**下一步行动**：
1. 实现 Phase 1（营销公司）的 P0 平台
2. 建立 CI/CD 流程
3. 编写平台集成测试
4. 部署到生产环境
