# 生产环境配置指南

> 本文档提供 AI Company Builder 生产环境部署的完整配置指南

---

## 📋 环境变量配置

### 必需环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 数据库
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>

# AI API
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_BASE_URL=https://api.deepseek.com

# Cron Secret（用于保护心跳 API）
CRON_SECRET=your-random-secret-here

# Node 环境
NODE_ENV=production
```

### 可选环境变量

```bash
# Anthropic API（可选）
ANTHROPIC_API_KEY=your-anthropic-api-key

# 日志级别
LOG_LEVEL=info

# 监控配置
ENABLE_MONITORING=true
SENTRY_DSN=your-sentry-dsn

# 性能优化
ENABLE_CACHE=true
CACHE_TTL=300
```

---

## 🔒 安全配置

### 1. 环境变量安全

```bash
# 生成安全的 CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用环境变量管理工具
# - Vercel: 在项目设置中配置
# - Docker: 使用 .env 文件或 secrets
# - 自托管: 使用系统环境变量
```

### 2. 数据库安全

```sql
-- 启用 Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can only access their own companies"
  ON companies FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can only access agents in their companies"
  ON agents FOR ALL
  USING (company_id IN (
    SELECT id FROM companies WHERE user_id = auth.uid()
  ));
```

### 3. API 安全

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 验证用户身份
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 保护 API 路由
  if (req.nextUrl.pathname.startsWith('/api/') && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 验证 Cron Secret
  if (req.nextUrl.pathname.startsWith('/api/cron/')) {
    const secret = req.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

### 4. CORS 配置

```typescript
// app/api/[...]/route.ts
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

---

## 🚀 部署配置

### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_BASE_URL=${OPENAI_BASE_URL}
      - CRON_SECRET=${CRON_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Vercel 部署

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "DATABASE_URL": "@database-url",
    "OPENAI_API_KEY": "@openai-api-key",
    "OPENAI_BASE_URL": "@openai-base-url",
    "CRON_SECRET": "@cron-secret"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 📊 监控配置

### 1. 健康检查端点

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 检查数据库连接
    const supabase = createClient();
    const { error } = await supabase.from('companies').select('count').limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        api: 'up',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

### 2. 日志配置

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'info', message, meta, timestamp: new Date() }));
    } else {
      console.log(`[INFO] ${message}`, meta);
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify({ level: 'error', message, error, timestamp: new Date() }));
    } else {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  warn: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify({ level: 'warn', message, meta, timestamp: new Date() }));
    } else {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
};
```

---

## 🔧 性能优化

### 1. 缓存策略

```typescript
// next.config.ts
const nextConfig = {
  // 启用 SWC 压缩
  swcMinify: true,

  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // 启用 gzip 压缩
  compress: true,

  // 缓存配置
  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|webp|avif)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### 2. 数据库连接池

```typescript
// lib/db/pool.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## 📝 备份策略

### 1. 数据库备份

```bash
# 每日自动备份
0 2 * * * pg_dump $DATABASE_URL > /backups/db_$(date +\%Y\%m\%d).sql

# 保留最近 30 天的备份
find /backups -name "db_*.sql" -mtime +30 -delete
```

### 2. 文件备份

```bash
# 备份上传的文件
0 3 * * * rsync -av /app/uploads /backups/uploads_$(date +\%Y\%m\%d)
```

---

## 🚨 故障恢复

### 1. 数据库恢复

```bash
# 从备份恢复
psql $DATABASE_URL < /backups/db_20260214.sql
```

### 2. 应用回滚

```bash
# Docker 回滚到上一个版本
docker-compose down
docker-compose up -d --build

# Vercel 回滚
vercel rollback
```

---

## 📈 扩展配置

### 水平扩展

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  app:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

### 负载均衡

```nginx
# nginx.conf
upstream app {
    least_conn;
    server app:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## ✅ 部署检查清单

- [ ] 环境变量已正确配置
- [ ] 数据库 RLS 策略已启用
- [ ] API 安全中间件已配置
- [ ] CORS 策略已设置
- [ ] 健康检查端点正常工作
- [ ] 日志系统已配置
- [ ] 监控系统已启用
- [ ] 备份策略已实施
- [ ] SSL 证书已配置
- [ ] 性能优化已应用
- [ ] 错误追踪已启用
- [ ] 负载测试已完成

---

**生产环境配置完成后，请进行充分的测试再正式上线！** 🚀
