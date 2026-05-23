# AI Company Builder - 技术实现规格（v0.2 自托管版）

> 本文档详细描述 AI Company Builder v0.2 的技术实现细节、代码架构和关键模块设计
> **产品定位**: AI 公司生成平台，帮助用户创建不同类型的自动化 AI 公司
> **v0.2 范围**:
> - 支持 4 种公司类型：营销、内容、客服、开发
> - 单公司创建（每个用户一个公司）
> - AI 动态生成 Agent（根据用户需求）
> - OpenClaw 作为核心运行时环境

---

## 目录

1. [项目结构](#项目结构)
2. [核心模块](#核心模块)
3. [AI Agent 实现](#ai-agent-实现)
4. [Convex 集成](#convex-集成)
5. [心跳机制实现](#心跳机制实现)
6. [成本优化实现](#成本优化实现)
7. [API 设计](#api-设计)
8. [前端架构](#前端架构)
9. [状态管理](#状态管理)
10. [安全与性能](#安全与性能)

---

## 项目结构（v0.2）

```
ai-company-builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # 主应用页面
│   │   │   ├── dashboard/     # Mission Control
│   │   │   ├── company/       # 公司管理
│   │   │   │   └── create/    # 公司创建向导（选择类型）
│   │   │   ├── agents/        # Agent 配置管理
│   │   │   ├── tasks/         # 任务列表
│   │   │   ├── memories/      # 记忆系统
│   │   │   ├── financial/     # 财务仪表板（AI API 成本）
│   │   │   └── decisions/     # 决策历史
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── trpc/          # tRPC
│   │   │   └── webhooks/      # Webhooks
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   ├── dashboard/        # 仪表板组件
│   │   ├── company/          # 公司相关组件
│   │   │   └── type-selector/ # 公司类型选择器
│   │   ├── agents/           # Agent 配置组件
│   │   ├── financial/        # 财务组件
│   │   └── shared/           # 共享组件
│   ├── lib/                  # 核心库
│   │   ├── agents/           # AI Agent 实现
│   │   │   ├── base/         # Agent 基类
│   │   │   ├── config/       # Agent 配置加载器
│   │   │   ├── templates/    # 按公司类型组织的 Agent 模板
│   │   │   │   ├── marketing/  # 营销公司 Agent
│   │   │   │   │   ├── ceo.ts
│   │   │   │   │   ├── product-analyst.ts
│   │   │   │   │   ├── cmo.ts
│   │   │   │   │   ├── content-creator.ts
│   │   │   │   │   ├── sales-manager.ts
│   │   │   │   │   └── customer-support.ts
│   │   │   │   ├── content/    # 内容公司 Agent
│   │   │   │   ├── customer-service/ # 客服公司 Agent
│   │   │   │   └── development/ # 开发公司 Agent
│   │   │   ├── generator.ts  # AI Agent 生成器（动态生成）
│   │   │   └── factory.ts    # Agent 工厂
│   │   ├── orchestrator/     # Agent 编排引擎
│   │   ├── memory/           # 记忆系统
│   │   ├── llm/              # LLM 封装（支持多模型）
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   ├── cache.ts      # Prompt Caching
│   │   │   └── router.ts     # 模型路由（分层）
│   │   ├── cost/             # 成本追踪
│   │   │   ├── tracker.ts
│   │   │   └── optimizer.ts
│   │   ├── platforms/        # 平台集成（按公司类型）
│   │   │   ├── marketing/    # 营销平台（Twitter, Product Hunt等）
│   │   │   ├── content/      # 内容平台（Medium, YouTube等）
│   │   │   ├── customer-service/ # 客服平台（Zendesk, Intercom等）
│   │   │   └── sales/        # 销售平台（Stripe, Gumroad等）
│   │   ├── openclaw/         # OpenClaw 运行时管理
│   │   │   ├── container-manager.ts
│   │   │   ├── executor.ts
│   │   │   └── sandbox.ts
│   │   └── utils/            # 工具函数
│   ├── server/               # 服务器端代码
│   │   ├── api/              # tRPC API
│   │   │   ├── routers/      # API 路由
│   │   │   └── trpc.ts       # tRPC 配置
│   │   └── auth.ts           # NextAuth 配置
│   ├── types/                # TypeScript 类型
│   │   └── company-types.ts  # 公司类型定义
│   ├── hooks/                # React Hooks
│   └── styles/               # 样式文件
├── convex/                   # Convex 后端
│   ├── schema.ts             # Convex Schema
│   ├── companies.ts          # 公司相关函数
│   ├── agents.ts             # Agent 相关函数
│   ├── tasks.ts              # 任务相关函数
│   ├── memories.ts           # 记忆相关函数
│   ├── financial.ts          # 财务相关函数
│   ├── heartbeat.ts          # 心跳机制
│   ├── crons.ts              # Cron Jobs
│   └── http.ts               # HTTP Actions
├── agent-configs/            # Agent JSON 配置文件（按公司类型）
│   ├── templates/            # 默认模板
│   │   ├── marketing/        # 营销公司模板
│   │   │   ├── ceo.json
│   │   │   ├── product-analyst.json
│   │   │   ├── cmo.json
│   │   │   ├── content-creator.json
│   │   │   ├── sales-manager.json
│   │   │   └── customer-support.json
│   │   ├── content/          # 内容公司模板
│   │   ├── customer-service/ # 客服公司模板
│   │   └── development/      # 开发公司模板
│   └── custom/               # 用户自定义配置
├── openclaw-runtime/         # OpenClaw 运行时 Docker 镜像
│   ├── Dockerfile
│   └── entrypoint.sh
├── public/                   # 静态资源
├── tests/                    # 测试文件
├── .env.example              # 环境变量示例
├── docker-compose.yml        # Docker Compose 配置
├── Dockerfile                # Docker 镜像
├── next.config.js            # Next.js 配置
├── tailwind.config.ts        # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── package.json
```

---

## 核心模块

### 1. Agent 基类（支持配置化）

```typescript
// src/lib/agents/base/agent.ts

import { LLMRouter } from '@/lib/llm/router';
import { MemoryService } from '@/lib/memory/service';
import { CostTracker } from '@/lib/cost/tracker';
import { Tool, AgentConfig } from '@/types/agent';

export abstract class BaseAgent {
  protected llm: LLMRouter;
  protected memory: MemoryService;
  protected costTracker: CostTracker;
  protected tools: Tool[];
  protected config: AgentConfig;

  constructor(
    public id: string,
    public companyId: string,
    config: AgentConfig
  ) {
    this.config = config;
    this.llm = new LLMRouter(config.model);
    this.memory = new MemoryService(companyId);
    this.costTracker = new CostTracker(companyId, id);
    this.tools = this.initializeTools();
  }

  // 从 JSON 配置加载 Agent
  static fromConfig(companyId: string, config: AgentConfig): BaseAgent {
    // 根据配置创建 Agent 实例
    return new ConfigurableAgent(companyId, config);
  }

  // 抽象方法：每个 Agent 必须实现
  abstract getSystemPrompt(): string;
  abstract initializeTools(): Tool[];

  // 执行任务（带成本追踪）
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // 1. 检索相关记忆
      const relevantMemories = await this.memory.search(task.description);

      // 2. 构建上下文
      const context = this.buildContext(task, relevantMemories);

      // 3. 调用 LLM（自动选择模型和应用 Prompt Caching）
      const response = await this.llm.chat({
        systemPrompt: this.getSystemPrompt(),
        messages: context,
        tools: this.tools,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        useCache: true, // 启用 Prompt Caching
      });

      // 4. 追踪成本
      await this.costTracker.track({
        provider: response.provider,
        model: response.model,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        cost: response.usage.cost,
        taskId: task.id,
        cached: response.usage.cached,
      });

      // 5. 处理工具调用
      if (response.toolCalls) {
        await this.handleToolCalls(response.toolCalls);
      }

      // 6. 保存记忆
      await this.memory.save({
        type: 'TASK_RESULT',
        content: response.content,
        taskId: task.id,
      });

      return {
        success: true,
        result: response.content,
        metadata: {
          ...response.metadata,
          executionTime: Date.now() - startTime,
          cost: response.usage.cost,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 构建上下文
  protected buildContext(task: Task, memories: Memory[]): Message[] {
    return [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
      ...memories.map(m => ({
        role: 'user',
        content: `相关记忆: ${m.content}`,
      })),
      {
        role: 'user',
        content: `任务: ${task.description}`,
      },
    ];
  }

  // 处理工具调用
  protected async handleToolCalls(toolCalls: ToolCall[]): Promise<void> {
    for (const call of toolCalls) {
      const tool = this.tools.find(t => t.name === call.name);
      if (tool) {
        await tool.execute(call.arguments);
      }
    }
  }
}

// 可配置的 Agent（从 JSON 加载）
export class ConfigurableAgent extends BaseAgent {
  constructor(companyId: string, config: AgentConfig) {
    super(`${config.role}-${companyId}`, companyId, config);
  }

  getSystemPrompt(): string {
    return this.config.systemPrompt;
  }

  initializeTools(): Tool[] {
    // 根据配置的 permissions 初始化工具
    return this.config.tools.map(toolName =>
      ToolRegistry.get(toolName)
    ).filter(Boolean);
  }
}
```

### 2. CEO Agent 实现

```typescript
// src/lib/agents/ceo/ceo-agent.ts

import { BaseAgent } from '../base/agent';
import { AgentRole, Tool } from '@/types/agent';

export class CEOAgent extends BaseAgent {
  constructor(companyId: string, companyType: string) {
    super(
      `ceo-${companyId}`,
      AgentRole.CEO,
      companyId,
      {
        model: 'gpt-4-turbo',
        temperature: 0.7,
        maxTokens: 2000,
      }
    );
    this.companyType = companyType;
  }

  getSystemPrompt(): string {
    const basePrompt = `你是一家 AI 驱动的${this.getCompanyTypeLabel()}公司的 CEO。

你的核心职责：
1. 制定公司整体战略方向
2. 协调各个 Agent 的工作
3. 做出关键决策
4. 评估进展并调整方向
5. 向创始人汇报

你的决策原则：
- 快速验证，快速失败
- 专注于第一笔收入
- 保持极简 MVP 思维
- 数据驱动决策

当前公司阶段：{phase}
公司使命：{mission}
已运行天数：{daysRunning}
`;

    // 根据公司类型添加特定指导
    const typeSpecificPrompt = this.getTypeSpecificPrompt();
    return basePrompt + '\n\n' + typeSpecificPrompt;
  }

  private getCompanyTypeLabel(): string {
    const labels = {
      MARKETING: '营销和销售',
      CONTENT: '内容创作',
      CUSTOMER_SERVICE: '客户服务',
      DEVELOPMENT: '软件开发',
    };
    return labels[this.companyType] || '自动化';
  }

  private getTypeSpecificPrompt(): string {
    const prompts = {
      MARKETING: `
营销公司特定职责：
- 分析目标市场和竞品
- 制定多渠道营销策略
- 监控营销效果和 ROI
- 优化转化漏斗
`,
      CONTENT: `
内容公司特定职责：
- 规划内容日历和主题
- 确保内容质量和一致性
- 优化 SEO 和分发策略
- 分析内容表现数据
`,
      CUSTOMER_SERVICE: `
客服公司特定职责：
- 优化客户支持流程
- 监控响应时间和满意度
- 管理知识库和 FAQ
- 处理升级问题
`,
      DEVELOPMENT: `
开发公司特定职责：
- 规划技术架构和路线图
- 管理代码质量和测试
- 协调开发和部署流程
- 处理技术债务
`,
    };
    return prompts[this.companyType] || '';
  }

  initializeTools(): Tool[] {
    return [
      {
        name: 'delegate_task',
        description: '将任务分配给其他 Agent',
        parameters: {
          type: 'object',
          properties: {
            agentRole: {
              type: 'string',
              enum: this.getAvailableAgentRoles(),
            },
            taskDescription: { type: 'string' },
            priority: { type: 'number' },
          },
          required: ['agentRole', 'taskDescription'],
        },
        execute: async (args) => {
          return await this.delegateTask(args);
        },
      },
      {
        name: 'make_decision',
        description: '做出关键决策',
        parameters: {
          type: 'object',
          properties: {
            decisionType: { type: 'string' },
            options: { type: 'array' },
            reasoning: { type: 'string' },
          },
          required: ['decisionType', 'options', 'reasoning'],
        },
        execute: async (args) => {
          return await this.makeDecision(args);
        },
      },
      {
        name: 'request_user_input',
        description: '请求创始人输入',
        parameters: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            context: { type: 'string' },
          },
          required: ['question'],
        },
        execute: async (args) => {
          return await this.requestUserInput(args);
        },
      },
    ];
  }

  private getAvailableAgentRoles(): string[] {
    // 根据公司类型返回可用的 Agent 角色
    const rolesByType = {
      MARKETING: ['PRODUCT_ANALYST', 'CMO', 'CONTENT_CREATOR', 'SALES_MANAGER', 'CUSTOMER_SUPPORT'],
      CONTENT: ['CONTENT_STRATEGIST', 'WRITER', 'EDITOR', 'SEO_SPECIALIST', 'SOCIAL_MEDIA_MANAGER'],
      CUSTOMER_SERVICE: ['SUPPORT_LEAD', 'TICKET_HANDLER', 'KB_MANAGER', 'QA_SPECIALIST'],
      DEVELOPMENT: ['TECH_LEAD', 'ENGINEER', 'QA_ENGINEER', 'DEVOPS', 'PRODUCT_MANAGER'],
    };
    return rolesByType[this.companyType] || [];
  }

  // 编排其他 Agent
  async orchestrate(): Promise<void> {
    // 1. 获取公司当前状态
    const company = await this.getCompanyState();

    // 2. 分析当前阶段
    const analysis = await this.analyzePhase(company);

    // 3. 决定下一步行动
    const nextActions = await this.decideNextActions(analysis);

    // 4. 分配任务
    for (const action of nextActions) {
      await this.delegateTask(action);
    }
  }

  private async delegateTask(args: any): Promise<void> {
    // 实现任务分配逻辑
  }

  private async makeDecision(args: any): Promise<void> {
    // 实现决策逻辑
  }

  private async requestUserInput(args: any): Promise<void> {
    // 实现用户输入请求逻辑
  }
}
```

### 3. AI Agent 生成器（动态生成）

```typescript
// src/lib/agents/generator.ts

import { LLMRouter } from '@/lib/llm/router';
import { AgentConfig } from '@/types/agent';

export class AgentGenerator {
  private llm: LLMRouter;

  constructor() {
    this.llm = new LLMRouter('gpt-4-turbo');
  }

  /**
   * 根据用户需求动态生成 Agent 配置
   */
  async generateAgents(
    companyType: string,
    userRequirements: string,
    productInfo?: string
  ): Promise<AgentConfig[]> {
    const systemPrompt = `你是一个 AI Agent 配置生成器。
根据用户的公司类型和需求，生成合适的 Agent 配置。

公司类型：${companyType}
用户需求：${userRequirements}
${productInfo ? `产品信息：${productInfo}` : ''}

请生成 4-8 个 Agent 的配置，每个 Agent 应该有：
1. role: Agent 角色名称（英文，大写下划线格式）
2. name: Agent 显示名称（中文）
3. description: Agent 职责描述
4. systemPrompt: Agent 的系统提示词（详细描述职责和工作方式）
5. model: 使用的 AI 模型（根据复杂度选择）
6. temperature: 温度参数（0-1）
7. maxTokens: 最大 token 数
8. permissions: 权限列表
9. tools: 可用工具列表
10. schedule: 执行计划

返回 JSON 数组格式。`;

    const response = await this.llm.chat({
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `请为这个${this.getCompanyTypeLabel(companyType)}公司生成 Agent 配置。`,
        },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    // 解析 AI 生成的配置
    const configs = JSON.parse(response.content);

    // 验证和规范化配置
    return configs.map((config: any) => this.validateAndNormalize(config));
  }

  /**
   * 基于模板生成 Agent（使用预定义模板 + 用户定制）
   */
  async generateFromTemplate(
    companyType: string,
    templateName: string,
    customizations?: Partial<AgentConfig>
  ): Promise<AgentConfig> {
    // 加载模板
    const template = await this.loadTemplate(companyType, templateName);

    // 应用用户定制
    if (customizations) {
      return { ...template, ...customizations };
    }

    return template;
  }

  private getCompanyTypeLabel(type: string): string {
    const labels = {
      MARKETING: '营销',
      CONTENT: '内容',
      CUSTOMER_SERVICE: '客服',
      DEVELOPMENT: '开发',
    };
    return labels[type] || '自动化';
  }

  private async loadTemplate(
    companyType: string,
    templateName: string
  ): Promise<AgentConfig> {
    // 从文件系统加载模板
    const templatePath = `agent-configs/templates/${companyType.toLowerCase()}/${templateName}.json`;
    const template = await import(templatePath);
    return template.default;
  }

  private validateAndNormalize(config: any): AgentConfig {
    // 验证必填字段
    if (!config.role || !config.name || !config.systemPrompt) {
      throw new Error('Invalid agent config: missing required fields');
    }

    // 设置默认值
    return {
      role: config.role,
      name: config.name,
      description: config.description || '',
      systemPrompt: config.systemPrompt,
      model: config.model || 'claude-3-haiku-20240307',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 2000,
      permissions: config.permissions || [],
      tools: config.tools || [],
      schedule: config.schedule || { frequency: 'daily', time: '09:00' },
    };
  }
}
```

### 4. Market Research Agent

```typescript
// src/lib/agents/market/market-agent.ts

export class MarketResearchAgent extends BaseAgent {
  getSystemPrompt(): string {
    return `你是市场研究专家，负责发现和验证市场机会。

你的职责：
1. 扫描社交媒体（Reddit, HN, Twitter）寻找痛点
2. 分析竞品
3. 评估市场规模
4. 验证需求真实性
5. 识别愿意付费的信号

你的工具：
- 搜索引擎
- 社交媒体 API
- 竞品分析工具
`;
  }

  initializeTools(): Tool[] {
    return [
      {
        name: 'search_reddit',
        description: '在 Reddit 搜索相关讨论',
        execute: async (args) => {
          // 实现 Reddit 搜索
        },
      },
      {
        name: 'analyze_competitor',
        description: '分析竞品',
        execute: async (args) => {
          // 实现竞品分析
        },
      },
      {
        name: 'estimate_market_size',
        description: '估算市场规模',
        execute: async (args) => {
          // 实现市场规模估算
        },
      },
    ];
  }
}
```

### 4. Product Manager Agent

```typescript
// src/lib/agents/pm/pm-agent.ts

export class ProductManagerAgent extends BaseAgent {
  getSystemPrompt(): string {
    return `你是产品经理，负责定义极简 MVP。

你的职责：
1. 将市场需求转化为产品功能
2. 定义 MVP 范围（只做最核心的）
3. 编写用户故事
4. 优先级排序
5. 与工程师协作确定可行性

你的原则：
- 极简主义：只做最核心的 1-3 个功能
- 快速验证：7 天内可完成
- 用户价值优先
`;
  }

  initializeTools(): Tool[] {
    return [
      {
        name: 'define_mvp_scope',
        description: '定义 MVP 范围',
        execute: async (args) => {
          // 实现 MVP 范围定义
        },
      },
      {
        name: 'create_user_story',
        description: '创建用户故事',
        execute: async (args) => {
          // 实现用户故事创建
        },
      },
    ];
  }
}
```

---

## API 设计

### tRPC Router 结构

```typescript
// src/server/api/root.ts

import { createTRPCRouter } from './trpc';
import { companyRouter } from './routers/company';
import { agentRouter } from './routers/agent';
import { taskRouter } from './routers/task';
import { memoryRouter } from './routers/memory';
import { decisionRouter } from './routers/decision';

export const appRouter = createTRPCRouter({
  company: companyRouter,
  agent: agentRouter,
  task: taskRouter,
  memory: memoryRouter,
  decision: decisionRouter,
});

export type AppRouter = typeof appRouter;
```

### Company Router

```typescript
// src/server/api/routers/company.ts

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const companyRouter = createTRPCRouter({
  // 创建公司
  create: protectedProcedure
    .input(
      z.object({
        targetAudience: z.string(),
        explorationDays: z.number(),
        successCriteria: z.string(),
        weeklyHours: z.number(),
        autoPublish: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. 创建公司记录
      const company = await ctx.db.company.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
          status: 'INITIALIZING',
          currentPhase: 'IDEA_DISCOVERY',
        },
      });

      // 2. 初始化 Agents
      await initializeAgents(company.id);

      // 3. 生成公司使命
      const mission = await generateMission(input);
      await ctx.db.company.update({
        where: { id: company.id },
        data: { mission, status: 'ACTIVE' },
      });

      // 4. 启动首次编排
      await startOrchestration(company.id);

      return company;
    }),

  // 获取公司详情
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.company.findUnique({
        where: { id: input.id },
        include: {
          agents: true,
          tasks: {
            where: { status: 'IN_PROGRESS' },
            take: 10,
          },
          metrics: {
            orderBy: { recordedAt: 'desc' },
            take: 20,
          },
        },
      });
    }),

  // 获取 Dashboard 数据
  getDashboard: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [company, todayTasks, upcomingTasks, latestReport] = await Promise.all([
        ctx.db.company.findUnique({ where: { id: input.companyId } }),
        ctx.db.task.findMany({
          where: {
            companyId: input.companyId,
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
        ctx.db.task.findMany({
          where: {
            companyId: input.companyId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
          take: 5,
          orderBy: { priority: 'desc' },
        }),
        ctx.db.report.findFirst({
          where: { companyId: input.companyId, type: 'DAILY' },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        company,
        todayCompleted: todayTasks,
        next48Hours: upcomingTasks,
        aiReport: latestReport?.content,
        biggestRisk: await identifyBiggestRisk(input.companyId),
      };
    }),
});
```

---

## 前端架构

### Dashboard 页面

```typescript
// src/app/(dashboard)/dashboard/page.tsx

'use client';

import { api } from '@/lib/trpc/client';
import { DashboardHeader } from '@/components/dashboard/header';
import { AIReport } from '@/components/dashboard/ai-report';
import { TaskList } from '@/components/dashboard/task-list';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { RiskAlert } from '@/components/dashboard/risk-alert';

export default function DashboardPage() {
  const { data: dashboard, isLoading } = api.company.getDashboard.useQuery({
    companyId: 'xxx',
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DashboardHeader company={dashboard.company} />

      <AIReport content={dashboard.aiReport} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskList
          title="今日已完成"
          tasks={dashboard.todayCompleted}
          variant="completed"
        />
        <TaskList
          title="接下来 48 小时"
          tasks={dashboard.next48Hours}
          variant="upcoming"
        />
      </div>

      <RiskAlert risk={dashboard.biggestRisk} />

      <MetricsCards companyId={dashboard.company.id} />
    </div>
  );
}
```

### AI Report 组件

```typescript
// src/components/dashboard/ai-report.tsx

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AIReportProps {
  content: string;
}

export function AIReport({ content }: AIReportProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🤖</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">AI 主动汇报</h3>
          <div className={expanded ? '' : 'line-clamp-3'}>
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setExpanded(!expanded)} variant="outline">
              {expanded ? '收起' : '查看完整报告'}
            </Button>
            <Button variant="default">批准此方向</Button>
            <Button variant="ghost">提供反馈</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 状态管理

### Zustand Store

```typescript
// src/stores/company-store.ts

import { create } from 'zustand';
import { Company, Task, Agent } from '@prisma/client';

interface CompanyStore {
  currentCompany: Company | null;
  tasks: Task[];
  agents: Agent[];

  setCurrentCompany: (company: Company) => void;
  updateTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  currentCompany: null,
  tasks: [],
  agents: [],

  setCurrentCompany: (company) => set({ currentCompany: company }),

  updateTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task],
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  })),
}));
```

---

## 安全与性能

### Docker 沙盒隔离

```typescript
// src/lib/docker/sandbox.ts

import Docker from 'dockerode';

export class DockerSandbox {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  // 创建隔离容器
  async createContainer(companyId: string): Promise<string> {
    const container = await this.docker.createContainer({
      Image: 'ai-company-sandbox:latest',
      name: `company-${companyId}`,
      HostConfig: {
        Memory: 512 * 1024 * 1024, // 512MB
        CpuQuota: 50000, // 50% CPU
        NetworkMode: 'none', // 无网络访问
        ReadonlyRootfs: true, // 只读文件系统
      },
      Env: [
        `COMPANY_ID=${companyId}`,
      ],
    });

    await container.start();
    return container.id;
  }

  // 执行代码
  async executeCode(containerId: string, code: string): Promise<ExecutionResult> {
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ['node', '-e', code],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ Detach: false });

    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      stream.on('error', (err) => {
        error += err.toString();
      });

      stream.on('end', () => {
        resolve({ output, error, success: !error });
      });
    });
  }

  // 清理容器
  async cleanup(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop();
    await container.remove();
  }
}
```

### 输入验证

```typescript
// 所有 API 输入都使用 Zod 验证
import { z } from 'zod';

const createCompanySchema = z.object({
  targetAudience: z.string().min(1).max(500),
  explorationDays: z.number().int().min(7).max(90),
  successCriteria: z.string().min(1).max(500),
  weeklyHours: z.number().int().min(0).max(40),
  autoPublish: z.boolean(),
});

// Agent 配置验证
const agentConfigSchema = z.object({
  role: z.string(),
  name: z.string(),
  systemPrompt: z.string().min(10).max(5000),
  model: z.enum(['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022', 'gpt-4-turbo-preview']),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(100).max(4000),
  permissions: z.array(z.string()),
  tools: z.array(z.string()),
});
```

### 性能优化

```typescript
// 1. Convex 查询优化
const companies = await ctx.db
  .query("companies")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .take(10);

// 2. React Query 缓存
const { data } = api.company.getById.useQuery(
  { id: companyId },
  {
    staleTime: 5 * 60 * 1000, // 5 分钟
    cacheTime: 10 * 60 * 1000, // 10 分钟
  }
);

// 3. Next.js 图片优化
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>

// 4. Prompt Caching（减少 60-80% 成本）
const response = await llm.chat({
  systemPrompt: cachedSystemPrompt,
  messages: context,
  useCache: true, // 启用缓存
});

// 5. 模型分层（减少 40-60% 成本）
const model = complexity === 'simple'
  ? 'claude-3-haiku-20240307'  // $0.25/$1.25 per 1M tokens
  : 'claude-3-5-sonnet-20241022'; // $3/$15 per 1M tokens
```

---

## 环境变量（v0.2）

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Database (Drizzle ORM)
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI API Keys（用户提供）
OPENAI_API_KEY="<openai-api-key>"
ANTHROPIC_API_KEY="<anthropic-api-key>"

# 平台凭证（用户提供，可选）
VERCEL_TOKEN="..."
GITHUB_TOKEN="..."
STRIPE_SECRET_KEY="sk_test_..."

# Docker（自托管）
DOCKER_HOST="unix:///var/run/docker.sock"

# 可选：监控
SENTRY_DSN="..."  # 可选
```

---

## 下一步

### 开发顺序

1. **Week 1-2: 基础设施**
   - 初始化 Next.js 项目
   - 配置 Convex 数据库
   - 实现认证系统（NextAuth）
   - 搭建基础 UI（shadcn/ui）

2. **Week 3-4: AI Agent 系统**
   - 实现 Agent 基类和配置加载器
   - 创建 8 个默认 Agent 模板
   - 实现 LLM 路由器（模型分层）
   - 实现 Prompt Caching
   - 实现成本追踪器

3. **Week 5: 心跳机制**
   - 实现 Convex Cron Jobs
   - 实现心跳检查和唤醒逻辑
   - 实现 Agent 编排引擎
   - 测试心跳机制

4. **Week 6: 核心功能**
   - 实现公司创建向导
   - 实现 Mission Control 页面
   - 实现财务仪表板（AI API 成本）
   - 实现 Agent 配置管理

5. **Week 7: 部署准备**
   - Docker Compose 配置
   - 部署脚本
   - 环境变量配置
   - 文档完善

### 关键技术点

1. **Convex 集成**
   - 零配置、零成本
   - 内置 Cron Jobs
   - 内置向量搜索
   - 实时订阅

2. **成本优化**
   - Prompt Caching（节省 60-80%）
   - 模型分层（节省 40-60%）
   - 心跳机制（节省 50%）

3. **Agent 配置化**
   - 8 个默认模板
   - JSON 配置文件
   - 权限系统
   - 动态加载

4. **自托管部署**
   - Docker Compose 一键部署
   - 支持 DigitalOcean、Vultr、本地服务器
   - 完全控制成本和数据

---

## 总结

AI Company Builder v0.2 自托管版本的技术实现重点：

### 核心改进

1. **数据库**: Convex → Supabase + Drizzle ORM（开源、类型安全、零成本）
2. **Agent 系统**: 固定角色 → 默认模板 + JSON 配置
3. **运行机制**: 持续运行 → 心跳机制（定时 + 事件驱动）
4. **成本优化**: 无 → Prompt Caching + 模型分层 + 心跳间隔
5. **部署方式**: Vercel + Railway → 自托管（Docker Compose）

### 技术亮点

- **Supabase + Drizzle ORM**: 开源、类型安全、零成本、完整功能（Auth、Storage、Realtime）
- **Drizzle ORM**: 轻量级（~7KB）、类型安全、SQL-like API、零运行时开销
- **心跳机制**: 避免持续运行的高额 AI API 成本
- **Prompt Caching**: 减少 60-80% 的 AI API 成本
- **模型分层**: 根据任务复杂度自动选择最优模型
- **Agent 配置化**: 支持 JSON 配置文件自定义 Agent
- **成本追踪**: 实时追踪每个 Agent 的 AI API 成本
- **向量搜索**: 使用 pgvector 进行记忆检索

### 成本对比

| 版本 | 月度成本 | 说明 |
|------|---------|------|
| v0.1 Enhanced | $286-416 | 包含所有付费服务 |
| v0.2 自托管版 | $6-18 | 仅基础设施 + AI API |
| **节省** | **$268-410** | **节省 94-97%** |

### 开发周期

- v0.1: 9-10 周
- v0.2: 6-7 周（简化架构）

### 数据库优势

**Supabase + Drizzle ORM 的优势**：

1. **开源生态**: 基于 PostgreSQL，不被供应商锁定
2. **类型安全**: Drizzle 提供完整的 TypeScript 类型推导
3. **轻量级**: Drizzle 零依赖，打包体积仅 ~7KB
4. **完整功能**: Auth、Storage、Edge Functions、Realtime 一体化
5. **Row Level Security**: 数据库级别的权限控制
6. **向量搜索**: 原生支持 pgvector 扩展
7. **迁移管理**: Drizzle Kit 提供自动 migration 生成
8. **性能优越**: 无 ORM 抽象层开销，直接生成 SQL

---

**v0.2 自托管版 - 极低成本、完全控制、无限可能！** 🚀

---

## AI Agent 实现

### Agent 配置模板

v0.2 为 4 种公司类型提供预定义的 Agent 配置模板。每个模板包含该类型公司所需的核心 Agent。

#### 1. 营销公司 (MARKETING) Agent 模板

```typescript
// src/lib/agents/templates/marketing/ceo.ts

export const marketingCEOConfig = {
  role: "CEO",
  name: "CEO Bot",
  description: "营销公司的首席执行官，负责整体战略和决策",
  systemPrompt: `你是一家营销公司的 CEO。你的职责是：
1. 制定营销策略和目标
2. 协调各个 Agent 的工作
3. 分析市场数据和用户反馈
4. 做出关键决策（发布内容、调整策略等）
5. 监控营销效果和 ROI

你需要：
- 基于数据做决策，不是凭感觉
- 平衡短期效果和长期品牌建设
- 确保所有营销活动符合品牌定位
- 及时调整策略应对市场变化`,
  model: "claude-sonnet-4",
  temperature: 0.7,
  maxTokens: 2000,
  permissions: ["READ_ALL", "WRITE_DECISIONS", "EXECUTE_TASKS"],
  tools: ["web_search", "data_analysis", "decision_maker"],
  schedule: {
    type: "heartbeat",
    interval: 6, // 每 6 小时
  },
};

// src/lib/agents/templates/marketing/product-analyst.ts

export const productAnalystConfig = {
  role: "PRODUCT_ANALYST",
  name: "Product Analyst",
  description: "产品分析师，负责市场研究和竞品分析",
  systemPrompt: `你是一位产品分析师。你的职责是：
1. 研究目标市场和用户需求
2. 分析竞品的优劣势
3. 发现市场机会和痛点
4. 提供数据驱动的产品建议

你需要：
- 使用 Reddit、Twitter、Product Hunt 等平台收集信息
- 分析用户评论和反馈
- 识别市场趋势和机会
- 提供可执行的建议`,
  model: "claude-haiku-3.5",
  temperature: 0.5,
  maxTokens: 1500,
  permissions: ["READ_ALL", "WRITE_REPORTS"],
  tools: ["web_scraper", "reddit_api", "twitter_api", "data_analysis"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// src/lib/agents/templates/marketing/cmo.ts

export const cmoConfig = {
  role: "CMO",
  name: "CMO Bot",
  description: "首席营销官，负责营销策略和内容规划",
  systemPrompt: `你是首席营销官（CMO）。你的职责是：
1. 制定内容营销策略
2. 规划社交媒体发布计划
3. 优化营销渠道组合
4. 分析营销数据和效果

你需要：
- 基于 Product Analyst 的研究制定策略
- 平衡不同营销渠道的投入
- 确保内容质量和品牌一致性
- 持续优化营销 ROI`,
  model: "claude-sonnet-4",
  temperature: 0.7,
  maxTokens: 2000,
  permissions: ["READ_ALL", "WRITE_STRATEGY", "APPROVE_CONTENT"],
  tools: ["content_planner", "analytics", "ab_testing"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// 其他 Agent: Content Creator, Sales Manager, Customer Support
```

#### 2. 内容公司 (CONTENT) Agent 模板

```typescript
// src/lib/agents/templates/content/ceo.ts

export const contentCEOConfig = {
  role: "CEO",
  name: "CEO Bot",
  description: "内容公司的首席执行官",
  systemPrompt: `你是一家内容公司的 CEO。你的职责是：
1. 制定内容战略和主题方向
2. 协调内容创作团队
3. 分析内容表现和受众反馈
4. 决定内容发布计划和渠道

你需要：
- 确保内容质量和价值
- 平衡 SEO 优化和用户体验
- 建立内容品牌和影响力
- 持续优化内容策略`,
  model: "claude-sonnet-4",
  temperature: 0.7,
  maxTokens: 2000,
  permissions: ["READ_ALL", "WRITE_DECISIONS", "EXECUTE_TASKS"],
  tools: ["web_search", "content_analytics", "decision_maker"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// src/lib/agents/templates/content/content-strategist.ts

export const contentStrategistConfig = {
  role: "CONTENT_STRATEGIST",
  name: "Content Strategist",
  description: "内容策略师，负责主题研究和内容规划",
  systemPrompt: `你是内容策略师。你的职责是：
1. 研究热门话题和趋势
2. 分析受众兴趣和需求
3. 规划内容日历和主题
4. 优化 SEO 关键词策略

你需要：
- 使用 Google Trends、Reddit、Twitter 发现热点
- 分析竞品内容表现
- 提供数据驱动的主题建议
- 确保内容符合 SEO 最佳实践`,
  model: "claude-haiku-3.5",
  temperature: 0.6,
  maxTokens: 1500,
  permissions: ["READ_ALL", "WRITE_REPORTS"],
  tools: ["web_search", "seo_analyzer", "trend_tracker"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// 其他 Agent: Writer, Editor, SEO Specialist
```

#### 3. 客服公司 (CUSTOMER_SERVICE) Agent 模板

```typescript
// src/lib/agents/templates/customer-service/ceo.ts

export const customerServiceCEOConfig = {
  role: "CEO",
  name: "CEO Bot",
  description: "客服公司的首席执行官",
  systemPrompt: `你是一家客服公司的 CEO。你的职责是：
1. 制定客户服务策略和标准
2. 协调客服团队工作
3. 分析客户满意度和服务质量
4. 优化客服流程和效率

你需要：
- 确保客户问题得到及时解决
- 平衡服务质量和成本
- 建立知识库和自动化流程
- 持续提升客户满意度`,
  model: "claude-sonnet-4",
  temperature: 0.7,
  maxTokens: 2000,
  permissions: ["READ_ALL", "WRITE_DECISIONS", "EXECUTE_TASKS"],
  tools: ["ticket_manager", "analytics", "decision_maker"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// src/lib/agents/templates/customer-service/support-lead.ts

export const supportLeadConfig = {
  role: "SUPPORT_LEAD",
  name: "Support Lead",
  description: "客服主管，负责工单分配和质量监控",
  systemPrompt: `你是客服主管。你的职责是：
1. 分配工单给合适的处理人员
2. 监控工单处理进度和质量
3. 识别常见问题和改进机会
4. 培训和指导客服团队

你需要：
- 根据工单优先级和复杂度分配
- 确保 SLA 达标
- 识别需要升级的问题
- 持续优化客服流程`,
  model: "claude-haiku-3.5",
  temperature: 0.5,
  maxTokens: 1500,
  permissions: ["READ_ALL", "WRITE_ASSIGNMENTS"],
  tools: ["ticket_manager", "priority_analyzer"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// 其他 Agent: Ticket Handler, KB Manager
```

#### 4. 开发公司 (DEVELOPMENT) Agent 模板

```typescript
// src/lib/agents/templates/development/ceo.ts

export const developmentCEOConfig = {
  role: "CEO",
  name: "CEO Bot",
  description: "开发公司的首席执行官",
  systemPrompt: `你是一家开发公司的 CEO。你的职责是：
1. 制定产品开发路线图
2. 协调开发团队工作
3. 分析项目进度和质量
4. 决定技术栈和架构方向

你需要：
- 平衡功能开发和技术债务
- 确保代码质量和测试覆盖
- 优化开发流程和效率
- 及时交付高质量产品`,
  model: "claude-sonnet-4",
  temperature: 0.7,
  maxTokens: 2000,
  permissions: ["READ_ALL", "WRITE_DECISIONS", "EXECUTE_TASKS"],
  tools: ["github_api", "code_analyzer", "decision_maker"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// src/lib/agents/templates/development/tech-lead.ts

export const techLeadConfig = {
  role: "TECH_LEAD",
  name: "Tech Lead",
  description: "技术负责人，负责架构设计和代码审查",
  systemPrompt: `你是技术负责人。你的职责是：
1. 设计系统架构和技术方案
2. 审查代码质量和最佳实践
3. 指导开发团队技术决策
4. 优化性能和可维护性

你需要：
- 确保架构可扩展和可维护
- 进行代码审查和技术指导
- 识别技术风险和改进机会
- 推动技术最佳实践`,
  model: "claude-sonnet-4",
  temperature: 0.6,
  maxTokens: 2000,
  permissions: ["READ_ALL", "WRITE_CODE_REVIEWS"],
  tools: ["github_api", "code_analyzer", "architecture_planner"],
  schedule: {
    type: "heartbeat",
    interval: 6,
  },
};

// 其他 Agent: Engineer, QA Engineer, DevOps
```

### AI Agent Generator

AI Agent Generator 可以根据用户需求动态生成 Agent 配置：

```typescript
// src/lib/agents/generator.ts

import { llmRouter } from '../llm/router';

export class AgentGenerator {
  /**
   * 根据用户需求动态生成 Agent 配置
   */
  async generateAgents(
    companyType: "MARKETING" | "CONTENT" | "CUSTOMER_SERVICE" | "DEVELOPMENT",
    userRequirements: string,
    productInfo?: string
  ): Promise<AgentConfig[]> {
    const systemPrompt = `你是一个 AI Agent 配置生成器。
根据用户的公司类型和需求，生成合适的 Agent 配置。

公司类型：${companyType}
用户需求：${userRequirements}
${productInfo ? `产品信息：${productInfo}` : ''}

请生成 4-6 个 Agent 的配置，每个 Agent 应该有：
1. role: Agent 角色名称（英文，大写下划线格式）
2. name: Agent 显示名称（中文）
3. description: Agent 职责描述
4. systemPrompt: Agent 的系统提示词（详细描述职责和工作方式）
5. model: 使用的 AI 模型（根据复杂度选择 claude-haiku-3.5 或 claude-sonnet-4）
6. temperature: 温度参数（0-1）
7. maxTokens: 最大 token 数
8. permissions: 权限列表
9. tools: 可用工具列表
10. schedule: 执行计划

返回 JSON 数组格式。`;

    const response = await llmRouter.chat({
      model: 'gpt-4-turbo',
      systemPrompt,
      messages: [
        {
          role: 'user',
          content: `请为这个${this.getCompanyTypeLabel(companyType)}公司生成 Agent 配置。`,
        },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    // 解析 AI 生成的配置
    const configs = JSON.parse(response.content);

    // 验证和规范化配置
    return configs.map((config: any) => this.validateAndNormalize(config));
  }

  private getCompanyTypeLabel(type: string): string {
    const labels = {
      MARKETING: '营销',
      CONTENT: '内容',
      CUSTOMER_SERVICE: '客服',
      DEVELOPMENT: '开发',
    };
    return labels[type] || type;
  }

  private validateAndNormalize(config: any): AgentConfig {
    // 验证必填字段
    if (!config.role || !config.name || !config.systemPrompt) {
      throw new Error('Invalid agent configuration');
    }

    // 规范化模型选择
    if (!['claude-haiku-3.5', 'claude-sonnet-4', 'gpt-4-turbo'].includes(config.model)) {
      config.model = 'claude-sonnet-4'; // 默认模型
    }

    // 规范化温度参数
    if (config.temperature < 0 || config.temperature > 1) {
      config.temperature = 0.7;
    }

    return config as AgentConfig;
  }
}

interface AgentConfig {
  role: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  permissions: string[];
  tools: string[];
  schedule: {
    type: string;
    interval: number;
  };
}
```

---

## 数据库集成

### Supabase + Drizzle ORM

v0.2 使用 **Supabase** 作为数据库，并通过 **Drizzle ORM** 进行类型安全的数据库操作。

#### 为什么选择 Drizzle ORM？

1. **类型安全**：完整的 TypeScript 类型推导，编译时检查错误
2. **轻量级**：零依赖，打包体积仅 ~7KB，无运行时开销
3. **SQL-like API**：接近原生 SQL 的查询语法，易于学习
4. **性能优越**：直接生成 SQL，无 ORM 抽象层开销
5. **迁移管理**：内置 migration 工具，支持自动生成
6. **与 Supabase 完美集成**：原生支持 PostgreSQL 和 pgvector

#### Drizzle 客户端配置

```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
export type Database = typeof db;
```

#### 基础 CRUD 操作示例

```typescript
import { db } from '@/lib/db/client';
import { companies, agents, tasks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// 创建公司
const newCompany = await db.insert(companies).values({
  userId: user.id,
  name: 'My AI Company',
  type: 'marketing',
  status: 'planning',
  config: {
    monthlyBudget: 100,
    weeklyHours: 10,
    autoPublish: true,
  },
}).returning();

// 查询用户的所有公司
const userCompanies = await db
  .select()
  .from(companies)
  .where(eq(companies.userId, user.id))
  .orderBy(desc(companies.createdAt));

// 更新公司状态
await db
  .update(companies)
  .set({ status: 'active', updatedAt: new Date() })
  .where(eq(companies.id, companyId));

// 关联查询：公司及其 Agents
const companyWithAgents = await db.query.companies.findFirst({
  where: eq(companies.id, companyId),
  with: {
    agents: true,
    tasks: {
      where: eq(tasks.status, 'pending'),
      limit: 10,
    },
  },
});
```

#### 向量搜索示例（记忆检索）

```typescript
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

// 使用 pgvector 进行相似度搜索
const similarMemories = await db.execute(sql`
  SELECT
    id,
    company_id,
    type,
    content,
    importance,
    metadata,
    1 - (embedding <=> ${embedding}::vector) as similarity
  FROM memories
  WHERE company_id = ${companyId}
    AND 1 - (embedding <=> ${embedding}::vector) > 0.7
  ORDER BY similarity DESC
  LIMIT 5
`);
```

#### 事务处理示例

```typescript
// 创建公司和初始化 Agents（事务）
await db.transaction(async (tx) => {
  // 1. 创建公司
  const [company] = await tx.insert(companies).values({
    userId: user.id,
    name: 'My AI Company',
    type: 'marketing',
    status: 'initializing',
  }).returning();

  // 2. 创建默认 Agents
  const defaultAgents = [
    { role: 'CEO', name: 'CEO Bot', model: 'claude-sonnet-4' },
    { role: 'CMO', name: 'CMO Bot', model: 'claude-sonnet-4' },
    { role: 'CONTENT_CREATOR', name: 'Content Creator', model: 'claude-haiku-3.5' },
  ];

  for (const agent of defaultAgents) {
    await tx.insert(agents).values({
      companyId: company.id,
      ...agent,
      systemPrompt: getDefaultSystemPrompt(agent.role),
      status: 'idle',
      temperature: 0.7,
      maxTokens: 2000,
    });
  }

  // 3. 创建初始任务
  await tx.insert(tasks).values({
    companyId: company.id,
    title: 'Initialize company',
    description: 'Set up company infrastructure',
    status: 'pending',
    priority: 'high',
  });
});
```

#### 成本追踪示例

```typescript
import { db } from '@/lib/db/client';
import { financialRecords } from '@/lib/db/schema';
import { eq, sum, sql } from 'drizzle-orm';

// 记录 AI API 成本
await db.insert(financialRecords).values({
  companyId,
  agentId,
  provider: 'anthropic',
  model: 'claude-sonnet-4',
  promptTokens: 1000,
  completionTokens: 500,
  totalTokens: 1500,
  cost: 0.0045, // $0.0045
  currency: 'USD',
  taskId,
  description: 'CEO decision making',
});

// 查询总成本
const totalCost = await db
  .select({ total: sum(financialRecords.cost) })
  .from(financialRecords)
  .where(eq(financialRecords.companyId, companyId));

// 按 Agent 分组统计成本
const costByAgent = await db
  .select({
    agentId: financialRecords.agentId,
    totalCost: sum(financialRecords.cost),
    totalTokens: sum(financialRecords.totalTokens),
  })
  .from(financialRecords)
  .where(eq(financialRecords.companyId, companyId))
  .groupBy(financialRecords.agentId);
```

#### 心跳机制查询示例

```typescript
import { db } from '@/lib/db/client';
import { companies, heartbeats } from '@/lib/db/schema';
import { eq, lte, and } from 'drizzle-orm';

// 查询需要唤醒的公司
const now = new Date();
const companiesToWake = await db
  .select()
  .from(companies)
  .innerJoin(heartbeats, eq(heartbeats.companyId, companies.id))
  .where(
    and(
      eq(companies.status, 'active'),
      lte(heartbeats.nextBeat, now)
    )
  );

// 更新心跳时间
for (const { companies: company, heartbeats: heartbeat } of companiesToWake) {
  const nextBeat = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours later

  await db.update(heartbeats).set({
    lastBeat: now,
    nextBeat,
  }).where(eq(heartbeats.id, heartbeat.id));
}
```

#### 完整的 Schema 定义

详细的 Drizzle Schema 定义请参考 `drizzle-schema.md` 文档，包括：

- **profiles**: 用户资料表
- **companies**: 公司表
- **agents**: Agent 配置表
- **discussions**: 讨论表
- **messages**: 消息表
- **memories**: 记忆表（支持向量搜索）
- **tasks**: 任务表
- **heartbeats**: 心跳表
- **financialRecords**: 财务记录表



---

## Convex 集成（已迁移到 Supabase + Drizzle）

> **注意**：v0.2 已从 Convex 迁移到 Supabase + Drizzle ORM。以下 Convex 代码仅供参考。

### Convex Schema（已废弃）

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  companies: defineTable({
    userId: v.id("users"),
    name: v.string(),
    mission: v.string(),
    type: v.union(
      v.literal("MARKETING"),
      v.literal("CONTENT"),
      v.literal("CUSTOMER_SERVICE"),
      v.literal("DEVELOPMENT")
    ),
    status: v.union(
      v.literal("INITIALIZING"),
      v.literal("ACTIVE"),
      v.literal("PAUSED"),
      v.literal("COMPLETED"),
      v.literal("ARCHIVED")
    ),
    currentPhase: v.union(
      v.literal("IDEA_DISCOVERY"),
      v.literal("OPPORTUNITY_EVALUATION"),
      v.literal("MVP_DEFINITION"),
      v.literal("BUILDING"),
      v.literal("PROMOTION"),
      v.literal("REVENUE_ATTEMPT")
    ),

    // 心跳机制
    lastHeartbeat: v.optional(v.number()),
    nextHeartbeat: v.optional(v.number()),
    heartbeatInterval: v.number(), // 小时

    // 配置（根据公司类型不同）
    config: v.object({
      // 营销公司配置
      marketingGoal: v.optional(v.union(
        v.literal("exposure"),
        v.literal("users"),
        v.literal("revenue")
      )),
      // 内容公司配置
      contentType: v.optional(v.array(v.string())), // ["blog", "video", "podcast"]
      // 客服公司配置
      supportChannels: v.optional(v.array(v.string())), // ["email", "chat", "phone"]
      // 开发公司配置
      techStack: v.optional(v.array(v.string())), // ["react", "node", "python"]

      // 通用配置
      monthlyBudget: v.number(),
      weeklyHours: v.number(),
      autoPublish: v.boolean(),
    }),

    // OpenClaw 容器信息
    containerId: v.optional(v.string()),
    containerStatus: v.optional(v.union(
      v.literal("CREATING"),
      v.literal("RUNNING"),
      v.literal("STOPPED"),
      v.literal("ERROR")
    )),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_next_heartbeat", ["nextHeartbeat"]),

  agents: defineTable({
    companyId: v.id("companies"),
    role: v.string(),
    name: v.string(),
    systemPrompt: v.string(),
    status: v.union(
      v.literal("IDLE"),
      v.literal("WORKING"),
      v.literal("BLOCKED"),
      v.literal("COMPLETED")
    ),

    // 配置来源
    configSource: v.union(
      v.literal("DEFAULT_TEMPLATE"),
      v.literal("CUSTOM_JSON")
    ),
    configPath: v.optional(v.string()),

    // 权限
    permissions: v.array(v.string()),

    // AI 模型配置
    model: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_role", ["companyId", "role"]),

  financialRecords: defineTable({
    companyId: v.id("companies"),
    agentId: v.optional(v.id("agents")),

    provider: v.union(v.literal("OPENAI"), v.literal("ANTHROPIC")),
    model: v.string(),

    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),

    cost: v.number(),
    currency: v.string(),

    taskId: v.optional(v.id("tasks")),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),

    recordedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_agent", ["agentId"])
    .index("by_recorded_at", ["recordedAt"]),
});
```

### Convex 查询和变更

```typescript
// convex/companies.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 创建公司
export const create = mutation({
  args: {
    type: v.union(
      v.literal("MARKETING"),
      v.literal("CONTENT"),
      v.literal("CUSTOMER_SERVICE"),
      v.literal("DEVELOPMENT")
    ),
    targetAudience: v.string(),
    explorationDays: v.number(),
    successCriteria: v.string(),
    weeklyHours: v.number(),
    autoPublish: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const userId = identity.subject;
    const now = Date.now();

    // 创建公司（type 从用户选择传入）
    const companyId = await ctx.db.insert("companies", {
      userId,
      name: "AI Company", // 待生成
      mission: "", // 待生成
      type: args.type, // "MARKETING" | "CONTENT" | "CUSTOMER_SERVICE" | "DEVELOPMENT"
      status: "INITIALIZING",
      currentPhase: "IDEA_DISCOVERY",
      ...args,
      heartbeatInterval: 6, // 默认 6 小时
      nextHeartbeat: now + 6 * 60 * 60 * 1000,
      createdAt: now,
      updatedAt: now,
    });

    // 初始化 8 个默认 Agent
    await initializeDefaultAgents(ctx, companyId);

    return companyId;
  },
});

// 获取公司详情
export const getById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, { id }) => {
    const company = await ctx.db.get(id);
    if (!company) return null;

    // 获取 Agents
    const agents = await ctx.db
      .query("agents")
      .withIndex("by_company", (q) => q.eq("companyId", id))
      .collect();

    // 获取最近任务
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_company", (q) => q.eq("companyId", id))
      .order("desc")
      .take(10);

    return { ...company, agents, tasks };
  },
});

// 初始化默认 Agents
async function initializeDefaultAgents(ctx: any, companyId: Id<"companies">) {
  const defaultAgents = [
    { role: "CEO", name: "CEO Bot", model: "claude-3-5-sonnet" },
    { role: "MARKET_RESEARCH", name: "Market Research Bot", model: "claude-3-haiku" },
    { role: "PRODUCT_MANAGER", name: "PM Bot", model: "claude-3-5-sonnet" },
    { role: "SOFTWARE_ENGINEER", name: "Engineer Bot", model: "claude-3-5-sonnet" },
    { role: "CFO", name: "CFO Bot", model: "claude-3-haiku" },
    { role: "GROWTH", name: "Growth Bot", model: "claude-3-haiku" },
    { role: "LAUNCH_MANAGER", name: "Launch Manager Bot", model: "claude-3-haiku" },
    { role: "OPS", name: "Ops Bot", model: "claude-3-haiku" },
  ];

  const now = Date.now();

  for (const agent of defaultAgents) {
    await ctx.db.insert("agents", {
      companyId,
      ...agent,
      systemPrompt: getDefaultSystemPrompt(agent.role),
      status: "IDLE",
      configSource: "DEFAULT_TEMPLATE",
      permissions: getDefaultPermissions(agent.role),
      temperature: 0.7,
      maxTokens: 2000,
      createdAt: now,
      updatedAt: now,
    });
  }
}
```

---

## 心跳机制实现

### Cron Jobs

```typescript
// convex/crons.ts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 每小时检查一次需要唤醒的公司
crons.interval(
  "check company heartbeats",
  { hours: 1 },
  internal.heartbeat.checkAndWake
);

export default crons;
```

### 心跳检查和唤醒

```typescript
// convex/heartbeat.ts

import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// 检查并唤醒需要运行的公司
export const checkAndWake = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // 查询所有需要唤醒的公司
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_next_heartbeat")
      .filter((q) => q.lte(q.field("nextHeartbeat"), now))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .collect();

    console.log(`[Heartbeat] Found ${companies.length} companies to wake up`);

    // 为每个公司触发心跳
    for (const company of companies) {
      // 调度心跳执行
      await ctx.scheduler.runAfter(0, internal.heartbeat.runHeartbeat, {
        companyId: company._id,
      });

      // 更新下次心跳时间
      const nextHeartbeat = now + company.heartbeatInterval * 60 * 60 * 1000;
      await ctx.db.patch(company._id, {
        lastHeartbeat: now,
        nextHeartbeat,
        updatedAt: now,
      });
    }

    return { wokenCompanies: companies.length };
  },
});

// 执行单个公司的心跳
export const runHeartbeat = internalAction({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    console.log(`[Heartbeat] Running heartbeat for company ${companyId}`);

    try {
      // 1. 加载公司上下文
      const company = await ctx.runQuery(internal.companies.getById, {
        id: companyId,
      });

      if (!company) {
        console.error(`[Heartbeat] Company ${companyId} not found`);
        return;
      }

      // 2. 加载最近记忆
      const memories = await ctx.runQuery(internal.memories.getRecent, {
        companyId,
        limit: 50,
      });

      // 3. CEO Agent 分析当前阶段
      const ceoAgent = company.agents.find((a) => a.role === "CEO");
      if (!ceoAgent) {
        console.error(`[Heartbeat] CEO Agent not found for company ${companyId}`);
        return;
      }

      // 4. 执行 Agent 编排（调用外部 AI API）
      const orchestrationResult = await orchestrateAgents({
        company,
        ceoAgent,
        memories,
      });

      // 5. 保存结果到数据库
      await ctx.runMutation(internal.reports.create, {
        companyId,
        type: "HEARTBEAT",
        content: orchestrationResult.report,
        metadata: orchestrationResult.metadata,
      });

      // 6. 如果有决策请求，通知用户
      if (orchestrationResult.requiresUserInput) {
        await ctx.runMutation(internal.decisions.create, {
          companyId,
          question: orchestrationResult.question,
          options: orchestrationResult.options,
          context: orchestrationResult.context,
        });
      }

      console.log(`[Heartbeat] Completed heartbeat for company ${companyId}`);
    } catch (error) {
      console.error(`[Heartbeat] Error running heartbeat for company ${companyId}:`, error);
    }
  },
});

// Agent 编排逻辑（调用外部 AI API）
async function orchestrateAgents(context: any) {
  // 这里调用外部 AI API（OpenAI/Anthropic）
  // 实现 Agent 编排逻辑
  // 返回编排结果
  return {
    report: "AI 生成的报告内容",
    metadata: {},
    requiresUserInput: false,
  };
}
```

---

## 成本优化实现

### LLM 路由器（模型分层）

```typescript
// src/lib/llm/router.ts

import { OpenAIService } from './openai';
import { AnthropicService } from './anthropic';
import { PromptCache } from './cache';

export class LLMRouter {
  private openai: OpenAIService;
  private anthropic: AnthropicService;
  private cache: PromptCache;

  constructor(defaultModel: string) {
    this.openai = new OpenAIService();
    this.anthropic = new AnthropicService();
    this.cache = new PromptCache();
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    // 1. 检查缓存
    if (options.useCache) {
      const cacheKey = this.cache.generateKey(options);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          usage: { ...cached.usage, cached: true },
        };
      }
    }

    // 2. 根据任务复杂度选择模型
    const { provider, model } = this.selectModel(options);

    // 3. 调用相应的 LLM 服务
    let response: ChatResponse;
    if (provider === 'openai') {
      response = await this.openai.chat({ ...options, model });
    } else {
      response = await this.anthropic.chat({ ...options, model });
    }

    // 4. 缓存结果
    if (options.useCache) {
      const cacheKey = this.cache.generateKey(options);
      await this.cache.set(cacheKey, response);
    }

    return response;
  }

  // 模型选择策略（分层）
  private selectModel(options: ChatOptions): { provider: string; model: string } {
    const complexity = this.estimateComplexity(options);

    if (complexity === 'simple') {
      // 简单任务：使用 Claude 3 Haiku（最便宜）
      return { provider: 'anthropic', model: 'claude-3-haiku-20240307' };
    } else if (complexity === 'medium') {
      // 中等任务：使用 Claude 3.5 Sonnet
      return { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' };
    } else {
      // 复杂任务：使用 GPT-4 Turbo
      return { provider: 'openai', model: 'gpt-4-turbo-preview' };
    }
  }

  // 估算任务复杂度
  private estimateComplexity(options: ChatOptions): 'simple' | 'medium' | 'complex' {
    const { messages, tools } = options;

    // 简单规则：
    // - 有工具调用 = 复杂
    // - 消息长度 > 5 = 中等
    // - 其他 = 简单

    if (tools && tools.length > 0) {
      return 'complex';
    }

    if (messages.length > 5) {
      return 'medium';
    }

    return 'simple';
  }
}
```

### Prompt Caching

```typescript
// src/lib/llm/cache.ts

import { createHash } from 'crypto';

export class PromptCache {
  private cache: Map<string, CachedResponse> = new Map();
  private ttl: number = 60 * 60 * 1000; // 1 小时

  // 生成缓存键
  generateKey(options: ChatOptions): string {
    const content = JSON.stringify({
      systemPrompt: options.systemPrompt,
      messages: options.messages.slice(0, -1), // 排除最后一条消息
    });

    return createHash('sha256').update(content).digest('hex');
  }

  // 获取缓存
  async get(key: string): Promise<ChatResponse | null> {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  // 设置缓存
  async set(key: string, response: ChatResponse): Promise<void> {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

interface CachedResponse {
  response: ChatResponse;
  timestamp: number;
}
```

### 成本追踪器

```typescript
// src/lib/cost/tracker.ts

import { api } from '@/convex/_generated/api';

export class CostTracker {
  constructor(
    private companyId: string,
    private agentId: string
  ) {}

  async track(usage: UsageData): Promise<void> {
    // 计算成本
    const cost = this.calculateCost(usage);

    // 保存到 Convex
    await fetch('/api/convex', {
      method: 'POST',
      body: JSON.stringify({
        path: 'financial:trackCost',
        args: {
          companyId: this.companyId,
          agentId: this.agentId,
          provider: usage.provider,
          model: usage.model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          cost,
          taskId: usage.taskId,
          cached: usage.cached,
        },
      }),
    });
  }

  // 计算成本
  private calculateCost(usage: UsageData): number {
    const pricing = this.getPricing(usage.provider, usage.model);

    const promptCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const completionCost = (usage.completionTokens / 1_000_000) * pricing.output;

    // 如果使用了缓存，输入成本减少 90%
    const finalPromptCost = usage.cached ? promptCost * 0.1 : promptCost;

    return finalPromptCost + completionCost;
  }

  // 获取定价
  private getPricing(provider: string, model: string): { input: number; output: number } {
    const pricingTable: Record<string, { input: number; output: number }> = {
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'gpt-4-turbo-preview': { input: 10, output: 30 },
    };

    return pricingTable[model] || { input: 0, output: 0 };
  }
}

interface UsageData {
  provider: 'OPENAI' | 'ANTHROPIC';
  model: string;
  promptTokens: number;
  completionTokens: number;
  taskId?: string;
  cached?: boolean;
}
```

---

## API 设计（tRPC + Convex）

### tRPC Routers

v0.2 使用 tRPC 提供类型安全的 API，主要路由包括：

#### 1. Company Router

```typescript
// src/server/api/routers/company.ts

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { api } from '@/convex/_generated/api';

export const companyRouter = createTRPCRouter({
  // 创建公司
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(['MARKETING', 'CONTENT', 'CUSTOMER_SERVICE', 'DEVELOPMENT']),
        targetAudience: z.string(),
        explorationDays: z.number(),
        successCriteria: z.string(),
        weeklyHours: z.number(),
        autoPublish: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = await ctx.convex.mutation(api.companies.create, input);
      return { companyId };
    }),

  // 获取公司详情
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.convex.query(api.companies.getById, { id: input.id });
      return company;
    }),

  // 更新公司状态
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.convex.mutation(api.companies.updateStatus, input);
      return { success: true };
    }),
});
```

#### 2. Agent Router

```typescript
// src/server/api/routers/agent.ts

export const agentRouter = createTRPCRouter({
  // 获取公司的所有 Agent
  getByCompany: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const agents = await ctx.convex.query(api.agents.getByCompany, {
        companyId: input.companyId,
      });
      return agents;
    }),

  // 更新 Agent 配置
  updateConfig: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        config: z.object({
          systemPrompt: z.string().optional(),
          model: z.string().optional(),
          temperature: z.number().optional(),
          maxTokens: z.number().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.convex.mutation(api.agents.updateConfig, input);
      return { success: true };
    }),

  // 生成 Agent 配置（AI 动态生成）
  generate: protectedProcedure
    .input(
      z.object({
        companyType: z.enum(['MARKETING', 'CONTENT', 'CUSTOMER_SERVICE', 'DEVELOPMENT']),
        userRequirements: z.string(),
        productInfo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const generator = new AgentGenerator();
      const configs = await generator.generateAgents(
        input.companyType,
        input.userRequirements,
        input.productInfo
      );
      return { configs };
    }),
});
```

#### 3. Cost Router

```typescript
// src/server/api/routers/cost.ts

export const costRouter = createTRPCRouter({
  // 获取总成本
  getTotalCost: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.convex.query(api.costs.getTotalCost, input);
      return result;
    }),

  // 按 Agent 获取成本
  getCostByAgent: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.convex.query(api.costs.getCostByAgent, input);
      return result;
    }),

  // 按模型获取成本
  getCostByModel: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.convex.query(api.costs.getCostByModel, input);
      return result;
    }),
});
```

#### 4. Platform Router

```typescript
// src/server/api/routers/platform.ts

export const platformRouter = createTRPCRouter({
  // 连接平台（OAuth）
  connect: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platform: z.string(),
        credentials: z.record(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.convex.mutation(api.platforms.connect, input);
      return { success: true };
    }),

  // 获取平台连接状态
  getConnections: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const connections = await ctx.convex.query(api.platforms.getConnections, {
        companyId: input.companyId,
      });
      return connections;
    }),

  // 断开平台连接
  disconnect: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        platform: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.convex.mutation(api.platforms.disconnect, input);
      return { success: true };
    }),
});
```

### Root Router

```typescript
// src/server/api/root.ts

import { createTRPCRouter } from './trpc';
import { companyRouter } from './routers/company';
import { agentRouter } from './routers/agent';
import { costRouter } from './routers/cost';
import { platformRouter } from './routers/platform';

export const appRouter = createTRPCRouter({
  company: companyRouter,
  agent: agentRouter,
  cost: costRouter,
  platform: platformRouter,
});

export type AppRouter = typeof appRouter;
```

---

**技术实现规格完成！开始构建您的 AI 公司吧！** 🚀
