# AI Company Builder - 文档总览（v0.2 自托管版）

> 本项目的完整产品需求文档（PRD）和开发计划已完成
> **版本**: v0.2 自托管版
> 更新日期: 2026-02-14
> **状态**: ✅ 核心功能已完成（90%）
> **核心特性**: 4 种公司类型、AI 动态生成 Agent、Supabase 数据库、心跳机制、记忆系统、成本统计、极低成本

---

## 🎯 项目概览

### 产品定位

**AI 驱动的自动化公司生成平台**

支持用户创建 4 种类型的 AI 公司：

- 📢 **营销公司** - 自动化产品推广和营销
- ✍️ **内容公司** - 自动化内容创作和发布
- 💬 **客服公司** - 自动化客户支持
- 💻 **开发公司** - 自动化开发和部署

### 核心目标

让独立开发者、创作者、创业者能够创建 AI 公司，自动化执行营销、内容创作、客服、开发等业务，解放时间专注于核心产品。

### v0.2 核心变化（相比 v0.1）

#### 简化内容

1. **数据库**: PostgreSQL + Redis → **Supabase**（开源、实时、向量搜索）
2. **运行机制**: 持续运行 → **心跳机制**（每 6 小时唤醒）
3. **部署**: Vercel + Railway → **自托管**（DigitalOcean/Vultr）
4. **Agent 配置**: 固定角色 → **4 种公司类型 + AI 动态生成**
5. **公司数量**: 多公司 → **单公司**（v0.2 简化）

#### 新增功能

1. **多公司类型支持**: 营销、内容、客服、开发 4 种类型
2. **AI Agent 生成器**: 根据用户需求动态生成 Agent 配置
3. **统一平台集成**: 支持 20+ 平台的统一集成架构
4. **OpenClaw 运行时**: Docker 隔离的代码执行环境

#### 成本优化

- **Prompt Caching**: 节省 60-80% AI API 成本
- **模型分层**: 简单任务用 Haiku，复杂任务用 Sonnet/GPT-4
- **心跳机制**: 减少 83% 调用频率
- **Supabase 免费层**: 500MB 数据库 + 实时功能
- **月度成本**: $286-416 → **$6-18**（节省 94-97%）

#### 开发周期

- v0.1 Enhanced: 360-400 小时（9-10周）
- v0.2 自托管版: 240-280 小时（6-7周）
- **减少**: 120-160 小时（30-40%）

---

## 📚 文档列表

### 核心文档

#### 1. **prd.md** - 产品需求文档（v0.2）

**文件路径**: `prd.md`

**包含内容**:

- ✅ 产品背景与问题定义（4 种公司类型）
- ✅ 产品目标与边界
- ✅ 目标用户画像（独立开发者、创作者、创业者）
- ✅ 产品整体结构（7 大核心模块）
- ✅ 核心功能需求
  - 公司创建向导（多步骤，支持 4 种类型）
  - AI Agent 动态生成系统
  - 平台集成系统（20+ 平台）
  - Mission Control（类型特定指标）
  - 心跳机制
  - 公司记忆系统
- ✅ 技术架构（Convex + OpenClaw + 心跳机制）
- ✅ 数据模型（支持 4 种公司类型）
- ✅ 用户体验流程（类型选择 + 配置 + 平台连接）
- ✅ 成本估算（$14-68/月，按公司类型）
- ✅ 成功指标（类型特定指标）
- ✅ 风险与挑战（技术、业务、合规）
- ✅ 开发计划（6-7 周）
- ✅ 下一步行动

**总页数**: 约 1050 行

---

#### 2. **development-plan.md** - 6-7周开发计划（v0.2）

**文件路径**: `development-plan.md`

**包含内容**:

- ✅ 相关文档索引（9 个支持文档）
- ✅ v0.2 核心变化说明
- ✅ **第一阶段：基础设施（Week 1）** - 40小时
  - Next.js 项目搭建
  - Supabase 数据库集成（支持 4 种公司类型）
  - Supabase Auth 认证系统
  - Docker 环境配置
- ✅ **第二阶段：AI Agent 系统（Week 2-3）** - 80小时
  - LLM 集成与成本优化（Prompt Caching）
  - Agent 配置系统（4 种公司类型模板）
  - AI Agent 生成器
  - Agent 基础架构与编排
  - OpenClaw 运行时集成
  - 记忆系统
- ✅ **第三阶段：核心功能（Week 4-5）** - 80小时
  - 公司创建向导（支持 4 种类型）
  - 心跳机制实现
  - Mission Control 仪表板
  - 平台集成基础架构
  - P0 平台实现（营销公司）
  - 财务系统（简化版）
- ✅ **第四阶段：完善与部署（Week 6-7）** - 80小时
  - P0 平台实现（其他公司类型）
  - UI/UX 优化
  - 集成测试
  - 监控与日志
  - 自托管部署
  - 文档与发布
- ✅ 平台集成优先级（P0 平台列表）
- ✅ 关键里程碑
- ✅ 风险管理
- ✅ 成功标准
- ✅ 资源需求与预算（$6-18/月）
- ✅ 附录：关键架构决策（为什么选择 Convex、心跳机制等）
- ✅ 开发建议（每周重点）
- ✅ 常见问题

**总页数**: 约 780 行

---

#### 3. **tech-specs.md** - 技术架构文档（v0.2）

**文件路径**: `tech-specs.md`

**包含内容**:

- ✅ 项目结构（完整的文件夹组织）
- ✅ 技术栈（Convex + Clerk + OpenClaw）
- ✅ **AI Agent 实现**
  - Agent 配置系统（支持 4 种公司类型）
  - Agent 模板（营销、内容、客服、开发）
  - AI Agent 生成器实现
  - Agent 基类和工厂模式
  - Agent 编排引擎
- ✅ **OpenClaw 集成**
  - OpenClawService 实现
  - 代码执行、文件操作、Git 操作
- ✅ **API 设计**
  - tRPC Router 结构
  - Company Router（支持 4 种类型）
  - Agent Router
  - Task Router
  - Platform Router
  - 完整的 API 端点
- ✅ **前端架构**
  - Dashboard 页面
  - Mission Control 组件
  - 公司创建向导
  - 平台连接组件
- ✅ **成本优化**
  - Prompt Caching 实现
  - 模型分层路由
  - Token 计数与成本追踪
- ✅ **心跳机制**
  - Convex Cron Jobs
  - 心跳执行逻辑
- ✅ 安全与性能
- ✅ 环境变量配置

**总页数**: 约 2500 行

---

#### 4. **database-schema.md** - 数据库设计文档（v0.2）

**文件路径**: `database-schema.md`

**包含内容**:

- ✅ 完整的 Convex Schema
  - users（用户）
  - companies（公司 - 支持 4 种类型）
  - agents（AI Agent）
  - tasks（任务）
  - decisions（决策）
  - memories（记忆 + 向量搜索）
  - activities（活动记录）
  - costs（成本记录）
  - platformConnections（平台连接）
- ✅ 类型定义（TypeScript）
- ✅ 索引策略
- ✅ 向量搜索配置（Convex Vector Search）
- ✅ 数据迁移策略
- ✅ 性能优化建议

**总页数**: 约 500 行

---

#### 5. **platform-integrations-overview.md** - 平台集成架构（v0.2）

**文件路径**: `platform-integrations-overview.md`

**包含内容**:

- ✅ 平台分类（按公司类型）
  - 营销平台（Twitter, Product Hunt, LinkedIn, Reddit, Stripe）
  - 内容平台（Medium, YouTube, Ghost, Substack, WordPress）
  - 客服平台（Zendesk, Intercom, Freshdesk, Help Scout, Slack）
  - 开发平台（GitHub, GitLab, Vercel, Railway, Sentry）
- ✅ 统一 Platform 接口设计
- ✅ PlatformRegistry（Factory Pattern）
- ✅ OAuth 流程实现
- ✅ Webhook 处理
- ✅ 错误处理策略（RetryStrategy, RateLimiter）
- ✅ 健康监控（HealthMonitor）
- ✅ Twitter Platform 完整实现示例
- ✅ 成本分析（MVP $100/月, Full P0 $217/月）
- ✅ 实现优先级（P0, P1, P2）

**总页数**: 约 1190 行

---

### 支持文档

#### 6. **openclaw-integration.md** - OpenClaw 运行时集成

**文件路径**: `openclaw-integration.md`

**包含内容**:

- ✅ OpenClaw 简介
- ✅ 集成架构（Docker 隔离）
- ✅ Agent 使用场景
- ✅ API 接口文档
- ✅ 安全考虑
- ✅ 最佳实践
- ✅ 成本优化

---

#### 7. **financial-system.md** - 财务系统设计（简化版）

**文件路径**: `financial-system.md`

**包含内容**:

- ✅ 财务系统概述
- ✅ 成本追踪（AI API 成本）
- ✅ 预算管理
- ✅ 财务仪表板
- ✅ 成本优化策略

---

#### 8. **agent-configuration.md** - Agent 配置规范

**文件路径**: `agent-configuration.md`

**包含内容**:

- ✅ Agent 配置 JSON Schema
- ✅ 4 种公司类型的 Agent 模板
- ✅ Agent 权限系统
- ✅ 工具注册表
- ✅ 配置验证

---

#### 9. **cost-optimization.md** - 成本优化策略

**文件路径**: `cost-optimization.md`

**包含内容**:

- ✅ Prompt Caching 详解
- ✅ 模型分层策略
- ✅ 心跳机制优化
- ✅ 批量处理
- ✅ 成本监控

---

#### 10. **deployment-guide.md** - 自托管部署指南

**文件路径**: `deployment-guide.md`

**包含内容**:

- 自托管部署步骤
- Docker Compose 配置
- Nginx 反向代理
- SSL 证书配置
- 环境变量设置

---

#### 11. **VERCEL_DEPLOYMENT.md** - Vercel 部署指南

**文件路径**: `VERCEL_DEPLOYMENT.md`

**包含内容**:

- ✅ Vercel vs 自托管对比
- ✅ 前置准备（Supabase 项目设置）
- ✅ 快速部署（一键部署 + GitHub 部署）
- ✅ 环境变量配置
- ✅ 自定义域名设置
- ✅ 性能优化（Edge Functions、ISR、图片优化）
- ✅ 监控与日志（Vercel Analytics、Speed Insights）
- ✅ 常见问题解决
- ✅ 成本估算（Hobby $0/月 vs Pro $20/月）
- ✅ 最佳实践

**适用场景**:

- ✅ 个人项目和 MVP
- ✅ 需要快速迭代
- ✅ 团队协作开发
- ✅ 需要全球访问加速
- ❌ 不支持 Docker 容器（OpenClaw）

**总页数**: 约 630 行

---

## 🚀 技术栈（v0.2）

### 前端

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod

### 后端

- **API**: Next.js API Routes + tRPC
- **数据库**: Supabase（PostgreSQL + 实时订阅 + 向量搜索）
- **ORM**: Drizzle ORM（类型安全、轻量级）
- **认证**: Supabase Auth
- **任务调度**: Supabase Edge Functions + Cron

### AI

- **LLM**: Anthropic Claude 3.5 Sonnet, Claude 3 Haiku, OpenAI GPT-4
- **成本优化**: Prompt Caching, 模型分层
- **代码执行**: OpenClaw Runtime（Docker）

### 基础设施

- **部署**:
  - **Vercel**（推荐用于 MVP 和快速迭代，不支持 OpenClaw）
  - **自托管**（DigitalOcean / Vultr VPS，支持完整功能）
- **容器**: Docker + Dockerode（仅自托管）
- **监控**: Vercel Analytics / 自建监控系统

### 平台集成（20+ 平台）

- **营销**: Twitter, Product Hunt, LinkedIn, Reddit, Stripe
- **内容**: Medium, YouTube, Ghost, Substack, WordPress
- **客服**: Zendesk, Intercom, Freshdesk, Help Scout, Slack
- **开发**: GitHub, GitLab, Vercel, Railway, Sentry

---

## 💡 核心功能

### 1. 公司创建向导

- 选择公司类型（营销/内容/客服/开发）
- 输入需求描述
- AI 自动生成 Agent 配置
- 配置预算和目标
- 连接相关平台

### 2. AI Agent 系统

- **动态生成**: 根据用户需求自动生成 4-6 个 Agent
- **4 种公司类型模板**: 营销、内容、客服、开发
- **Agent 编排**: CEO Agent 协调其他 Agent 工作
- **工具系统**: web_search, code_executor, data_analysis 等
- **记忆系统**: 基于 Convex Vector Search 的长期记忆

### 3. Mission Control

- 实时查看 Agent 活动
- 类型特定指标：
  - 营销公司：曝光量、互动率、转化率
  - 内容公司：发布量、阅读量、订阅增长
  - 客服公司：工单量、响应时间、满意度
  - 开发公司：提交量、部署次数、错误率
- AI 汇报和决策建议
- 任务进度追踪

### 4. 平台集成

- 统一的 Platform 接口
- OAuth 授权流程
- Webhook 事件处理
- Rate Limiting 和错误重试
- 健康监控

### 5. 心跳机制

- 每 6 小时自动唤醒
- 检查任务和执行决策
- 减少 83% AI API 调用
- 可手动触发

### 6. 成本优化

- Prompt Caching（60-80% 节省）
- 模型分层（Haiku/Sonnet/GPT-4）
- 实时成本追踪
- 预算警告和自动暂停

---

## 📊 成本对比

| 项目               | v0.1 Enhanced                              | v0.2 自托管版         | 节省             |
| ------------------ | ------------------------------------------ | --------------------- | ---------------- |
| **基础设施** |                                            |                       |                  |
| PostgreSQL         | $15 | $0（Supabase 免费层）                | $15                   |                  |
| Redis              | $10 | $0（Supabase 实时功能）              | $10                   |                  |
| Vercel Pro         | $20 | $0（自托管）                         | $20                   |                  |
| Railway            | $5 | $0（自托管）                          | $5                    |                  |
| 自托管服务器       | -                                          | $6-12 | -$6-12        |                  |
| **AI 服务**  |                                            |                       |                  |
| 持续运行成本       | $200-300 | $0（心跳机制）                  | $200-300              |                  |
| 优化后 AI API      | -                                          | $1-8（用户自付）      | -                |
| **其他服务** |                                            |                       |                  |
| Pinecone           | $70 | $0（Supabase pgvector）              | $70                   |                  |
| Upstash            | $10 | $0                                   | $10                   |                  |
| **总计**     | **$286-416/月** | **$6-18/月** | **$268-410/月** |                  |
| **节省比例** | -                                          | -                     | **94-97%** |

---

## 🎯 开发周期

### 总时长：6-7 周（280 小时）

- **Week 1**: 基础设施（40小时）
- **Week 2**: AI Agent 系统基础（40小时）
- **Week 3**: Agent 实现与编排（40小时）
- **Week 4**: 公司创建与心跳机制（40小时）
- **Week 5**: Mission Control 与平台集成（40小时）
- **Week 6**: 功能完善与测试（40小时）
- **Week 7**: 部署与文档（40小时）

### 关键里程碑

- ✅ **Week 1 结束**: 基础设施完成
- ✅ **Week 3 结束**: AI 系统就绪
- ✅ **Week 5 结束**: 核心功能完成（记忆系统、心跳机制、平台集成、成本统计）
- 🚧 **Week 7 结束**: 产品上线（进行中）

### 最新进展（2026-02-14）

#### ✅ 已完成功能

1. **记忆系统** - 基于向量搜索的长期记忆存储和检索
2. **心跳机制** - 定时任务调度和自动执行
3. **平台集成** - 统一的平台连接架构
4. **成本统计** - 实时 AI API 成本追踪和展示
5. **Agent 调度** - Agent 任务编排和执行引擎
6. **测试页面转正** - 核心功能页面已完成

#### 🚧 进行中

1. **Agent 调度优化** - 修复已知问题，提升稳定性
2. **UI/UX 完善** - 优化用户界面和交互体验
3. **集成测试** - 端到端功能测��
4. **文档完善** - 更新部署和使用文档

#### 📋 待完成

1. **监控与日志** - 系统监控和错误追踪
2. **性能优化** - 数据库查询和 API 响应优化
3. **部署准备** - 生产环境配置和安全加固

---

## 🚀 部署选项

### 方案对比

| 特性                    | Vercel 部署                   | 自托管部署              |
| ----------------------- | ----------------------------- | ----------------------- |
| **部署速度**      | ⚡ 秒级（Git push 自动部署）  | 🐌 分钟级（手动配置）   |
| **全球 CDN**      | ✅ 内置                       | ❌ 需配置               |
| **HTTPS**         | ✅ 自动                       | ❌ 需配置               |
| **预览环境**      | ✅ 每个 PR 自动创建           | ❌ 无                   |
| **OpenClaw 支持** | ❌ 不支持 Docker              | ✅ 完整支持             |
| **成本**          | $0-20/月 | $6-12/月           |                         |
| **适用场景**      | MVP、快速迭代、无 Docker 需求 | 完整功能、需要 OpenClaw |

### 选择建议

**选择 Vercel**（参考 `VERCEL_DEPLOYMENT.md`）：

- ✅ 个人项目和 MVP
- ✅ 需要快速迭代和部署
- ✅ 团队协作开发（PR 预览环境）
- ✅ 需要全球访问加速
- ✅ 不需要 Docker 容器（不使用 OpenClaw）

**选择自托管**（参考 `deployment-guide.md`）：

- ✅ 需要运行 Docker 容器（OpenClaw 沙盒）
- ✅ 需要完全控制服务器
- ✅ 需要长时间运行的后台任务
- ✅ 希望最小化成本

> **注意**：Vercel 不支持 Docker，如果您的 AI 公司需要使用 OpenClaw 容器运行时，请使用自托管部署方案。

---

## 🚀 快速开始

### 环境准备

```bash
# 1. 安装依赖
Node.js 18+
pnpm
Docker

# 2. 注册账号
Supabase: https://supabase.com
Anthropic: https://console.anthropic.com
OpenAI: https://platform.openai.com

# 3. 申请 API Keys
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

### 项目初始化

```bash
# 1. 创建 Next.js 项目
npx create-next-app@latest ai-company-builder --typescript --tailwind --app

# 2. 安装核心依赖
cd ai-company-builder
pnpm install @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm install drizzle-orm drizzle-kit postgres
pnpm install @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm install zod
pnpm install openai anthropic
pnpm install dockerode

# 3. 初始化 Supabase
# 在 Supabase Dashboard 创建项目并获取 API Keys

# 4. 初始化 Drizzle
npx drizzle-kit generate:pg
npx drizzle-kit push:pg

# 4. 配置环境变量
cp .env.example .env.local
# 填写 API Keys

# 5. 开始开发
pnpm dev
```

### 第一周任务

参考 `development-plan.md` 的 Week 1 详细任务列表。

---

## 💡 关键设计决策

### 为什么选择 Supabase？

- **开源**: 基于 PostgreSQL 的开源 BaaS 平台
- **免费层充足**: 500MB 数据库 + 2GB 文件存储 + 50MB 数据传输/天
- **实时功能**: 内置实时订阅，完美适配 Mission Control
- **向量搜索**: pgvector 扩展支持，无需 Pinecone（节省 $70/月）
- **完整生态**: Auth、Storage、Edge Functions 一体化

### 为什么选择 Drizzle ORM？

- **类型安全**: 完整的 TypeScript 类型推导，编译时检查
- **轻量级**: 零依赖，打包体积小（~7KB）
- **性能优秀**: 接近原生 SQL 的性能
- **SQL-like**: 类似 SQL 的 API，学习曲线低
- **迁移简单**: 自动生成迁移文件
- **AI 友好**: 简洁的 API，便于 AI Agent 操作数据库

### 为什么选择心跳机制？

- **成本节省**: 减少 83% AI API 调用（每 6 小时 vs 持续运行）
- **足够频率**: 6 小时间隔足以处理大多数任务
- **简单可靠**: 使用 Supabase Edge Functions + pg_cron，无需额外服务
- **灵活调整**: 可根据公司状态动态调整间隔

### 为什么选择 Supabase Auth？

- **原生集成**: 与 Supabase 数据库无缝集成
- **免费层充足**: 50,000 MAU 免费
- **多种登录方式**: 邮箱、Google、GitHub 等
- **Row Level Security**: 数据库级别的权限控制

### 为什么选择自托管？

- **成本控制**: $6-12/月 vs Vercel Pro $20/月
- **完全控制**: 控制数据、成本、部署
- **学习价值**: 理解完整的部署流程
- **灵活扩展**: 可根据需求调整服务器配置

### 为什么支持 4 种公司类型？

- **更广市场**: 不仅限于营销，覆盖更多用户需求
- **差异化竞争**: 市场上少有支持多类型的 AI 自动化平台
- **统一架构**: 通过 Agent 配置系统和平台集成架构实现统一管理
- **未来扩展**: 架构支持轻松添加新的公司类型

### 为什么使用 AI 动态生成 Agent？

- **灵活性**: 根据用户具体需求定制 Agent 团队
- **可扩展性**: 无需为每个场景预定义 Agent
- **用户体验**: 用户只需描述需求，AI 自动配置
- **降低门槛**: 用户无需理解 Agent 配置细节

---

## 📖 学习资源

### Next.js

- [Next.js 官方文档](https://nextjs.org/docs)
- [Next.js App Router 教程](https://nextjs.org/learn)

### Supabase

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase + Next.js 示例](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [pgvector 向量搜索](https://supabase.com/docs/guides/ai/vector-columns)

### Drizzle ORM

- [Drizzle 官方文档](https://orm.drizzle.team/docs/overview)
- [Drizzle + PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Drizzle + Supabase](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase)

### tRPC

- [tRPC 官方文档](https://trpc.io/docs)
- [tRPC + Next.js 示例](https://github.com/trpc/trpc/tree/main/examples/next-prisma-starter)

### Anthropic

- [Anthropic API 文档](https://docs.anthropic.com)
- [Prompt Caching 指南](https://docs.anthropic.com/claude/docs/prompt-caching)

### OpenClaw

- [OpenClaw 文档](https://openclaw.com/docs)

---

## 📝 文档维护

### 版本历史

- **v0.1** (2026-02-07): 初始版本（8 个固定 Agent）
- **v0.2** (2026-02-08): 自托管版本
  - 支持 4 种公司类型
  - AI 动态生成 Agent
  - Convex 数据库
  - 心跳机制
  - 极低成本（$6-18/月）
  - 6-7 周开发周期
- **v0.2.1** (2026-02-14): 核心功能完善
  - ✅ 记忆系统实现
  - ✅ 心跳机制完成
  - ✅ 平台集成架构
  - ✅ 成本统计功能
  - ✅ Agent 调度引擎
  - 🚧 UI/UX 优化中

### 更新建议

随着开发进展，建议定期更新：

- 实际开发进度 vs 计划进度
- 遇到的技术挑战和解决方案
- 架构调整和优化
- 新增的功能需求

---

## 🤝 贡献指南

如果你想为这个项目做贡献：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues
- GitHub Issues: https://github.com/your-org/your-repo/issues（请替换为实际仓库地址）

---

## 📄 许可证

本项目采用 MIT 许可证

---

**让 AI 成为你的自动化团队！** 🚀

**支持的公司类型**：

- 📢 营销公司 - 自动化产品推广
- ✍️ 内容公司 - 自动化内容创作
- 💬 客服公司 - 自动化客户支持
- 💻 开发公司 - 自动化开发流程

**极低成本 · 完全控制 · 快速开发 · 多类型支持**
