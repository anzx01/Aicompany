# Sentry 错误追踪集成指南

本文档说明如何在 AI Company Builder 中集成 Sentry 进行错误追踪和性能监控。

## 📋 概述

Sentry 是一个开源的错误追踪和性能监控平台，可以帮助你：
- 实时捕获和追踪错误
- 监控应用性能
- 追踪用户会话
- 分析错误趋势

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm add @sentry/nextjs
```

### 2. 初始化 Sentry

运行 Sentry 向导：

```bash
npx @sentry/wizard@latest -i nextjs
```

这将自动创建以下文件：
- `sentry.client.config.ts` - 客户端配置
- `sentry.server.config.ts` - 服务器端配置
- `sentry.edge.config.ts` - Edge 运行时配置
- `next.config.js` - 更新 Next.js 配置

### 3. 配置环境变量

在 `.env.local` 中添加：

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project

# Optional
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

## 📝 配置文件

### sentry.client.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 采样率
  tracesSampleRate: 1.0,

  // 环境
  environment: process.env.SENTRY_ENVIRONMENT || 'development',

  // 版本
  release: process.env.SENTRY_RELEASE,

  // 忽略的错误
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  // 面包屑
  beforeBreadcrumb(breadcrumb, hint) {
    // 过滤敏感信息
    if (breadcrumb.category === 'console') {
      return null;
    }
    return breadcrumb;
  },

  // 事件处理
  beforeSend(event, hint) {
    // 过滤敏感数据
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

### sentry.server.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,

  environment: process.env.SENTRY_ENVIRONMENT || 'development',

  release: process.env.SENTRY_RELEASE,

  // 服务器端特定配置
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  beforeSend(event, hint) {
    // 过滤敏感数据
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

## 🎯 使用方法

### 1. 手动捕获错误

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // 你的代码
  throw new Error('Something went wrong');
} catch (error) {
  Sentry.captureException(error);
}
```

### 2. 添加上下文

```typescript
import * as Sentry from '@sentry/nextjs';

// 设置用户信息
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// 设置标签
Sentry.setTag('company_id', companyId);
Sentry.setTag('agent_role', agentRole);

// 设置额外数据
Sentry.setContext('company', {
  id: company.id,
  type: company.type,
  status: company.status,
});
```

### 3. 性能监控

```typescript
import * as Sentry from '@sentry/nextjs';

// 创建事务
const transaction = Sentry.startTransaction({
  op: 'agent.execute',
  name: 'Execute Agent Task',
});

try {
  // 你的代码
  const result = await executeTask();

  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### 4. 在 API 路由中使用

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    // 你的代码
    const data = await request.json();

    // 添加面包屑
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'Processing request',
      level: 'info',
      data: { endpoint: '/api/example' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5. 在 tRPC 中使用

```typescript
// server/routers/example.ts
import { router, protectedProcedure } from '../trpc';
import * as Sentry from '@sentry/nextjs';

export const exampleRouter = router({
  doSomething: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 设置用户上下文
        Sentry.setUser({
          id: ctx.user.id,
          email: ctx.user.email,
        });

        // 你的代码
        const result = await performAction(input.id);

        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            procedure: 'doSomething',
            input_id: input.id,
          },
        });
        throw error;
      }
    }),
});
```

## 🔧 高级配置

### 1. 源码映射

在 `next.config.js` 中：

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // 你的配置
};

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry Webpack 插件选项
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // Sentry SDK 选项
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

### 2. 自定义错误边界

```typescript
// components/error-boundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 3. 性能监控

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

export function monitorPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    op: 'function',
    name,
  });

  return fn()
    .then((result) => {
      transaction.setStatus('ok');
      return result;
    })
    .catch((error) => {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}

// 使用
const result = await monitorPerformance('executeTask', async () => {
  return await executeTask(taskId);
});
```

## 📊 监控指标

### 关键指标

1. **错误率**: 错误数 / 总请求数
2. **响应时间**: P50, P95, P99
3. **可用性**: 正常运行时间百分比
4. **用户影响**: 受影响的用户数

### 告警配置

在 Sentry Dashboard 中配置告警：

1. 错误率超过 1%
2. 响应时间 P95 超过 1000ms
3. 新错误出现
4. 错误频率突增

## 🎯 最佳实践

### 1. 错误分组

使用 `fingerprint` 自定义错误分组：

```typescript
Sentry.captureException(error, {
  fingerprint: ['database', 'connection', 'timeout'],
});
```

### 2. 采样率

生产环境使用较低的采样率以节省配额：

```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
```

### 3. 过滤敏感信息

```typescript
beforeSend(event) {
  // 移除敏感数据
  if (event.request?.data) {
    delete event.request.data.password;
    delete event.request.data.token;
  }
  return event;
}
```

### 4. 添加上下文

```typescript
// 在关键操作前添加上下文
Sentry.setContext('operation', {
  type: 'agent_execution',
  agentId: agent.id,
  taskId: task.id,
  priority: task.priority,
});
```

## 💰 成本估算

### Sentry 定价

- **Developer**: $0/月 (5,000 events)
- **Team**: $26/月 (50,000 events)
- **Business**: $80/月 (100,000 events)

### 优化建议

1. 使用采样率降低事件数量
2. 过滤不重要的错误
3. 使用 `beforeSend` 过滤重复错误
4. 定期清理旧数据

## 🔍 故障排查

### 问题: Sentry 未捕获错误

**解决方案**:
1. 检查 DSN 配置
2. 确认 Sentry 已初始化
3. 检查网络连接
4. 查看浏览器控制台

### 问题: 源码映射不工作

**解决方案**:
1. 确认 `SENTRY_AUTH_TOKEN` 已配置
2. 检查 `next.config.js` 配置
3. 运行 `pnpm build` 确认上传

### 问题: 性能数据缺失

**解决方案**:
1. 确认 `tracesSampleRate` > 0
2. 检查是否启用了性能监控
3. 确认事务正确创建和完成

## 📚 参考资源

- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry 性能监控](https://docs.sentry.io/product/performance/)
- [Sentry 最佳实践](https://docs.sentry.io/platforms/javascript/best-practices/)

---

**更新日期**: 2026-02-13
**状态**: ✅ 配置就绪
