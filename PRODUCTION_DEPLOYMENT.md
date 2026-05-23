# 生产环境部署检查清单

本文档提供了将 AI Company Builder 部署到生产环境的完整检查清单和最佳实践。

## 📋 部署前检查清单

### 1. 环境变量配置

#### 必需的环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>

# AI APIs
ANTHROPIC_API_KEY=<anthropic-api-key>
OPENAI_API_KEY=<openai-api-key>

# Cron Secret (for heartbeat)
CRON_SECRET=your_random_secret_here

# Node Environment
NODE_ENV=production
```

#### 可选的环境变量

```bash
# Twitter API (如果使用真实集成)
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_BEARER_TOKEN=your_bearer_token

# Sentry (错误追踪)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=your_auth_token

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### 2. 数据库迁移

- [ ] 在 Supabase 中执行所有迁移脚本
  - [ ] `drizzle/0000_open_greymalkin.sql` - 初始 schema
  - [ ] `drizzle/0001_add_profile_trigger.sql` - Profile 触发器
  - [ ] `drizzle/0002_fix_agent_role_names.sql` - Agent 角色名修复
  - [ ] `supabase/migrations/001_setup_heartbeat_cron.sql` - 心跳 Cron
  - [ ] `supabase/migrations/002_setup_http_extension.sql` - HTTP 扩展
  - [ ] `supabase/migrations/003_enable_pgvector.sql` - pgvector 扩展

- [ ] 验证所有表已创建
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
  ```

- [ ] 验证所有扩展已启用
  ```sql
  SELECT * FROM pg_extension
  WHERE extname IN ('vector', 'pg_cron', 'pg_net');
  ```

### 3. 安全配置

#### Supabase 安全

- [ ] 启用 Row Level Security (RLS)
  ```sql
  -- Enable RLS on all tables
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
  ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
  ```

- [ ] 创建 RLS 策略
  ```sql
  -- Example: Users can only see their own companies
  CREATE POLICY "Users can view own companies"
    ON companies FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own companies"
    ON companies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own companies"
    ON companies FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own companies"
    ON companies FOR DELETE
    USING (auth.uid() = user_id);
  ```

- [ ] 配置 API Keys 权限
  - 使用 `service_role` key 仅在服务器端
  - 使用 `anon` key 在客户端
  - 永远不要在客户端暴露 `service_role` key

#### API 安全

- [ ] 保护 Cron 端点
  ```typescript
  // app/api/cron/heartbeat/route.ts
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  ```

- [ ] 实现 Rate Limiting
  - 使用 Vercel Edge Config 或 Upstash Redis
  - 限制 API 调用频率
  - 防止 DDoS 攻击

- [ ] CORS 配置
  ```typescript
  // next.config.ts
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ];
  }
  ```

### 4. 性能优化

#### Next.js 优化

- [ ] 启用生产构建优化
  ```typescript
  // next.config.ts
  const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
  };
  ```

- [ ] 配置图片优化
  ```typescript
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  }
  ```

- [ ] 启用 ISR (Incremental Static Regeneration)
  ```typescript
  export const revalidate = 3600; // 1 hour
  ```

#### 数据库优化

- [ ] 创建必要的索引
  ```sql
  -- Companies
  CREATE INDEX idx_companies_user_id ON companies(user_id);
  CREATE INDEX idx_companies_status ON companies(status);

  -- Agents
  CREATE INDEX idx_agents_company_id ON agents(company_id);
  CREATE INDEX idx_agents_status ON agents(status);

  -- Tasks
  CREATE INDEX idx_tasks_company_id ON tasks(company_id);
  CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
  CREATE INDEX idx_tasks_status ON tasks(status);
  CREATE INDEX idx_tasks_priority ON tasks(priority);

  -- Memories (pgvector)
  CREATE INDEX idx_memories_company_id ON memories(company_id);
  CREATE INDEX idx_memories_type ON memories(type);
  ```

- [ ] 配置连接池
  ```typescript
  // lib/db/index.ts
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  ```

### 5. 监控和日志

#### Sentry 集成

- [ ] 安装 Sentry
  ```bash
  pnpm add @sentry/nextjs
  ```

- [ ] 配置 Sentry
  ```typescript
  // sentry.client.config.ts
  import * as Sentry from '@sentry/nextjs';

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
  ```

#### 日志系统

- [ ] 配置结构化日志
  ```typescript
  // lib/logger.ts
  export const logger = {
    info: (message: string, meta?: any) => {
      console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date() }));
    },
    error: (message: string, error?: Error, meta?: any) => {
      console.error(JSON.stringify({ level: 'error', message, error: error?.message, stack: error?.stack, ...meta, timestamp: new Date() }));
    },
  };
  ```

#### 性能监控

- [ ] 启用 Vercel Analytics
  ```typescript
  // app/layout.tsx
  import { Analytics } from '@vercel/analytics/react';

  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    );
  }
  ```

### 6. 备份和恢复

- [ ] 配置 Supabase 自动备份
  - 在 Supabase Dashboard 中启用每日备份
  - 保留至少 7 天的备份

- [ ] 测试恢复流程
  ```bash
  # 导出数据库
  pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

  # 恢复数据库
  psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql
  ```

### 7. 测试

- [ ] 端到端测试
  - [ ] 用户注册和登录
  - [ ] 创建公司
  - [ ] Agent 执行任务
  - [ ] 心跳机制
  - [ ] 成本统计

- [ ] 负载测试
  ```bash
  # 使用 k6 进行负载测试
  k6 run load-test.js
  ```

- [ ] 安全测试
  - [ ] SQL 注入测试
  - [ ] XSS 测试
  - [ ] CSRF 测试
  - [ ] 认证绕过测试

### 8. 文档

- [ ] 更新 README.md
- [ ] 创建 API 文档
- [ ] 创建用户手册
- [ ] 创建运维手册

## 🚀 部署步骤

### Vercel 部署

1. **连接 GitHub 仓库**
   ```bash
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 https://vercel.com/new
   - 选择 GitHub 仓库
   - 配置环境变量

3. **配置域名**
   - 添加自定义域名
   - 配置 DNS 记录

4. **部署**
   - Vercel 会自动构建和部署
   - 验证部署成功

### 自托管部署

1. **准备服务器**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y

   # 安装 Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # 安装 pnpm
   npm install -g pnpm

   # 安装 Docker (如果需要 OpenClaw)
   curl -fsSL https://get.docker.com | sh
   ```

2. **克隆代码**
   ```bash
   git clone https://github.com/your-username/ai-company-builder.git
   cd ai-company-builder
   ```

3. **安装依赖**
   ```bash
   pnpm install
   ```

4. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 填写所有必需的环境变量
   ```

5. **构建项目**
   ```bash
   pnpm build
   ```

6. **启动服务**
   ```bash
   # 使用 PM2 管理进程
   npm install -g pm2
   pm2 start npm --name "ai-company" -- start
   pm2 save
   pm2 startup
   ```

7. **配置 Nginx**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **配置 SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## 🔍 部署后验证

- [ ] 访问应用 URL
- [ ] 测试用户注册和登录
- [ ] 创建测试公司
- [ ] 执行测试任务
- [ ] 检查心跳机制
- [ ] 验证成本统计
- [ ] 检查错误日志
- [ ] 验证性能指标

## 📊 监控指标

### 应用指标
- 响应时间 (< 200ms)
- 错误率 (< 1%)
- 可用性 (> 99.9%)

### 数据库指标
- 查询时间 (< 100ms)
- 连接数 (< 80% of max)
- 磁盘使用率 (< 80%)

### AI API 指标
- API 调用次数
- 成本统计
- 错误率

## 🆘 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 是否正确
   - 验证 Supabase 项目是否活跃
   - 检查网络连接

2. **认证失败**
   - 验证 Supabase Auth 配置
   - 检查 JWT 密钥
   - 清除浏览器缓存

3. **心跳不执行**
   - 验证 pg_cron 扩展已启用
   - 检查 CRON_SECRET 配置
   - 查看 Supabase 日志

4. **性能问题**
   - 检查数据库索引
   - 优化查询
   - 增加服务器资源

## 📚 参考资源

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Vercel 部署指南](https://vercel.com/docs)
- [Supabase 生产最佳实践](https://supabase.com/docs/guides/platform/going-into-prod)
- [Sentry Next.js 集成](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

**更新日期**: 2026-02-13
**版本**: v1.0.0
**状态**: ✅ 准备就绪
