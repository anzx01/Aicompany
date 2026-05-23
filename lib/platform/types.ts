/**
 * Platform Integration Types
 *
 * Unified types for all platform integrations
 */

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

export interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  alt?: string;
  caption?: string;
}

export interface Content {
  // Basic info
  title?: string;
  body: string;
  summary?: string;

  // Media
  images?: MediaFile[];
  videos?: MediaFile[];

  // Metadata
  tags?: string[];
  category?: string;
  publishAt?: Date;

  // Platform-specific
  platformSpecific?: Record<string, any>;
}

export interface PublishResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface FetchQuery {
  type: 'posts' | 'comments' | 'messages' | 'tickets' | 'repos';
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface FetchResult {
  success: boolean;
  data: any[];
  total?: number;
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

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface Analytics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
  [key: string]: any;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

/**
 * Platform Interface
 *
 * All platform integrations must implement this interface
 */
export interface Platform {
  // Platform metadata
  readonly id: string;
  readonly name: string;
  readonly type: PlatformType;
  readonly companyTypes: CompanyType[];

  // Authentication
  authenticate(credentials: PlatformCredentials): Promise<AuthResult>;
  refreshAuth(refreshToken: string): Promise<AuthResult>;
  disconnect(): Promise<void>;

  // Health check
  healthCheck(): Promise<HealthStatus>;

  // Core operations
  publish(content: Content): Promise<PublishResult>;
  fetch(query: FetchQuery): Promise<FetchResult>;
  update(id: string, content: Partial<Content>): Promise<UpdateResult>;
  delete(id: string): Promise<DeleteResult>;

  // Analytics
  getAnalytics(timeRange: TimeRange): Promise<Analytics>;

  // Webhook
  handleWebhook(payload: WebhookPayload): Promise<void>;
}

/**
 * Platform Connection Status
 */
export interface PlatformConnection {
  id: string;
  companyId: string;
  platformId: string;
  credentials: PlatformCredentials;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastHealthCheck?: Date;
  createdAt: Date;
  updatedAt: Date;
}
