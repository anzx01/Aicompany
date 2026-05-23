/**
 * 安全工具和中间件
 * 提供输入验证、XSS 防护、CSRF 保护等安全功能
 */

import { z } from 'zod';

/**
 * 输入验证和清理
 */
export const sanitize = {
  /**
   * 清理 HTML 标签
   */
  html: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * 清理 SQL 注入
   */
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },

  /**
   * 清理路径遍历
   */
  path: (input: string): string => {
    return input.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  },

  /**
   * 清理 URL
   */
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // 只允许 http 和 https 协议
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  /**
   * 清理邮箱
   */
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },
};

/**
 * 输入验证 Schema
 */
export const validationSchemas = {
  // 用户输入
  userInput: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
  }),

  // 公司创建
  companyCreate: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['marketing', 'content', 'customer-service', 'development']),
    description: z.string().max(500).optional(),
    budget: z.number().min(0).max(10000),
  }),

  // Agent 配置
  agentConfig: z.object({
    name: z.string().min(1).max(100),
    role: z.string().min(1).max(50),
    capabilities: z.array(z.string()).max(20),
    systemPrompt: z.string().max(5000),
  }),

  // API 密钥
  apiKey: z.string().regex(/^[a-zA-Z0-9_-]+$/),

  // URL
  url: z.string().url(),

  // ID
  id: z.string().uuid(),
};

/**
 * 速率限制
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private window: number;

  constructor(limit: number = 100, window: number = 60000) {
    this.limit = limit;
    this.window = window;
  }

  /**
   * 检查是否超过速率限制
   */
  check(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // 清理过期的请求记录
    const validRequests = requests.filter((time) => now - time < this.window);

    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * 获取剩余请求数
   */
  remaining(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter((time) => now - time < this.window);
    return Math.max(0, this.limit - validRequests.length);
  }

  /**
   * 重置速率限制
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * CSRF Token 生成和验证
 */
export const csrf = {
  /**
   * 生成 CSRF Token
   */
  generateToken: (): string => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * 验证 CSRF Token
   */
  validateToken: (token: string, sessionToken: string): boolean => {
    return token === sessionToken;
  },
};

/**
 * 密码强度验证
 */
export const passwordStrength = {
  /**
   * 检查密码强度
   */
  check: (password: string): {
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // 复杂度检查
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // 生成反馈
    if (password.length < 8) {
      feedback.push('密码至少需要 8 个字符');
    }
    if (!/[a-z]/.test(password)) {
      feedback.push('密码应包含小写字母');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('密码应包含大写字母');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('密码应包含数字');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('密码应包含特殊字符');
    }

    return { score, feedback };
  },

  /**
   * 密码强度等级
   */
  getLevel: (score: number): 'weak' | 'medium' | 'strong' | 'very-strong' => {
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
  },
};

/**
 * 安全 Headers
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; '),
};

/**
 * API 密钥加密
 */
export const encryption = {
  /**
   * 加密 API 密钥
   */
  encrypt: (text: string, key: string): string => {
    // 简化版本，生产环境应使用更强的加密算法
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const keyData = encoder.encode(key);

    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ keyData[i % keyData.length];
    }

    return Buffer.from(encrypted).toString('base64');
  },

  /**
   * 解密 API 密钥
   */
  decrypt: (encrypted: string, key: string): string => {
    const data = Buffer.from(encrypted, 'base64');
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);

    const decrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ keyData[i % keyData.length];
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  },
};

/**
 * 敏感信息脱敏
 */
export const mask = {
  /**
   * 脱敏邮箱
   */
  email: (email: string): string => {
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  },

  /**
   * 脱敏 API 密钥
   */
  apiKey: (key: string): string => {
    if (key.length <= 8) return '***';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  },

  /**
   * 脱敏手机号
   */
  phone: (phone: string): string => {
    if (phone.length <= 7) return '***';
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
  },
};

/**
 * 审计日志
 */
export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];

  /**
   * 记录审计日志
   */
  log(log: Omit<AuditLog, 'timestamp'>): void {
    this.logs.push({
      ...log,
      timestamp: new Date(),
    });

    // 发送到日志服务
    if (process.env.NODE_ENV === 'production') {
      this.sendToLogService(log);
    }
  }

  /**
   * 获取审计日志
   */
  getLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    let filtered = this.logs;

    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter((log) => log.userId === filters.userId);
      }
      if (filters.action) {
        filtered = filtered.filter((log) => log.action === filters.action);
      }
      if (filters.startDate) {
        filtered = filtered.filter((log) => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((log) => log.timestamp <= filters.endDate!);
      }
    }

    return filtered;
  }

  private async sendToLogService(log: Omit<AuditLog, 'timestamp'>): Promise<void> {
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });
    } catch (e) {
      console.error('Failed to send audit log:', e);
    }
  }
}

export const auditLogger = new AuditLogger();
