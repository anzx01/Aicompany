/**
 * 错误追踪和监控系统
 * 提供统一的错误处理、日志记录和监控功能
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  AUTH = 'auth',
  DATABASE = 'database',
  API = 'api',
  AGENT = 'agent',
  PLATFORM = 'platform',
  SYSTEM = 'system',
  USER = 'user',
}

export interface ErrorContext {
  userId?: string;
  companyId?: string;
  agentId?: string;
  taskId?: string;
  url?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context?: ErrorContext;
  resolved: boolean;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 1000; // 最多保存 1000 条错误日志

  /**
   * 记录错误
   */
  logError(
    error: Error,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context?: ErrorContext
  ): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date(),
      severity,
      category,
      message: error.message,
      stack: error.stack,
      context,
      resolved: false,
    };

    this.errors.push(errorLog);

    // 限制错误日志数量
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // 打印到控制台
    this.logToConsole(errorLog);

    // 发送到监控服务（生产环境）
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorLog);
    }

    // 关键错误发送通知
    if (severity === ErrorSeverity.CRITICAL) {
      this.sendAlert(errorLog);
    }
  }

  /**
   * 记录自定义错误
   */
  logCustomError(
    message: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context?: ErrorContext
  ): void {
    const error = new Error(message);
    this.logError(error, severity, category, context);
  }

  /**
   * 获取错误日志
   */
  getErrors(filters?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): ErrorLog[] {
    let filtered = this.errors;

    if (filters) {
      if (filters.severity) {
        filtered = filtered.filter((e) => e.severity === filters.severity);
      }
      if (filters.category) {
        filtered = filtered.filter((e) => e.category === filters.category);
      }
      if (filters.resolved !== undefined) {
        filtered = filtered.filter((e) => e.resolved === filters.resolved);
      }
      if (filters.startDate) {
        filtered = filtered.filter((e) => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter((e) => e.timestamp <= filters.endDate!);
      }
    }

    return filtered;
  }

  /**
   * 标记错误为已解决
   */
  resolveError(errorId: string): void {
    const error = this.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: this.errors.length,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0,
      },
      byCategory: {
        [ErrorCategory.AUTH]: 0,
        [ErrorCategory.DATABASE]: 0,
        [ErrorCategory.API]: 0,
        [ErrorCategory.AGENT]: 0,
        [ErrorCategory.PLATFORM]: 0,
        [ErrorCategory.SYSTEM]: 0,
        [ErrorCategory.USER]: 0,
      },
      resolved: 0,
      unresolved: 0,
    };

    this.errors.forEach((error) => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category]++;
      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }

  /**
   * 清除已解决的错误
   */
  clearResolved(): void {
    this.errors = this.errors.filter((e) => !e.resolved);
  }

  /**
   * 清除所有错误
   */
  clearAll(): void {
    this.errors = [];
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(error: ErrorLog): void {
    const color = this.getSeverityColor(error.severity);
    console.error(
      `%c[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`,
      `color: ${color}; font-weight: bold;`
    );
    if (error.stack) {
      console.error(error.stack);
    }
    if (error.context) {
      console.error('Context:', error.context);
    }
  }

  private getSeverityColor(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '#3b82f6'; // blue
      case ErrorSeverity.MEDIUM:
        return '#f59e0b'; // amber
      case ErrorSeverity.HIGH:
        return '#ef4444'; // red
      case ErrorSeverity.CRITICAL:
        return '#dc2626'; // dark red
      default:
        return '#6b7280'; // gray
    }
  }

  private async sendToMonitoring(error: ErrorLog): Promise<void> {
    try {
      // 发送到监控服务（例如 Sentry, LogRocket 等）
      // 这里是示例实现
      await fetch('/api/monitoring/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }

  private async sendAlert(error: ErrorLog): Promise<void> {
    try {
      // 发送关键错误警报（例如邮件、Slack 等）
      await fetch('/api/monitoring/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Critical Error: ${error.category}`,
          message: error.message,
          context: error.context,
        }),
      });
    } catch (e) {
      console.error('Failed to send alert:', e);
    }
  }
}

// 全局错误追踪器实例
export const errorTracker = new ErrorTracker();

// 全局错误处理器
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.logError(
      event.error,
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM,
      {
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.logCustomError(
      `Unhandled Promise Rejection: ${event.reason}`,
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM,
      {
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    );
  });
}

// 错误边界 Hook
export function useErrorBoundary() {
  const handleError = (
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.USER
  ) => {
    errorTracker.logError(error, severity, category);
  };

  return { handleError };
}

// 异步错误处理装饰器
export function catchAsync(
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  category: ErrorCategory = ErrorCategory.API
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        errorTracker.logError(
          error as Error,
          severity,
          category,
          {
            method: propertyKey,
            args,
          }
        );
        throw error;
      }
    };

    return descriptor;
  };
}
