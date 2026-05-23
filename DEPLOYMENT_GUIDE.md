# AI Company Builder - 部署指南

本指南将帮助你将 AI Company Builder 部署到生产环境。

## 📋 目录

- [系统要求](#系统要求)
- [环境变量配置](#环境变量配置)
- [本地开发部署](#本地开发部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [数据库迁移](#数据库迁移)
- [故障排查](#故障排查)

---

## 💻 系统要求

### 最低配置
- **Node.js**: 20.x 或更高版本
- **pnpm**: 8.x 或更高版本
- **PostgreSQL**: 14.x 或更高版本
- **内存**: 2GB RAM
- **存储**: 10GB 可用空间

### 推荐配置
- **Node.js**: 20.x LTS
- **pnpm**: 最新版本
- **PostgreSQL**: 15.x 或更高版本
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间

---

## 🔐 环境变量配置

### 1. 创建环境变量文件

复制示例文件：
```bash
cp .env.example .env.local
```

### 2. 配置必需的环境变量

#### Supabase 配置
```env
# Supabase URL 和 Key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# 数据库连接字符串
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
```

**获取方式**:
1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 Settings > API
4. 复制 URL 和 anon/public key
5. 进入 Settings > Database
6. 复制 Connection String (使用 Transaction 模式)

#### AI API 配置
```env
# DeepSeek API (推荐 - 成本最低)
OPENAI_API_KEY=<deepseek-api-key>
OPENAI_BASE_URL=https://api.deepseek.com

# 或者使用 Anthropic Claude (可选)
# ANTHROPIC_API_KEY=<anthropic-api-key>
```

**获取 DeepSeek API Key**:
1. 访问 [DeepSeek Platform](https://platform.deepseek.com)
2. 注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key

### 3. 可选环境变量

```env
# Next.js 配置
NODE_ENV=production
PORT=3000

# 日志级别
LOG_LEVEL=info

# 调度器配置
SCHEDULER_INTERVAL=5000  # 5秒
```

---

## 🚀 本地开发部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai-company-builder.git
cd ai-company-builder
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

按照上面的说明配置 `.env.local` 文件。

### 4. 运行数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移（方法1：使用 drizzle-kit）
pnpm drizzle-kit push

# 或者方法2：在 Supabase Dashboard 中手动执行
# 1. 访问 https://app.supabase.com/project/your-project/sql/new
# 2. 复制 drizzle/0000_*.sql 的内容
# 3. 粘贴并执行
```

### 5. 运行种子数据（可选）

```bash
npx tsx lib/db/seed.ts
```

### 6. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

---

## 🌐 生产环境部署

### 方案 1: Vercel 部署（推荐）

#### 1. 准备工作

确保你的代码已推送到 GitHub。

#### 2. 导入项目到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置项目：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `pnpm run build`
   - Output Directory: .next

#### 3. 配置环境变量

在 Vercel 项目设置中添加所有环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`

#### 4. 部署

点击 "Deploy" 按钮，Vercel 会自动构建和部署。

#### 5. 配置自定义域名（可选）

在 Vercel 项目设置中添加自定义域名。

### 方案 2: 自托管部署

#### 1. 构建项目

```bash
pnpm run build
```

#### 2. 启动生产服务器

```bash
pnpm start
```

#### 3. 使用 PM2 管理进程

安装 PM2:
```bash
npm install -g pm2
```

创建 PM2 配置文件 `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'ai-company-builder',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

启动应用:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. 配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/ai-company-builder`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

启用配置:
```bash
sudo ln -s /etc/nginx/sites-available/ai-company-builder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. 配置 SSL（使用 Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🐳 Docker 部署

### 1. 构建 Docker 镜像

```bash
docker build -t ai-company-builder .
```

### 2. 运行容器

```bash
docker run -d \
  --name ai-company-builder \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-key \
  -e DATABASE_URL=your-database-url \
  -e OPENAI_API_KEY=your-api-key \
  -e OPENAI_BASE_URL=https://api.deepseek.com \
  ai-company-builder
```

### 3. 使用 Docker Compose

创建 `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_BASE_URL=${OPENAI_BASE_URL}
    restart: unless-stopped
```

启动:
```bash
docker-compose up -d
```

---

## 🗄️ 数据库迁移

### 自动迁移（推荐）

使用 Drizzle Kit:
```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit push
```

### 手动迁移

1. 访问 Supabase Dashboard
2. 进入 SQL Editor
3. 执行迁移文件：
   - `drizzle/0000_open_greymalkin.sql` - 初始 schema
   - `drizzle/0001_add_profile_trigger.sql` - Profile 触发器
   - `drizzle/0002_fix_agent_role_names.sql` - 修复角色名称

### 验证迁移

```bash
# 检查数据库表
pnpm drizzle-kit studio
```

访问 https://local.drizzle.studio 查看数据库结构。

---

## 🔧 故障排查

### 问题 1: 构建失败

**错误**: `Type error: ...`

**解决方案**:
```bash
# 清理缓存
rm -rf .next node_modules
pnpm install
pnpm run build
```

### 问题 2: 数据库连接失败

**错误**: `Error: connect ETIMEDOUT`

**解决方案**:
1. 检查 `DATABASE_URL` 是否正确
2. 确保使用 Transaction 模式的连接字符串
3. 检查网络连接
4. 在 Supabase Dashboard 中检查数据库状态

### 问题 3: API Key 无效

**错误**: `Error: Invalid API key`

**解决方案**:
1. 检查 `OPENAI_API_KEY` 是否正确
2. 确保 API Key 有足够的额度
3. 检查 `OPENAI_BASE_URL` 是否正确设置

### 问题 4: 调度器不工作

**症状**: 任务一直是 PENDING 状态

**解决方案**:
1. 检查调度器是否启动
2. 查看服务器日志
3. 确保有可用的 Agent
4. 检查任务优先级设置

### 问题 5: 内存不足

**错误**: `JavaScript heap out of memory`

**解决方案**:
```bash
# 增加 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

或在 `package.json` 中修改:
```json
{
  "scripts": {
    "start": "NODE_OPTIONS='--max-old-space-size=4096' next start"
  }
}
```

---

## 📊 性能优化

### 1. 启用缓存

在 `next.config.ts` 中配置:
```typescript
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  compress: true,
}
```

### 2. 优化图片

使用 Next.js Image 组件:
```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

### 3. 代码分割

使用动态导入:
```tsx
import dynamic from 'next/dynamic'

const DynamicComponent = dynamic(() => import('./Component'), {
  loading: () => <p>Loading...</p>,
})
```

### 4. 数据库连接池

在生产环境中配置连接池:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!, {
  max: 10, // 最大连接数
  idle_timeout: 20,
  connect_timeout: 10,
})
```

---

## 🔒 安全建议

### 1. 环境变量

- ❌ 不要将 `.env.local` 提交到 Git
- ✅ 使用环境变量管理敏感信息
- ✅ 在生产环境中使用密钥管理服务

### 2. API 安全

- ✅ 使用 HTTPS
- ✅ 实现速率限制
- ✅ 验证所有输入
- ✅ 使用 CORS 限制

### 3. 数据库安全

- ✅ 使用 Row Level Security (RLS)
- ✅ 定期备份数据库
- ✅ 使用强密码
- ✅ 限制数据库访问

### 4. 认证安全

- ✅ 使用 Supabase Auth
- ✅ 启用 MFA（多因素认证）
- ✅ 实现会话管理
- ✅ 定期更新依赖

---

## 📈 监控和日志

### 1. 应用监控

推荐使用:
- **Vercel Analytics** - 如果部署在 Vercel
- **Sentry** - 错误追踪
- **LogRocket** - 用户会话重放

### 2. 数据库监控

在 Supabase Dashboard 中查看:
- 查询性能
- 连接数
- 存储使用量

### 3. 成本监控

定期查看:
- AI API 使用量（Costs 页面）
- 数据库存储
- 带宽使用

---

## 🔄 更新和维护

### 1. 更新依赖

```bash
# 检查过时的包
pnpm outdated

# 更新所有依赖
pnpm update

# 更新特定包
pnpm update next react react-dom
```

### 2. 数据库备份

```bash
# 使用 Supabase CLI
supabase db dump -f backup.sql

# 或使用 pg_dump
pg_dump $DATABASE_URL > backup.sql
```

### 3. 回滚部署

在 Vercel:
1. 进入 Deployments 页面
2. 选择之前的部署
3. 点击 "Promote to Production"

使用 PM2:
```bash
pm2 reload ai-company-builder
```

---

## 📞 获取帮助

如果遇到部署问题:

1. 查看本文档的故障排查部分
2. 检查 [GitHub Issues](https://github.com/your-repo/issues)
3. 查看 [Supabase 文档](https://supabase.com/docs)
4. 查看 [Next.js 文档](https://nextjs.org/docs)

---

## ✅ 部署检查清单

部署前确保:

- [ ] 所有环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 构建测试通过
- [ ] API Keys 有效且有额度
- [ ] SSL 证书已配置（生产环境）
- [ ] 备份策略已设置
- [ ] 监控已配置
- [ ] 文档已更新

---

## 🎉 部署完成

恭喜！你的 AI Company Builder 已成功部署。

访问你的域名开始使用吧！
