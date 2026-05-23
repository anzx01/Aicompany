# AI Company Builder - 部署指南（v0.2 自托管版）

> 本文档提供 AI Company Builder v0.2 的完整部署指南，支持 DigitalOcean、Vultr、本地服务器和 Docker Compose

---

## 目录

1. [部署概览](#部署概览)
2. [前置要求](#前置要求)
3. [快速开始](#快速开始)
4. [DigitalOcean 部署](#digitalocean-部署)
5. [Vultr 部署](#vultr-部署)
6. [本地服务器部署](#本地服务器部署)
7. [Docker Compose 配置](#docker-compose-配置)
8. [环境变量配置](#环境变量配置)
9. [SSL 证书配置](#ssl-证书配置)
10. [监控与日志](#监控与日志)
11. [备份与恢复](#备份与恢复)
12. [故障排查](#故障排查)

---

## 部署概览

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户浏览器                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  Nginx (反向代理)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js App (Docker 容器)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Next.js 14                                    │   │
│  │  - tRPC API                                      │   │
│  │  - Agent 系统                                     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Supabase │  │  Docker  │  │ External │
│ Database │  │ Sandbox  │  │ AI APIs  │
└──────────┘  └──────────┘  └──────────┘
```

### 部署选项

| 选项 | 成本 | 性能 | 难度 | 推荐场景 |
|------|------|------|------|---------|
| DigitalOcean Droplet | $6/月 | 中 | 低 | 个人项目 |
| Vultr VPS | $5/月 | 中 | 低 | 个人项目 |
| 本地服务器 (Mac Mini) | $0 | 高 | 中 | 开发测试 |
| Docker Compose | - | - | 低 | 所有场景 |

---

## 前置要求

### 系统要求

- **操作系统**: Ubuntu 22.04 LTS（推荐）或 macOS
- **CPU**: 1 核心（最低）/ 2 核心（推荐）
- **内存**: 2GB（最低）/ 4GB（推荐）
- **存储**: 20GB（最低）/ 40GB（推荐）
- **网络**: 公网 IP（如果需要外部访问）

### 软件要求

- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Node.js**: 20+ (本地开发)
- **Git**: 2.30+

### 账号要求

- **Supabase 账号**（免费）
- **OpenAI API Key** 或 **Anthropic API Key**
- **域名**（可选，用于 SSL）

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/ai-company-builder.git
cd ai-company-builder
```

### 2. 配置环境变量

```bash
cp .env.example .env
nano .env
```

填写必要的环境变量：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Database (Drizzle ORM)
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI API Keys
OPENAI_API_KEY="<openai-api-key>"
ANTHROPIC_API_KEY="<anthropic-api-key>"
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 访问应用

打开浏览器访问: `http://localhost:3000`

---

## DigitalOcean 部署

### 步骤 1: 创建 Droplet

1. 登录 [DigitalOcean](https://www.digitalocean.com/)
2. 点击 "Create" → "Droplets"
3. 选择配置:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/月)
   - **CPU**: 1 vCPU
   - **Memory**: 1GB
   - **Storage**: 25GB SSD
   - **Datacenter**: 选择离你最近的区域
4. 添加 SSH Key
5. 点击 "Create Droplet"

### 步骤 2: 连接到服务器

```bash
ssh root@your-droplet-ip
```

### 步骤 3: 安装 Docker

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

### 步骤 4: 克隆项目

```bash
# 安装 Git
apt install git -y

# 克隆项目
git clone https://github.com/your-username/ai-company-builder.git
cd ai-company-builder
```

### 步骤 5: 配置环境变量

```bash
cp .env.example .env
nano .env
```

更新以下变量：

```bash
NEXTAUTH_URL="http://your-droplet-ip:3000"
```

### 步骤 6: 启动服务

```bash
docker compose up -d
```

### 步骤 7: 配置防火墙

```bash
# 允许 HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp

# 启用防火墙
ufw enable
```

### 步骤 8: 访问应用

打开浏览器访问: `http://your-droplet-ip:3000`

---

## Vultr 部署

### 步骤 1: 创建 VPS

1. 登录 [Vultr](https://www.vultr.com/)
2. 点击 "Deploy New Server"
3. 选择配置:
   - **Server Type**: Cloud Compute
   - **Location**: 选择离你最近的区域
   - **Server Image**: Ubuntu 22.04 LTS
   - **Server Size**: $5/月 (1 vCPU, 1GB RAM, 25GB SSD)
4. 添加 SSH Key
5. 点击 "Deploy Now"

### 步骤 2-8: 与 DigitalOcean 相同

参考 [DigitalOcean 部署](#digitalocean-部署) 的步骤 2-8。

---

## 本地服务器部署

### 适用场景

- 开发测试
- 内网使用
- Mac Mini / NUC 等小型服务器

### macOS 部署

#### 1. 安装 Docker Desktop

```bash
# 使用 Homebrew 安装
brew install --cask docker

# 启动 Docker Desktop
open -a Docker
```

#### 2. 克隆项目

```bash
git clone https://github.com/your-username/ai-company-builder.git
cd ai-company-builder
```

#### 3. 配置环境变量

```bash
cp .env.example .env
nano .env
```

#### 4. 启动服务

```bash
docker compose up -d
```

#### 5. 访问应用

打开浏览器访问: `http://localhost:3000`

### Ubuntu 本地服务器部署

参考 [DigitalOcean 部署](#digitalocean-部署) 的步骤 2-8，但使用 `localhost` 或内网 IP。

---

## Docker Compose 配置

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Next.js 应用
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai-company-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - CONVEX_DEPLOYMENT=${CONVEX_DEPLOYMENT}
      - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./agent-configs:/app/agent-configs
      - /var/run/docker.sock:/var/run/docker.sock  # Docker 沙盒
    networks:
      - ai-company-network
    depends_on:
      - nginx

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: ai-company-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - ai-company-network

networks:
  ai-company-network:
    driver: bridge
```

### Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 复制必要文件
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### .dockerignore

```
node_modules
.next
.git
.env
.env.local
*.log
```

---

## 环境变量配置

### 完整的 .env 文件

```bash
# ============================================
# Supabase 数据库
# ============================================
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Database (Drizzle ORM)
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>"

# ============================================
# NextAuth 认证
# ============================================
NEXTAUTH_SECRET="your-secret-here"  # 使用 openssl rand -base64 32 生成
NEXTAUTH_URL="http://localhost:3000"  # 生产环境改为你的域名

# ============================================
# AI API Keys（用户提供）
# ============================================
OPENAI_API_KEY="<openai-api-key>"
ANTHROPIC_API_KEY="<anthropic-api-key>"

# ============================================
# 平台凭证（可选）
# ============================================
VERCEL_TOKEN="..."  # 用于自动部署
GITHUB_TOKEN="..."  # 用于 GitHub 集成
STRIPE_SECRET_KEY="sk_test_..."  # 用于支付集成

# ============================================
# Docker 配置
# ============================================
DOCKER_HOST="unix:///var/run/docker.sock"

# ============================================
# 监控（可选）
# ============================================
SENTRY_DSN="..."  # 错误追踪
```

### 生成 NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## SSL 证书配置

### 使用 Let's Encrypt（免费）

#### 1. 安装 Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

#### 2. 获取证书

```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 3. 自动续期

```bash
# 测试续期
certbot renew --dry-run

# 添加 cron 任务
crontab -e

# 添加以下行（每天凌晨 2 点检查续期）
0 2 * * * certbot renew --quiet
```

### Nginx SSL 配置

```nginx
# nginx/nginx.conf

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 反向代理到 Next.js
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 监控与日志

### 查看日志

```bash
# 查看所有容器日志
docker compose logs

# 查看特定容器日志
docker compose logs app

# 实时查看日志
docker compose logs -f app

# 查看最近 100 行日志
docker compose logs --tail=100 app
```

### 监控容器状态

```bash
# 查看运行中的容器
docker compose ps

# 查看容器资源使用
docker stats
```

### 设置日志轮转

```bash
# /etc/docker/daemon.json

{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

重启 Docker:

```bash
systemctl restart docker
```

### 使用 Sentry 监控错误

```bash
# 安装 Sentry SDK
npm install @sentry/nextjs

# 配置 Sentry
# sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## 备份与恢复

### 备份策略

#### 1. Supabase 数据备份

Supabase 提供自动备份功能（Pro 计划），免费计划可以手动导出数据：

```bash
# 使用 pg_dump 导出数据库
pg_dump "postgresql://<user>:<password>@<host>:5432/<database>" > backup.sql

# 或使用 Supabase CLI
supabase db dump -f backup.sql
```

#### 2. Agent 配置备份

```bash
# 备份 Agent 配置
tar -czf agent-configs-backup-$(date +%Y%m%d).tar.gz agent-configs/

# 上传到云存储（可选）
aws s3 cp agent-configs-backup-*.tar.gz s3://your-bucket/backups/
```

#### 3. 环境变量备份

```bash
# 备份 .env 文件（注意安全）
cp .env .env.backup
```

### 自动备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份 Agent 配置
tar -czf $BACKUP_DIR/agent-configs-$DATE.tar.gz agent-configs/

# 备份环境变量
cp .env $BACKUP_DIR/.env-$DATE

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

添加到 crontab:

```bash
# 每天凌晨 3 点备份
0 3 * * * /path/to/backup.sh
```

### 恢复

```bash
# 恢复 Agent 配置
tar -xzf agent-configs-backup-20260208.tar.gz

# 恢复环境变量
cp .env.backup .env

# 重启服务
docker compose restart
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 查看日志
docker compose logs app

# 检查端口占用
netstat -tulpn | grep 3000

# 重新构建镜像
docker compose build --no-cache
docker compose up -d
```

#### 2. Supabase 连接失败

```bash
# 检查环境变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $DATABASE_URL

# 测试网络连接
curl https://xxx.supabase.co/rest/v1/

# 测试数据库连接
psql "$DATABASE_URL" -c "SELECT 1"
```

#### 3. AI API 调用失败

```bash
# 检查 API Key
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# 测试 API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### 4. Docker 沙盒权限问题

```bash
# 检查 Docker socket 权限
ls -l /var/run/docker.sock

# 添加用户到 docker 组
usermod -aG docker $USER

# 重启 Docker
systemctl restart docker
```

#### 5. 内存不足

```bash
# 查看内存使用
free -h

# 增加 swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 性能优化

#### 1. 启用 Docker BuildKit

```bash
# ~/.bashrc
export DOCKER_BUILDKIT=1
```

#### 2. 优化 Next.js 构建

```javascript
// next.config.js

module.exports = {
  output: 'standalone',
  compress: true,
  swcMinify: true,
};
```

#### 3. 配置 Nginx 缓存

```nginx
# nginx/nginx.conf

# 缓存静态资源
location /_next/static {
    proxy_pass http://app:3000;
    proxy_cache_valid 200 60m;
    add_header Cache-Control "public, max-age=3600";
}
```

---

## 更新部署

### 更新应用

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker compose build

# 3. 重启服务
docker compose up -d

# 4. 查看日志
docker compose logs -f app
```

### 零停机更新

```bash
# 使用 Docker Compose 滚动更新
docker compose up -d --no-deps --build app
```

---

## 成本估算

### DigitalOcean

| 配置 | 月度成本 |
|------|---------|
| Basic Droplet (1GB RAM) | $6/月 |
| Basic Droplet (2GB RAM) | $12/月 |
| 域名（可选） | $12/年 |
| **总计** | **$6-12/月** |

### Vultr

| 配置 | 月度成本 |
|------|---------|
| Cloud Compute (1GB RAM) | $5/月 |
| Cloud Compute (2GB RAM) | $10/月 |
| 域名（可选） | $12/年 |
| **总计** | **$5-10/月** |

### 本地服务器

| 配置 | 一次性成本 | 月度成本 |
|------|-----------|---------|
| Mac Mini M2 | $599 | $0 |
| Intel NUC | $300-500 | $0 |
| 电费 | - | $2-5/月 |
| **总计** | **$300-599** | **$2-5/月** |

---

## 总结

### 部署选项对比

| 选项 | 优点 | 缺点 | 推荐场景 |
|------|------|------|---------|
| **DigitalOcean** | 简单、稳定、文档丰富 | 成本略高 | 生产环境 |
| **Vultr** | 便宜、性能好 | 文档较少 | 预算有限 |
| **本地服务器** | 完全控制、零月费 | 需要维护、无公网 IP | 开发测试 |
| **Docker Compose** | 统一部署、易于管理 | 需要 Docker 知识 | 所有场景 |

### 关键要点

1. **使用 Docker Compose 简化部署**
2. **配置 SSL 证书保证安全**
3. **定期备份 Agent 配置和环境变量**
4. **监控日志和资源使用**
5. **使用 Nginx 反向代理提升性能**

### 下一步

1. 选择部署平台
2. 配置域名和 SSL
3. 设置自动备份
4. 配置监控和告警
5. 优化性能

---

**v0.2 自托管版 - 完全控制、极低成本！** 🚀
