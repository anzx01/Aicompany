/**
 * 性能监控系统
 * 提供性能指标收集、分析和报告功能
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: string;
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    pageLoad: number;
    apiResponse: number;
    databaseQuery: number;
    renderTime: number;
  };
  slowestOperations: Array<{
    name: string;
    duration: number;
    timestamp: Date;
  }>;
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000;
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBrowserMonitoring();
    }
  }

  /**
   * 初始化浏览器性能监控
   */
  private initBrowserMonitoring(): void {
    // 监控导航时间
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.fetchStart, 'ms', 'navigation');
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'ms', 'navigation');
              this.recordMetric('first_paint', navEntry.responseEnd - navEntry.fetchStart, 'ms', 'navigation');
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (e) {
        console.warn('Failed to initialize navigation observer:', e);
      }

      // 监控资源加载
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              this.recordMetric(
                `resource_${resourceEntry.initiatorType}`,
                resourceEntry.duration,
                'ms',
                'resource',
                { name: resourceEntry.name }
              );
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (e) {
        console.warn('Failed to initialize resource observer:', e);
      }

      // 监控 LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', lastEntry.startTime, 'ms', 'web-vitals');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (e) {
        console.warn('Failed to initialize LCP observer:', e);
      }

      // 监控 FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as PerformanceEventTiming;
            this.recordMetric('fid', fidEntry.processingStart - fidEntry.startTime, 'ms', 'web-vitals');
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (e) {
        console.warn('Failed to initialize FID observer:', e);
      }

      // 监控 CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric('cls', clsValue, 'score', 'web-vitals');
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (e) {
        console.warn('Failed to initialize CLS observer:', e);
      }
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    category: string,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateId(),
      name,
      value,
      unit,
      timestamp: new Date(),
      category,
      tags,
    };

    this.metrics.push(metric);

    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 发送到监控服务（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metric);
    }
  }

  /**
   * 测量函数执行时间
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: string = 'function'
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', category);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', category, { error: 'true' });
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measure<T>(name: string, fn: () => T, category: string = 'function'): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', category);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', category, { error: 'true' });
      throw error;
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(filters?: {
    category?: string;
    name?: string;
    startDate?: Date;
    endDate?: Date;
  }): PerformanceMetric[] {
    let filtered = this.metrics;

    if (filters) {
      if (filters.category) {
        filtered = filtered.filter((m) => m.category === filters.category);
      }
      if (filters.name) {
        filtered = filtered.filter((m) => m.name === filters.name);
      }
      if (filters.startDate) {
        filtered = filtered.filter((m) => m.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((m) => m.timestamp <= filters.endDate!);
      }
    }

    return filtered;
  }

  /**
   * 获取性能报告
   */
  getReport(startDate?: Date, endDate?: Date): PerformanceReport {
    const metrics = this.getMetrics({ startDate, endDate });

    const pageLoadMetrics = metrics.filter((m) => m.name === 'page_load');
    const apiMetrics = metrics.filter((m) => m.category === 'api');
    const dbMetrics = metrics.filter((m) => m.category === 'database');
    const renderMetrics = metrics.filter((m) => m.category === 'render');

    const avgPageLoad = this.calculateAverage(pageLoadMetrics);
    const avgApiResponse = this.calculateAverage(apiMetrics);
    const avgDbQuery = this.calculateAverage(dbMetrics);
    const avgRenderTime = this.calculateAverage(renderMetrics);

    const slowestOperations = metrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((m) => ({
        name: m.name,
        duration: m.value,
        timestamp: m.timestamp,
      }));

    const recommendations = this.generateRecommendations({
      pageLoad: avgPageLoad,
      apiResponse: avgApiResponse,
      databaseQuery: avgDbQuery,
      renderTime: avgRenderTime,
    });

    return {
      period: {
        start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: endDate || new Date(),
      },
      metrics: {
        pageLoad: avgPageLoad,
        apiResponse: avgApiResponse,
        databaseQuery: avgDbQuery,
        renderTime: avgRenderTime,
      },
      slowestOperations,
      recommendations,
    };
  }

  /**
   * 清除指标
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }

  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  private generateRecommendations(metrics: {
    pageLoad: number;
    apiResponse: number;
    databaseQuery: number;
    renderTime: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.pageLoad > 3000) {
      recommendations.push('页面加载时间过长，建议优化资源加载和代码分割');
    }

    if (metrics.apiResponse > 500) {
      recommendations.push('API 响应时间较慢，建议优化后端逻辑或添加缓存');
    }

    if (metrics.databaseQuery > 100) {
      recommendations.push('数据库查询较慢，建议添加索引或优化查询语句');
    }

    if (metrics.renderTime > 200) {
      recommendations.push('渲染时间较长，建议优化组件渲染逻辑或使用虚拟化');
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持！');
    }

    return recommendations;
  }

  private async sendToMonitoring(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (e) {
      console.error('Failed to send metric to monitoring service:', e);
    }
  }
}

// 全局性能监控器实例
export const performanceMonitor = new PerformanceMonitor();

// React Hook
export function usePerformanceMonitor() {
  const measureRender = (componentName: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(
        `render_${componentName}`,
        duration,
        'ms',
        'render'
      );
    };
  };

  return { measureRender };
}

// 装饰器
export function measurePerformance(category: string = 'function') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await performanceMonitor.measureAsync(
        propertyKey,
        () => originalMethod.apply(this, args),
        category
      );
    };

    return descriptor;
  };
}
