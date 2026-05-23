# Vercel 部署指南

> 使用 Vercel 部署 AI Company Builder，享受零配置、自动 HTTPS、全球 CDN 等优势

---

## 目录

1. [为什么选择 Vercel](#为什么选择-vercel)
2. [前置准备](#前置准备)
3. [快速部署](#快速部署)
4. [环境变量配置](#环境变量配置)
5. [自定义域名](#自定义域名)
6. [性能优化](#性能优化)
7. [监控与日志](#监控与日志)
8. [常见问题](#常见问题)

---

## 为什么选择 Vercel

### 核心优势

| 特性 | Vercel | 自托管 | 说明 |
|------|--------|--------|------|
| **部署速度** | ⚡ 秒级 | 🐌 分钟级 | Git push 自动部署 |
| **全球 CDN** | ✅ 内置 | ❌ 需配置 | 自动边缘缓存 |
| **HTTPS** | ✅ 自动 | ❌ 需配置 | 免费 SSL 证书 |
| **预览环境** | ✅ 每个 PR | ❌ 无 | 自动预览部署 |
| **回滚** | ✅ 一键 | ❌ 手动 | 即时回滚到任意版本 |
| **成本** | $0-20/月 | $5-10/月 | Hobby 免费，Pro $20/月 |

### 适用场景

✅ **推荐使用 Vercel**：
- 个人项目和 MVP
- 需要快速迭代
- 团队协作开发
- 需要全球访问加速
- 不需要 Docker 容器（OpenClaw）

❌ **不推荐使用 Vercel**：
- 需要运行 Docker 容器（OpenClaw 沙盒）
- 需要长时间运行的后台任务
- 需要完全控制服务器

> **注意**：Vercel 不支持 Docker，如果您的 AI 公司需要使用 OpenClaw 容器运行时，请使用自托管部署方案。

---

## 前置准备

### 1. 账号准备

- **GitHub 账号**：用于代码托管
- **Vercel 账号**：访问 [vercel.com](https://vercel.com) 注册（可用 GitHub 登录）
- **Supabase 账号**：访问 [supabase.com](https://supabase.com) 注册

### 2. Supabase 项目设置

#### 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: ai-company-builder
   - **Database Password**: 生成强密码（保存好）
   - **Region**: 选择离用户最近的区域
4. 等待项目创建完成（约 2 分钟）

#### 执行数据库 Schema

1. 在 Supabase Dashboard，进入 "SQL Editor"
2. 复制 `database-schema.md` 中的 SQL 脚本
3. 执行以下脚本：

```sql
-- 1. 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 创建表（从 database-schema.md 复制完整 SQL）
-- profiles, companies, agents, discussions, messages,
-- memories, tasks, heartbeats, financial_records

-- 3. 配置 RLS（Row Level Security）
-- 从 database-schema.md 复制 RLS 策略

-- 4. 启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

#### 获取 API Keys

在 Supabase Dashboard → Settings → API：

- `NEXT_PUBLIC_SUPABASE_URL`: 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key（保密）
- `DATABASE_URL`: 在 Settings → Database → Connection string → URI

---

## 快速部署

### 方法 1: 一键部署（推荐）

点击下方按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-company-builder)

### 方法 2: 从 GitHub 部署

#### 步骤 1: 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/your-username/ai-company-builder.git

# 提交代码
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 步骤 2: 连接 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 选择您的 GitHub 仓库
5. 点击 "Import"

#### 步骤 3: 配置项目

Vercel 会自动检测 Next.js 项目，使用以下配置：

- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

#### 步骤 4: 配置环境变量

在 Vercel 项目设置中添加环境变量（见下一节）。

#### 步骤 5: 部署

点击 "Deploy" 按钮，等待部署完成（约 2-3 分钟）。

---

## 环境变量配置

### 在 Vercel Dashboard 配置

进入项目 → Settings → Environment Variables，添加以下变量：

#### 必需的环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Database (Drizzle ORM)
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app

# AI API Keys
OPENAI_API_KEY=<openai-api-key>
ANTHROPIC_API_KEY=<anthropic-api-key>
```

#### 可选的环境变量

```bash
# GitHub 集成（用于 AI Agent 推送代码）
GITHUB_TOKEN=<github-token>

# Vercel Token（用于 AI Agent 自动部署）
VERCEL_TOKEN=...

# Sentry（错误追踪）
SENTRY_DSN=https://...

# 分析工具
NEXT_PUBLIC_GA_ID=G-...
```

### 生成 NEXTAUTH_SECRET

```bash
# 在本地终端运行
openssl rand -base64 32
```

### 环境变量作用域

- **Production**: 生产环境（main 分支）
- **Preview**: 预览环境（PR 和其他分支）
- **Development**: 本地开发

建议为所有环境添加相同的变量。

---

## 自定义域名

### 添加自定义域名

1. 进入 Vercel 项目 → Settings → Domains
2. 输入您的域名（如 `aicompany.com`）
3. 点击 "Add"

### 配置 DNS

Vercel 会提供 DNS 配置说明，通常需要添加：

#### 方法 1: A 记录（推荐）

```
Type: A
Name: @
Value: 76.76.21.21
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 方法 2: CNAME 记录

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### 等待 DNS 生效

DNS 生效通常需要 5-30 分钟，Vercel 会自动配置 SSL 证书。

---

## 性能优化

### 1. 启用 Edge Functions

Vercel Edge Functions 在全球边缘节点运行，延迟更低。

```typescript
// app/api/hello/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  return new Response('Hello from Edge!');
}
```

### 2. 图片优化

使用 Next.js Image 组件自动优化图片：

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // 首屏图片
/>
```

### 3. 静态生成（SSG）

对于不常变化的页面，使用静态生成：

```typescript
// app/about/page.tsx
export const revalidate = 3600; // 每小时重新生成

export default function AboutPage() {
  return <div>About Us</div>;
}
```

### 4. 增量静态再生成（ISR）

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 60; // 每 60 秒重新生成

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

### 5. 启用 Gzip/Brotli 压缩

Vercel 自动启用，无需配置。

---

## 监控与日志

### 1. Vercel Analytics

免费的 Web Analytics：

```bash
pnpm install @vercel/analytics
```

```tsx
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

### 2. Vercel Speed Insights

性能监控：

```bash
pnpm install @vercel/speed-insights
```

```tsx
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 3. 查看部署日志

1. 进入 Vercel Dashboard → 项目 → Deployments
2. 点击任意部署
3. 查看 "Build Logs" 和 "Function Logs"

### 4. 实时日志

```bash
# 安装 Vercel CLI
pnpm install -g vercel

# 登录
vercel login

# 查看实时日志
vercel logs --follow
```

---

## 常见问题

### 1. 构建失败

**问题**: Build failed with error

**解决方案**:

```bash
# 检查构建日志
# 常见原因：
# 1. 环境变量缺失
# 2. TypeScript 类型错误
# 3. 依赖安装失败

# 本地测试构建
pnpm run build

# 检查 TypeScript
pnpm run type-check
```

### 2. 环境变量不生效

**问题**: 环境变量在运行时为 undefined

**解决方案**:

- 确保变量名以 `NEXT_PUBLIC_` 开头（客户端变量）
- 重新部署项目（环境变量更改后需要重新部署）
- 检查变量作用域（Production/Preview/Development）

### 3. 数据库连接失败

**问题**: Database connection timeout

**解决方案**:

```bash
# 检查 DATABASE_URL 格式
postgresql://<user>:<password>@<host>:5432/<database>

# 测试连接
psql "$DATABASE_URL" -c "SELECT 1"

# 检查 Supabase 项目状态
# Dashboard → Settings → Database
```

### 4. API 路由超时

**问题**: Function execution timed out

**解决方案**:

Vercel Hobby 计划限制：
- Serverless Functions: 10 秒超时
- Edge Functions: 30 秒超时

升级到 Pro 计划可获得 60 秒超时。

或优化代码：

```typescript
// 使用 Edge Runtime
export const runtime = 'edge';
export const maxDuration = 30; // 最长 30 秒
```

### 5. 部署预览环境

**问题**: 如何为 PR 创建预览环境？

**解决方案**:

Vercel 自动为每个 PR 创建预览部署：

1. 创建新分支
2. 推送代码
3. 创建 Pull Request
4. Vercel 自动部署预览环境
5. 在 PR 中查看预览链接

### 6. 回滚到之前的版本

**问题**: 新版本有 bug，需要回滚

**解决方案**:

1. 进入 Vercel Dashboard → Deployments
2. 找到稳定的版本
3. 点击 "..." → "Promote to Production"
4. 确认回滚

---

## 成本估算

### Vercel 定价

| 计划 | 价格 | 适用场景 |
|------|------|---------|
| **Hobby** | $0/月 | 个人项目 |
| **Pro** | $20/月 | 专业项目 |
| **Enterprise** | 定制 | 企业级 |

### Hobby 计划限制

- ✅ 无限部署
- ✅ 100GB 带宽/月
- ✅ 6,000 分钟构建时间/月
- ✅ Serverless Functions: 10 秒超时
- ❌ 无团队协作
- ❌ 无高级分析

### Pro 计划优势

- ✅ 1TB 带宽/月
- ✅ 24,000 分钟构建时间/月
- ✅ Serverless Functions: 60 秒超时
- ✅ 团队协作
- ✅ 高级分析
- ✅ 密码保护

### 总成本估算

```
AI Company Builder on Vercel:
├── Vercel Hobby: $0/月（或 Pro $20/月）
├── Supabase Free: $0/月
└── AI API: $6-18/月

总计: $6-38/月
```

---

## 最佳实践

### 1. 使用 Preview 环境测试

```bash
# 创建功能分支
git checkout -b feature/new-agent

# 开发并推送
git push origin feature/new-agent

# 创建 PR，Vercel 自动创建预览环境
# 在预览环境测试后再合并到 main
```

### 2. 配置 Vercel CLI

```bash
# 安装 CLI
pnpm install -g vercel

# 登录
vercel login

# 本地开发（使用 Vercel 环境变量）
vercel dev

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

### 3. 自动化部署

在 `.github/workflows/deploy.yml` 中配置 GitHub Actions：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 4. 监控性能

定期检查：
- Vercel Analytics: 页面访问量、用户行为
- Speed Insights: Core Web Vitals
- Function Logs: API 错误和性能

### 5. 安全最佳实践

- ✅ 使用环境变量存储敏感信息
- ✅ 启用 Vercel 的 DDoS 保护
- ✅ 配置 CORS 策略
- ✅ 使用 NextAuth 进行身份验证
- ✅ 启用 Supabase RLS（Row Level Security）

---

## 总结

### Vercel 部署优势

1. **零配置**: 自动检测 Next.js，无需配置
2. **快速部署**: Git push 后秒级部署
3. **全球 CDN**: 自动边缘缓存，访问速度快
4. **预览环境**: 每个 PR 自动创建预览
5. **一键回滚**: 出问题立即回滚
6. **免费 SSL**: 自动 HTTPS 证书

### 适用场景

✅ **推荐**：个人项目、MVP、快速迭代、全球访问
❌ **不推荐**：需要 Docker 容器、长时间后台任务

### 下一步

1. ✅ 创建 Supabase 项目
2. ✅ 执行数据库 Schema
3. ✅ 推送代码到 GitHub
4. ✅ 连接 Vercel
5. ✅ 配置环境变量
6. ✅ 部署并测试

---

**开始使用 Vercel 部署您的 AI Company Builder！** 🚀
