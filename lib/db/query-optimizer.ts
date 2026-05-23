/**
 * 数据库查询优化工具
 * 提供查询缓存、批量操作和性能优化功能
 */

import { performanceMonitor } from '../monitoring/performance-monitor';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 分钟

  /**
   * 获取缓存数据
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存数据
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

/**
 * 带缓存的查询装饰器
 */
export function withCache(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`;
      const cached = queryCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      queryCache.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}

/**
 * 批量查询优化
 */
export class BatchQuery<T> {
  private queue: Array<{
    id: string;
    resolve: (value: T) => void;
    reject: (error: any) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchDelay = 10; // 10ms

  constructor(
    private fetchFn: (ids: string[]) => Promise<Map<string, T>>,
    batchDelay?: number
  ) {
    if (batchDelay) {
      this.batchDelay = batchDelay;
    }
  }

  /**
   * 添加查询到批处理队列
   */
  async query(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.executeBatch();
      }, this.batchDelay);
    });
  }

  /**
   * 执行批量查询
   */
  private async executeBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);
    const ids = batch.map((item) => item.id);

    try {
      const results = await this.fetchFn(ids);

      batch.forEach((item) => {
        const result = results.get(item.id);
        if (result) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for id: ${item.id}`));
        }
      });
    } catch (error) {
      batch.forEach((item) => item.reject(error));
    }
  }
}

/**
 * 数据库查询优化建议
 */
export const queryOptimizations = {
  /**
   * 使用索引
   */
  useIndexes: [
    'CREATE INDEX idx_companies_user_id ON companies(user_id)',
    'CREATE INDEX idx_agents_company_id ON agents(company_id)',
    'CREATE INDEX idx_tasks_agent_id ON tasks(agent_id)',
    'CREATE INDEX idx_tasks_status ON tasks(status)',
    'CREATE INDEX idx_activities_company_id ON activities(company_id)',
    'CREATE INDEX idx_activities_created_at ON activities(created_at)',
    'CREATE INDEX idx_costs_company_id ON costs(company_id)',
    'CREATE INDEX idx_costs_created_at ON costs(created_at)',
    'CREATE INDEX idx_memories_agent_id ON memories(agent_id)',
    'CREATE INDEX idx_platform_connections_company_id ON platform_connections(company_id)',
  ],

  /**
   * 查询优化技巧
   */
  tips: [
    '1. 使用 SELECT 指定字段而不是 SELECT *',
    '2. 使用 LIMIT 限制返回结果数量',
    '3. 避免在 WHERE 子句中使用函数',
    '4. 使用 JOIN 代替子查询',
    '5. 使用批量插入代替单条插入',
    '6. 定期清理过期数据',
    '7. 使用连接池管理数据库连接',
    '8. 使用预编译语句防止 SQL 注入',
    '9. 监控慢查询并优化',
    '10. 使用缓存减少数据库访问',
  ],

  /**
   * 常见慢查询优化
   */
  slowQueryOptimizations: {
    // 优化前
    before: `
      SELECT * FROM activities
      WHERE company_id = ?
      ORDER BY created_at DESC
    `,
    // 优化后
    after: `
      SELECT id, type, description, created_at
      FROM activities
      WHERE company_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `,

    // 使用索引
    withIndex: `
      CREATE INDEX idx_activities_company_created
      ON activities(company_id, created_at DESC)
    `,
  },
};

/**
 * 连接池配置
 */
export const poolConfig = {
  max: 20, // 最大连接数
  min: 5, // 最小连接数
  idle: 10000, // 空闲超时时间（毫秒）
  acquire: 30000, // 获取连接超时时间（毫秒）
  evict: 1000, // 检查空闲连接的间隔（毫秒）
};

/**
 * 查询性能监控
 */
export async function monitoredQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return await performanceMonitor.measureAsync(
    `db_${queryName}`,
    queryFn,
    'database'
  );
}
