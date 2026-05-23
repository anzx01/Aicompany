# AI Company Builder - 6-7周开发计划（v0.2 自托管版）

> **目标**: 构建 AI 公司生成平台，支持用户创建不同类型的自动化 AI 公司
> **版本**: v0.2 自托管版（Convex + 心跳机制 + 成本优化 + OpenClaw 运行时）
> **时间**: 6-7 周（约 240-280 小时）
> **团队**: 全栈独立开发者
> **核心特性**:
> - 支持 4 种公司类型（营销、内容、客服、开发）
> - AI 动态生成 Agent 配置
> - OpenClaw 运行时环境
> - 单公司创建（v0.2 简化）
> - Convex 数据库 + 心跳机制 + 成本优化

## 相关文档

本开发计划基于以下文档，开发过程中请参考：

* **[prd.md](./prd.md)** - 产品需求文档，定义产品目标、功能需求、用户体验
* **[tech-specs.md](./tech-specs.md)** - 技术架构文档，包含 AI Agent 实现、API 设计等
* **[database-schema.md](./database-schema.md)** - Convex 数据库 Schema 定义
* **[platform-integrations-overview.md](./platform-integrations-overview.md)** - 平台集成架构和实现指南
* **[openclaw-integration.md](./openclaw-integration.md)** - OpenClaw 运行时集成文档
* **[financial-system.md](./financial-system.md)** - 财务系统设计（简化版）
* **[agent-configuration.md](./agent-configuration.md)** - Agent 配置规范
* **[cost-optimization.md](./cost-optimization.md)** - 成本优化策略
* **[deployment-guide.md](./deployment-guide.md)** - 部署指南（Week 7 创建）

---

## v0.2 核心变化（相比 v0.1）

### 简化内容
1. **数据库**: PostgreSQL + Redis → **Convex**（零成本、零配置）
2. **运行机制**: 持续运行 → **心跳机制**（每 6 小时唤醒）
3. **财务系统**: 完整财务 → **仅 AI API 成本追踪**
4. **OpenClaw**: SDK 调用 → **独立运行时环境**（Docker 容器）
5. **部署**: Vercel + Railway → **自托管**（DigitalOcean/Vultr）
6. **Agent 配置**: 固定角色 → **4 种公司类型模板 + AI 动态生成**
7. **公司数量**: 多公司 → **单公司**（v0.2 简化）

### 新增功能
1. **多公司类型支持**: 营销、内容、客服、开发 4 种类型
2. **AI Agent 生成器**: 根据用户需求动态生成 Agent 配置
3. **公司类型选择器**: 用户创建时选择公司类型
4. **类型特定集成**: 每种公司类型有专属的平台集成

### 成本优化
- **Prompt Caching**: 节省 60-80% AI API 成本
- **模型分层**: 简单任务用 Haiku，复杂任务用 Sonnet/GPT-4
- **心跳机制**: 减少 83% 调用频率
- **月度成本**: $286-416 → **$6-18**（节省 94-97%）

### 总工作量
- v0.1 Enhanced: 360-400 小时（9-10周）
- v0.2 自托管版: 240-280 小时（6-7周）
- **减少**: 120-160 小时（30-40%）

### 工作量分配（调整后）
- **Week 1**: 基础设施（40小时）
- **Week 2**: AI Agent 系统基础（40小时）
- **Week 3**: Agent 实现与编排（40小时）
- **Week 4**: 公司创建与心跳机制（40小时）
- **Week 5**: Mission Control 与平台集成（40小时）
- **Week 6**: 功能完善与测试（40小时）
- **Week 7**: 部署与文档（40小时）
- **总计**: 280 小时

---

## 第一阶段：基础设施（第 1 周）

### Week 1: 项目初始化与 Convex 集成（40小时）

#### Day 1-2: 项目搭建（10小时）
**任务**:
- [ ] 创建 Next.js 14 项目（App Router）
- [ ] 配置 TypeScript + ESLint + Prettier
- [ ] 设置 Tailwind CSS + shadcn/ui
- [ ] 配置 Git 仓库
- [ ] 设置环境变量管理

**交付物**: 可运行的 Next.js 项目

---

#### Day 3-4: Convex 数据库集成（12小时）✨
**任务**:
- [ ] 创建 Convex 账号（免费）
- [ ] 安装 Convex SDK
- [ ] 创建完整 Convex Schema（参考 database-schema.md）
  - [ ] users, companies, agents, tasks, decisions 表
  - [ ] 支持 4 种公司类型（MARKETING, CONTENT, CUSTOMER_SERVICE, DEVELOPMENT）
  - [ ] platformConnections 配置（参考 platform-integrations-overview.md）
- [ ] 配置 Convex 函数（queries, mutations, actions）
- [ ] 测试实时订阅功能
- [ ] 创建 Seed 数据脚本

**交付物**: 完整的 Convex 数据库

---

#### Day 5: 认证系统（10小时）
**任务**:
- [ ] 集成 Clerk 认证服务
- [ ] 配置邮箱密码登录
- [ ] 配置 Google OAuth
- [ ] 配置 GitHub OAuth（可选）
- [ ] 创建用户注册流程
- [ ] 创建受保护的路由中间件
- [ ] 集成 Clerk + Convex（用户同步）

**交付物**: 完整的认证系统（Clerk）

---

#### Day 6-7: Docker 环境配置（8小时）✨
**任务**:
- [ ] 安装 Docker 和 Dockerode
- [ ] 创建 OpenClaw 运行时镜像（Dockerfile.openclaw）
- [ ] 配置 Docker 网络
- [ ] 实现 ContainerManager 基础类
- [ ] 测试容器创建和销毁

**交付物**: Docker 运行时环境

---

## 第二阶段：AI Agent 系统（第 2-3 周）

### Week 2: LLM 集成与 Agent 基础（40小时）

#### Day 8-9: LLM 集成与成本优化（14小时）✨
**任务**:
- [ ] 集成 OpenAI API
- [ ] 集成 Anthropic API
- [ ] 实现 Prompt Caching（参考 cost-optimization.md）
- [ ] 实现模型分层路由（Haiku/Sonnet/GPT-4）
- [ ] 实现 Token 计数与成本追踪
- [ ] 创建 LLM 调用封装

**交付物**: 优化的 LLM 服务

---

#### Day 10-11: Agent 配置系统（14小时）✨
**任务**:
- [ ] 创建 Agent JSON Schema（参考 agent-configuration.md）
- [ ] 实现 Agent 配置加载器（支持 4 种公司类型）
- [ ] 实现 Agent 配置验证器（Zod）
- [ ] 创建 4 种公司类型的 Agent 模板（JSON 文件）
  - [ ] 营销公司模板（CEO, Product Analyst, CMO）
  - [ ] 内容公司模板（CEO, Content Strategist）
  - [ ] 客服公司模板（CEO, Support Lead）
  - [ ] 开发公司模板（CEO, Tech Lead）
- [ ] 实现权限检查系统
- [ ] 创建工具注册表
- [ ] 实现 AI Agent 生成器（动态生成，参考 tech-specs.md）

**交付物**: Agent 配置系统 + AI 生成器

---

#### Day 12: Agent 基础架构（6小时）
**任务**:
- [ ] 设计 Agent 接口
- [ ] 实现 Agent 基类（BaseAgent）
- [ ] 实现 Agent 工厂（AgentFactory）
- [ ] 创建 Agent 记忆管理
- [ ] 实现 Agent 状态机

**交付物**: Agent 基础架构

---

#### Day 13-14: OpenClaw 运行时集成（6小时）✨
**任务**:
- [ ] 实现 OpenClawService 类
- [ ] 实现代码执行功能
- [ ] 实现文件操作功能
- [ ] 实现 Git 操作功能
- [ ] 创建执行记录保存
- [ ] 测试 OpenClaw 集成

**交付物**: OpenClaw 运行时服务

---

### Week 3: Agent 实现与编排（40小时）

#### Day 15-17: 基础 Agent 实现（18小时）
**任务**:
- [ ] CEO Bot - 协调与决策（支持 4 种公司类型）
- [ ] 营销公司 Agent（Product Analyst, CMO, Content Creator）
- [ ] 内容公司 Agent（Content Strategist, Writer, Editor）
- [ ] 客服公司 Agent（Support Lead, Ticket Handler）
- [ ] 开发公司 Agent（Tech Lead, Engineer, QA Engineer）
- [ ] CFO Bot - AI API 成本追踪（通用）

**交付物**: 完整的 4 种公司类型 Agent

---

#### Day 18-19: Agent 编排引擎（12小时）
**任务**:
- [ ] 实现 CEO Bot 编排逻辑
- [ ] 创建任务分配系统
- [ ] 实现 Agent 间通信
- [ ] 创建决策流程
- [ ] 实现阶段转换逻辑

**交付物**: Agent 编排引擎

---

#### Day 20-21: 记忆系统（10小时）
**任务**:
- [ ] 实现记忆存储（Convex）
- [ ] 实现向量搜索（Convex Vector Search）
- [ ] 创建记忆检索系统
- [ ] 实现记忆重要性评分
- [ ] 测试 Agent 协作流程

**交付物**: 记忆系统

---

## 第三阶段：核心功能（第 4-5 周）

### Week 4: 公司创建与心跳机制（40小时）

#### Day 22-24: 公司创建向导（18小时）
**任务**:
- [ ] 设计多步骤表单 UI
  - [ ] 步骤 1: 选择公司类型（营销/内容/客服/开发）
  - [ ] 步骤 2: 输入需求描述
  - [ ] 步骤 3: 配置参数（预算、时间等）
  - [ ] 步骤 4: 确认并创建
- [ ] 实现表单验证
- [ ] 创建公司初始化逻辑
- [ ] 实现 AI 生成公司使命
- [ ] 调用 AI Agent 生成器（动态生成 Agent 配置）
- [ ] 创建 OpenClaw Docker 容器
- [ ] 实现首次任务分配

**交付物**: 完整的公司创建流程（支持 4 种类型）

---

#### Day 25-27: 心跳机制实现（18小时）✨
**任务**:
- [ ] 实现 Convex Cron Jobs
- [ ] 创建心跳检查函数（checkAndWake）
- [ ] 实现心跳执行函数（runHeartbeat）
- [ ] 实现动态心跳间隔调整
- [ ] 创建心跳状态追踪
- [ ] 实现容器启动/停止逻辑
- [ ] 测试心跳机制

**交付物**: 完整的心跳机制

---

#### Day 28: 测试与优化（4小时）
**任务**:
- [ ] Agent 单元测试
- [ ] 编排流程测试
- [ ] 心跳机制测试
- [ ] 性能优化

**交付物**: 测试套件

---

### Week 5: Mission Control 与平台集成（40小时）

#### Day 29-31: Mission Control 仪表板（18小时）
**任务**:
- [ ] 设计仪表板布局
- [ ] 实现公司状态展示
- [ ] 创建 AI 汇报组件
- [ ] 实现今日完成事项列表
- [ ] 创建 48 小时计划展示
- [ ] 实现风险提示组件
- [ ] 创建关键指标卡片
- [ ] 实现实时数据更新（Convex Subscriptions）

**交付物**: 完整的 Mission Control 页面

---

#### Day 32-33: 平台集成基础架构（12小时）✨
**任务**:
- [ ] 实现统一 Platform 接口（参考 platform-integrations-overview.md）
- [ ] 创建 PlatformRegistry（Factory Pattern）
- [ ] 实现 OAuth 流程（OAuthManager）
- [ ] 实现 Webhook 处理（WebhookRouter）
- [ ] 实现错误处理（RetryStrategy, RateLimiter）
- [ ] 实现健康监控（HealthMonitor）

**交付物**: 平台集成基础架构

---

#### Day 34: P0 平台实现 - 营销公司（6小时）✨
**任务**:
- [ ] 实现 Twitter Platform（发布、分析）
- [ ] 实现 Product Hunt Platform（产品发布）
- [ ] 实现 Stripe Platform（支付处理）
- [ ] 测试营销公司平台集成

**交付物**: 营销公司 P0 平台

---

#### Day 35: 财务系统（简化版）（4小时）✨
**任务**:
- [ ] 设计财务仪表板 UI
- [ ] 实现 AI API 成本追踪
- [ ] 实现成本可视化（图表）
- [ ] 实现成本分析（按 Agent/模型）
- [ ] 创建成本警告系统

**交付物**: 财务仪表板（仅 AI API 成本）

---

## 第四阶段：完善与部署（第 6-7 周）

### Week 6: 功能完善与测试（40小时）

#### Day 36-37: P0 平台实现 - 其他公司类型（12小时）✨
**任务**:
- [ ] 内容公司平台（Medium, YouTube）
- [ ] 客服公司平台（Zendesk, Intercom）
- [ ] 开发公司平台（GitHub, Vercel）
- [ ] 测试所有平台集成

**交付物**: 所有公司类型的 P0 平台

---

#### Day 38-39: UI/UX 优化（12小时）
**任务**:
- [ ] 优化响应式设计
- [ ] 改进加载状态
- [ ] 添加动画效果
- [ ] 优化错误提示
- [ ] 改进表单体验
- [ ] 添加帮助文档

**交付物**: 优化的用户界面

---

#### Day 40-41: 集成测试（12小时）
**任务**:
- [ ] 端到端测试
- [ ] 用户流程测试
- [ ] Agent 协作测试
- [ ] 心跳机制测试
- [ ] 平台集成测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 修复发现的 Bug

**交付物**: 测试报告

---

#### Day 42: 监控与日志（4小时）
**任务**:
- [ ] 配置日志系统（Winston/Pino）
- [ ] 创建监控仪表板
- [ ] 设置告警规则
- [ ] 配置 Docker 日志收集

**交付物**: 监控系统

---

### Week 7: 部署与文档（40小时）

#### Day 43-45: 自托管部署（18小时）✨
**任务**:
- [ ] 创建 Docker Compose 配置
- [ ] 创建 Dockerfile
- [ ] 配置 Nginx 反向代理
- [ ] 设置 SSL 证书（Let's Encrypt）
- [ ] 配置环境变量
- [ ] 创建部署脚本
- [ ] 测试 DigitalOcean 部署
- [ ] 测试 Vultr 部署
- [ ] 创建部署文档（参考 deployment-guide.md）

**交付物**: 完整的部署方案

---

#### Day 46-48: 文档与发布（18小时）
**任务**:
- [ ] 创建用户文档
- [ ] 创建开发者文档
- [ ] 创建 API 文档
- [ ] 创建 README
- [ ] 创建 CHANGELOG
- [ ] 准备演示视频
- [ ] 创建 Landing Page
- [ ] 准备发布材料

**交付物**: 完整的文档

---

#### Day 49: 发布（4小时）
**任务**:
- [ ] 在 GitHub 发布
- [ ] 在 Product Hunt 发布
- [ ] 在 Hacker News 分享
- [ ] 社交媒体推广

**交付物**: 产品发布

---

## 关键里程碑

### 里程碑 1: 基础设施完成（Week 1 结束 - 40小时）
- ✅ Next.js 项目搭建
- ✅ Convex 数据库配置（支持 4 种公司类型）
- ✅ 认证系统可用
- ✅ Docker 环境就绪

### 里程碑 2: AI 系统就绪（Week 3 结束 - 累计 120小时）
- ✅ LLM 集成与成本优化完成
- ✅ 4 种公司类型的 Agent 配置系统
- ✅ AI Agent 生成器可用
- ✅ Agent 编排引擎运行
- ✅ 记忆系统可用
- ✅ OpenClaw 集成稳定

### 里程碑 3: 核心功能完成（Week 5 结束 - 累计 200小时）
- ✅ 公司创建流程完整（支持 4 种类型）
- ✅ 心跳机制工作
- ✅ Mission Control 可用
- ✅ 平台集成基础架构完成
- ✅ 营销公司 P0 平台实现
- ✅ 财务系统运行

### 里程碑 4: 产品上线（Week 7 结束 - 累计 280小时）
- ✅ 所有公司类型的 P0 平台实现
- ✅ 所有功能测试通过
- ✅ 自托管部署成功
- ✅ 文档完成
- ✅ 产品发布

---

## 平台集成优先级（参考 platform-integrations-overview.md）

### Phase 1: 营销公司 P0 平台（Week 5, Day 34）
- **Twitter/X**: 社交媒体营销核心
- **Product Hunt**: 产品发布必备
- **Stripe**: 支付处理

### Phase 2: 内容公司 P0 平台（Week 6, Day 36）
- **Medium**: 博客发布核心
- **YouTube**: 视频内容发布
- **Stripe**: 支付处理（已实现）

### Phase 3: 客服公司 P0 平台（Week 6, Day 36）
- **Zendesk**: 工单系统
- **Intercom**: 实时聊天

### Phase 4: 开发公司 P0 平台（Week 6, Day 37）
- **GitHub**: 代码托管
- **Vercel**: 部署平台

### P1 平台（后续版本）
- Reddit, LinkedIn（营销）
- Ghost, Substack（内容）
- Help Scout（客服）
- Railway（开发）
- Gumroad（通用）

---

## 风险管理

### 高风险项
1. **Agent 编排复杂度**
   - 风险: Agent 协作逻辑可能比预期复杂
   - 缓解: 先实现简化版本，逐步增加复杂度
   - 预留时间: +1 周

2. **心跳机制稳定性**
   - 风险: 定时唤醒可能不稳定
   - 缓解: 实现手动触发作为备用
   - 预留时间: +3 天

3. **OpenClaw 运行时环境**
   - 风险: Docker 容器管理可能遇到问题
   - 缓解: 充分测试，实现自动恢复
   - 预留时间: +3 天

4. **平台集成复杂度**✨
   - 风险: 多平台 OAuth 和 API 集成可能遇到问题
   - 缓解: 先实现 P0 平台，使用统一接口设计
   - 预留时间: +2 天

### 中风险项
1. **Convex 学习曲线**
   - 风险: 团队不熟悉 Convex
   - 缓解: 提前学习文档，参考示例
   - 预留时间: +2 天

2. **成本优化效果**
   - 风险: Prompt Caching 效果可能不如预期
   - 缓解: 多种优化策略组合
   - 预留时间: +2 天

3. **多公司类型支持**✨
   - 风险: 4 种公司类型的差异化实现可能增加复杂度
   - 缓解: 使用统一的 Agent 配置系统和模板
   - 预留时间: +2 天

---

## 技术债务管理

### 允许的技术债务（MVP 阶段）
- 简化的错误处理
- 基础的测试覆盖
- 简单的 UI 设计
- 有限的性能优化

### 必须避免的技术债务
- 安全漏洞
- 数据丢失风险
- 严重的性能问题
- 核心功能缺失

---

## 成功标准

### MVP 上线标准
1. ✅ 用户可以创建公司
2. ✅ AI Agent 可以自主运行（心跳机制）
3. ✅ Mission Control 展示实时进度
4. ✅ 系统可以持续运行 7 天无人工干预
5. ✅ 核心功能无严重 Bug
6. ✅ 响应时间 < 3 秒
7. ✅ 错误率 < 1%
8. ✅ 月度成本 < $20

### 产品验证标准
1. 至少 10 个用户注册
2. 至少 3 个公司运行超过 7 天
3. 用户反馈积极（NPS > 7）
4. 系统稳定性 > 99%
5. AI API 成本 < $10/月/公司

---

## 资源需求

### 开发工具
- VS Code + 扩展
- GitHub Copilot（可选）
- Postman/Insomnia
- Docker Desktop

### 外部服务（v0.2 自托管版）
- **Convex**（数据库）- **免费** ✨
- **DigitalOcean/Vultr**（服务器）- $6-12/月 ✨
- **OpenAI API**（LLM）- 用户自付 ✨
- **Anthropic API**（LLM）- 用户自付 ✨
- **GitHub Actions**（CI/CD）- 免费

### 预算估算（月度）- v0.2 自托管版

| 项目 | v0.1 Enhanced | v0.2 自托管版 | 节省 |
|------|--------------|--------------|------|
| **基础设施** |
| PostgreSQL | $15 | $0（Convex 免费） | $15 |
| Redis | $10 | $0（Convex 内置） | $10 |
| Vercel Pro | $20 | $0（自托管） | $20 |
| Railway | $5 | $0（自托管） | $5 |
| 自托管服务器 | - | $6-12 | -$6-12 |
| **AI 服务** |
| 持续运行成本 | $200-300 | $0（心跳机制） | $200-300 |
| 优化后 AI API | - | $1-8（用户自付） | - |
| **其他服务** |
| Pinecone | $70 | $0（Convex 向量搜索） | $70 |
| Upstash | $10 | $0 | $10 |
| **总计** | **$286-416/月** | **$6-18/月** | **$268-410/月** |
| **节省比例** | - | - | **94-97%** |

---

## 下一步行动

### 立即开始
1. 创建 GitHub 仓库
2. 初始化 Next.js 项目
3. 创建 Convex 账号
4. 设置开发环境
5. 创建项目看板（GitHub Projects）
6. 开始 Week 1 Day 1 任务

### 第一周目标
完成基础设施搭建，确保 Convex 集成稳定，为后续开发打好基础。

---

## 总结

### v0.2 自托管版优势
1. **极低成本**: 月度成本 $6-18（节省 94-97%）
2. **零配置**: Convex 数据库零配置
3. **完全控制**: 自托管部署，完全控制数据和成本
4. **高效开发**: 6-7周完成，280小时（相比 v0.1 的 9-10周，360-400小时）
5. **成本优化**: Prompt Caching + 模型分层 + 心跳机制
6. **多类型支持**: 支持营销、内容、客服、开发 4 种公司类型

### 关键技术
- **Convex**: 零成本实时数据库
- **心跳机制**: 减少 83% AI API 调用
- **Prompt Caching**: 节省 60-80% AI API 成本
- **模型分层**: 简单任务用 Haiku，复杂任务用 Sonnet/GPT-4
- **AI Agent 生成器**: 动态生成 Agent 配置
- **OpenClaw 运行时**: 独立的代码执行环境（Docker）
- **多公司类型**: 支持营销、内容、客服、开发 4 种类型
- **统一平台集成**: Factory Pattern + OAuth + Webhook 架构
- **成本追踪**: 实时追踪每个 Agent 的 AI API 成本

### 调整后的工作量分配
- **Week 1**: 基础设施（40小时）
- **Week 2**: AI Agent 系统基础（40小时）
- **Week 3**: Agent 实现与编排（40小时）
- **Week 4**: 公司创建与心跳机制（40小时）
- **Week 5**: Mission Control 与平台集成（40小时）
- **Week 6**: 功能完善与测试（40小时）
- **Week 7**: 部署与文档（40小时）
- **总计**: 280 小时

### 平台集成策略
- **Phase 1**: 营销公司 P0 平台（Twitter, Product Hunt, Stripe）
- **Phase 2**: 内容公司 P0 平台（Medium, YouTube）
- **Phase 3**: 客服公司 P0 平台（Zendesk, Intercom）
- **Phase 4**: 开发公司 P0 平台（GitHub, Vercel）
- **后续版本**: P1 平台（Reddit, LinkedIn, Ghost, Substack, Help Scout, Railway, Gumroad）

---

**v0.2 自托管版 - 极低成本、完全控制、快速开发、多类型支持、统一平台集成！** 🚀

---

## 附录：关键架构决策

### 为什么选择 Convex？
* **零成本**：免费层足够 MVP 使用（< 1GB 数据）
* **零配置**：无需管理数据库服务器
* **实时同步**：内置实时订阅，完美适配 Mission Control
* **向量搜索**：内置向量搜索，无需 Pinecone（节省 $70/月）
* **TypeScript 原生**：类型安全的查询和 mutations

### 为什么选择心跳机制？
* **成本节省**：减少 83% AI API 调用（每 6 小时 vs 持续运行）
* **足够频率**：6 小时间隔足以处理大多数任务
* **简单可靠**：使用 Convex Cron Jobs，无需额外服务
* **灵活调整**：可根据公司状态动态调整间隔

### 为什么选择 Clerk？
* **快速集成**：5 分钟完成认证系统
* **免费层充足**：10,000 MAU 免费
* **多种登录方式**：邮箱、Google、GitHub 等
* **与 Convex 集成**：官方支持，用户自动同步

### 为什么选择自托管？
* **成本控制**：$6-12/月 vs Vercel Pro $20/月
* **完全控制**：控制数据、成本、部署
* **学习价值**：理解完整的部署流程
* **灵活扩展**：可根据需求调整服务器配置

### 为什么支持 4 种公司类型？
* **更广市场**：不仅限于营销，覆盖更多用户需求
* **差异化竞争**：市场上少有支持多类型的 AI 自动化平台
* **统一架构**：通过 Agent 配置系统和平台集成架构实现统一管理
* **未来扩展**：架构支持轻松添加新的公司类型

### 为什么使用 AI 动态生成 Agent？
* **灵活性**：根据用户具体需求定制 Agent 团队
* **可扩展性**：无需为每个场景预定义 Agent
* **用户体验**：用户只需描述需求，AI 自动配置
* **降低门槛**：用户无需理解 Agent 配置细节

### 为什么使用统一平台集成架构？
* **可维护性**：Factory Pattern 使添加新平台变得简单
* **一致性**：所有平台使用相同的接口和错误处理
* **可测试性**：统一接口便于编写测试
* **文档清晰**：platform-integrations-overview.md 提供完整指南

### 为什么使用 Prompt Caching？
* **巨大节省**：60-80% 成本节省
* **简单实现**：Anthropic 原生支持，无需额外代码
* **适合场景**：Agent 的 system prompt 很长且重复使用
* **立即生效**：开启即可享受节省

### 为什么使用模型分层？
* **成本优化**：简单任务用 Haiku（$0.25/MTok）vs Sonnet（$3/MTok）
* **性能平衡**：简单任务更快响应
* **智能路由**：根据任务复杂度自动选择模型
* **灵活配置**：每个 Agent 可配置不同模型

---

## 开发建议

### 第一周重点
* 确保 Convex 集成稳定，这是整个系统的基础
* 熟悉 Convex 的 queries、mutations、actions 概念
* 测试实时订阅功能，确保 Mission Control 可以实时更新

### 第二周重点
* 理解 Prompt Caching 的工作原理
* 设计好 Agent 配置的 JSON Schema
* 实现 AI Agent 生成器的核心逻辑

### 第三周重点
* Agent 编排是核心，需要仔细设计
* 先实现简单的编排逻辑，再逐步增加复杂度
* 充分测试 Agent 间的通信和协作

### 第四周重点
* 心跳机制的稳定性至关重要
* 实现手动触发作为备用方案
* 测试长时间运行的稳定性

### 第五周重点
* 平台集成架构要设计好，后续添加平台会很容易
* 先实现营销公司的 P0 平台，验证架构
* OAuth 流程要处理好错误情况

### 第六周重点
* 实现其他公司类型的 P0 平台
* 充分测试所有平台集成
* 修复发现的 Bug

### 第七周重点
* 部署文档要详细，方便用户自托管
* 准备好演示材料
* 在 Product Hunt 发布前做好充分准备

---

## 常见问题

### Q: 为什么不使用 PostgreSQL？
A: Convex 提供零成本、零配置的实时数据库，完美适配 MVP 需求。PostgreSQL 需要额外的服务器和管理成本。

### Q: 为什么不使用 Vercel 部署？
A: 自托管可以节省成本（$6-12/月 vs $20/月），并且提供完全控制。对于需要 Docker 容器的场景，自托管更合适。

### Q: 6 小时的心跳间隔会不会太长？
A: 对于大多数营销、内容、客服、开发任务，6 小时足够。用户可以手动触发，未来可以根据反馈调整。

### Q: 为什么不支持多公司？
A: v0.2 简化为单公司，降低复杂度，加快开发速度。v0.3 会支持多公司。

### Q: 如何确保 AI 生成的内容质量？
A: 重要内容需要用户审核，使用高质量模型（Sonnet/GPT-4），持续优化 Prompt。

### Q: 平台 API 限制怎么处理？
A: 实现 Rate Limiter（Token Bucket 算法），遵守各平台限制，提供用户可配置的发布频率。

### Q: OpenClaw 容器的安全性如何保证？
A: 严格的沙箱隔离，资源限制（CPU、内存、网络），执行超时控制，安全审计和监控。

---

**准备好开始了吗？从 Week 1 Day 1 开始，让我们构建这个令人兴奋的产品！** 🚀
