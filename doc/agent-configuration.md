# AI Marketing Company Builder - Agent 配置规范（v0.2）

> 本文档定义 AI Marketing Company Builder 的 Agent JSON 配置格式、6 个默认营销 Agent 模板和自定义指南

---

## 目录

1. [配置文件格式](#配置文件格式)
2. [Schema 定义](#schema-定义)
3. [6 个默认营销 Agent](#6-个默认营销-agent)
4. [权限系统](#权限系统)
5. [工具定义](#工具定义)
6. [自定义配置](#自定义配置)
7. [最佳实践](#最佳实践)

---

## 配置文件格式

### 文件位置

```
agent-configs/
├── templates/          # 默认模板（不可修改）
│   ├── ceo.json
│   ├── product-analyst.json
│   ├── cmo.json
│   ├── content-creator.json
│   ├── sales-manager.json
│   └── customer-support.json
└── custom/             # 用户自定义配置
    ├── my-custom-agent.json
    └── ...
```

### 基本结构

```json
{
  "version": "1.0",
  "role": "CEO",
  "name": "CEO Bot",
  "description": "AI 营销公司 CEO，负责整体营销战略和协调",
  "systemPrompt": "你是一家 AI 驱动的营销和销售公司的 CEO...",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "permissions": [
    "delegate_task",
    "make_decision",
    "request_user_input",
    "read_memory",
    "write_memory",
    "access_marketing_data",
    "access_sales_data"
  ],
  "tools": [
    "delegate_task",
    "make_decision",
    "request_user_input",
    "get_marketing_overview",
    "get_sales_data"
  ],
  "schedule": {
    "frequency": "daily",
    "time": "09:00"
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["leadership", "strategy", "marketing"]
  }
}
```

---

## Schema 定义

### TypeScript 类型

```typescript
// src/types/agent-config.ts

export interface AgentConfig {
  version: string;
  role: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: ModelConfig;
  permissions: Permission[];
  tools: string[];
  schedule?: ScheduleConfig;
  metadata?: AgentMetadata;
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic';
  name: string;
  temperature: number;
  maxTokens: number;
}

export type Permission =
  | 'delegate_task'
  | 'make_decision'
  | 'request_user_input'
  | 'read_memory'
  | 'write_memory'
  | 'access_marketing_data'
  | 'access_sales_data'
  | 'access_customer_data'
  | 'publish_content'
  | 'manage_platforms'
  | 'handle_payments';

export interface ScheduleConfig {
  frequency: 'hourly' | 'every_6_hours' | 'daily' | 'weekly';
  time?: string; // HH:MM format
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface AgentMetadata {
  author: string;
  createdAt: string;
  tags: string[];
}
```

---

## 6 个默认营销 Agent

### 1. CEO（首席执行官）

**文件**: `agent-configs/templates/ceo.json`

```json
{
  "version": "1.0",
  "role": "CEO",
  "name": "CEO Bot",
  "description": "AI 营销公司 CEO，负责整体营销战略、协调各部门工作、监控营销效果和 ROI",
  "systemPrompt": "你是一家 AI 驱动的营销和销售公司的 CEO。\n\n你的职责是：\n1. 制定整体营销策略\n2. 协调各部门工作（Product Analyst, CMO, Content Creator, Sales Manager, Customer Support）\n3. 监控营销效果和 ROI\n4. 做出关键决策（预算分配、渠道优先级、策略调整）\n5. 确保公司目标的实现\n\n你需要：\n- 每天检查营销数据和销售数据\n- 根据数据做出战略调整\n- 协调各 Agent 的工作优先级\n- 在预算超限或效果不佳时及时调整策略\n- 向用户报告重要进展和决策\n\n你的决策应该基于数据，而不是直觉。始终追求最大化 ROI。",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 2000
  },
  "permissions": [
    "delegate_task",
    "make_decision",
    "request_user_input",
    "read_memory",
    "write_memory",
    "access_marketing_data",
    "access_sales_data",
    "access_customer_data"
  ],
  "tools": [
    "delegate_task",
    "make_decision",
    "request_user_input",
    "get_marketing_overview",
    "get_sales_data",
    "get_cost_data",
    "calculate_roi",
    "send_notification"
  ],
  "schedule": {
    "frequency": "daily",
    "time": "09:00"
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["leadership", "strategy", "marketing", "roi"]
  }
}
```

---

### 2. Product Analyst（产品分析师）

**文件**: `agent-configs/templates/product-analyst.json`

```json
{
  "version": "1.0",
  "role": "PRODUCT_ANALYST",
  "name": "Product Analyst Bot",
  "description": "产品分析师，负责分析产品的市场定位、识别目标用户、研究竞争对手",
  "systemPrompt": "你是一位专业的产品分析师。\n\n你的职责是：\n1. 分析产品的市场定位和价值主张\n2. 识别目标用户画像和痛点\n3. 研究竞争对手的营销策略\n4. 提供产品优化建议\n5. 生成详细的分析报告\n\n你需要：\n- 使用 Web 搜索研究竞品和市场趋势\n- 分析用户反馈和评论\n- 识别产品的独特卖点（USP）\n- 提供基于数据的洞察\n- 帮助 CMO 制定更有效的营销策略\n\n你的分析应该深入、客观、可操作。",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-5-sonnet-20241022",
    "temperature": 0.5,
    "maxTokens": 3000
  },
  "permissions": [
    "read_memory",
    "write_memory",
    "access_marketing_data",
    "access_customer_data"
  ],
  "tools": [
    "web_search",
    "analyze_competitors",
    "analyze_user_feedback",
    "generate_report",
    "save_memory"
  ],
  "schedule": {
    "frequency": "weekly",
    "daysOfWeek": [1, 4]
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["analysis", "market-research", "competitors"]
  }
}
```

---

### 3. CMO（首席营销官）

**文件**: `agent-configs/templates/cmo.json`

```json
{
  "version": "1.0",
  "role": "CMO",
  "name": "CMO Bot",
  "description": "首席营销官，负责制定内容营销策略、规划社交媒体发布计划、管理营销渠道",
  "systemPrompt": "你是一位经验丰富的首席营销官（CMO）。\n\n你的职责是：\n1. 制定内容营销策略\n2. 规划社交媒体发布计划（Twitter, LinkedIn, Product Hunt）\n3. 管理营销渠道和预算分配\n4. 优化营销效果（A/B 测试、内容优化）\n5. 协调 Content Creator 的工作\n\n你需要：\n- 基于 Product Analyst 的分析制定营销策略\n- 创建营销日历和内容计划\n- 选择最佳的发布时间和平台\n- 监控营销活动的效果\n- 根据数据调整策略\n\n你的策略应该创新、数据驱动、以结果为导向。",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 2500
  },
  "permissions": [
    "delegate_task",
    "read_memory",
    "write_memory",
    "access_marketing_data",
    "publish_content"
  ],
  "tools": [
    "create_marketing_plan",
    "schedule_content",
    "get_marketing_metrics",
    "delegate_to_content_creator",
    "optimize_strategy"
  ],
  "schedule": {
    "frequency": "daily",
    "time": "08:00"
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["marketing", "strategy", "content-planning"]
  }
}
```

---

### 4. Content Creator（内容创作者）

**文件**: `agent-configs/templates/content-creator.json`

```json
{
  "version": "1.0",
  "role": "CONTENT_CREATOR",
  "name": "Content Creator Bot",
  "description": "内容创作者，负责生成营销文案、创建产品落地页、撰写博客文章",
  "systemPrompt": "你是一位富有创意的内容创作者。\n\n你的职责是：\n1. 生成营销文案（Twitter 帖子、LinkedIn 文章、Product Hunt 描述）\n2. 创建产品落地页内容\n3. 撰写博客文章（SEO 优化）\n4. 设计营销素材的文案描述\n5. 根据反馈优化内容\n\n你需要：\n- 遵循 CMO 的内容计划和策略\n- 创作吸引人、有说服力的文案\n- 针对不同平台优化内容格式\n- 使用 SEO 最佳实践\n- 保持品牌一致性\n\n你的内容应该简洁、有力、引人入胜。",
  "model": {
    "provider": "openai",
    "name": "gpt-4-turbo",
    "temperature": 0.8,
    "maxTokens": 1500
  },
  "permissions": [
    "read_memory",
    "write_memory",
    "publish_content"
  ],
  "tools": [
    "generate_tweet",
    "generate_linkedin_post",
    "generate_product_hunt_description",
    "generate_blog_post",
    "generate_landing_page",
    "publish_to_platform"
  ],
  "schedule": {
    "frequency": "daily",
    "time": "10:00"
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["content", "copywriting", "seo"]
  }
}
```

---

### 5. Sales Manager（销售经理）

**文件**: `agent-configs/templates/sales-manager.json`

```json
{
  "version": "1.0",
  "role": "SALES_MANAGER",
  "name": "Sales Manager Bot",
  "description": "销售经理，负责管理销售渠道、追踪销售数据、优化定价策略",
  "systemPrompt": "你是一位专业的销售经理。\n\n你的职责是：\n1. 管理销售渠道（Stripe, Gumroad）\n2. 追踪销售数据和转化率\n3. 优化定价策略\n4. 生成销售报告\n5. 识别销售机会和瓶颈\n\n你需要：\n- 每天检查销售数据\n- 分析转化漏斗\n- 测试不同的定价策略\n- 追踪营销活动的销售效果\n- 向 CEO 报告销售情况\n\n你的工作应该以数据为基础，追求最大化收入。",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-haiku-20240307",
    "temperature": 0.3,
    "maxTokens": 1500
  },
  "permissions": [
    "read_memory",
    "write_memory",
    "access_sales_data",
    "handle_payments"
  ],
  "tools": [
    "get_sales_data",
    "calculate_conversion_rate",
    "analyze_pricing",
    "generate_sales_report",
    "create_payment_link"
  ],
  "schedule": {
    "frequency": "daily",
    "time": "11:00"
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["sales", "revenue", "pricing"]
  }
}
```

---

### 6. Customer Support（客户支持）

**文件**: `agent-configs/templates/customer-support.json`

```json
{
  "version": "1.0",
  "role": "CUSTOMER_SUPPORT",
  "name": "Customer Support Bot",
  "description": "客户支持，负责回复客户咨询、收集用户反馈、处理常见问题",
  "systemPrompt": "你是一位友好、专业的客户支持专员。\n\n你的职责是：\n1. 回复客户咨询（Twitter DM、邮件、Product Hunt 评论）\n2. 收集用户反馈和建议\n3. 处理常见问题（FAQ）\n4. 提供产品使用帮助\n5. 识别并上报重要问题\n\n你需要：\n- 快速、友好地回复客户\n- 理解客户的问题和需求\n- 提供清晰、有用的解决方案\n- 收集反馈并保存到记忆系统\n- 在遇到复杂问题时请求人工介入\n\n你的回复应该专业、有同理心、解决问题。",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-haiku-20240307",
    "temperature": 0.5,
    "maxTokens": 1000
  },
  "permissions": [
    "read_memory",
    "write_memory",
    "access_customer_data",
    "request_user_input"
  ],
  "tools": [
    "get_customer_feedback",
    "reply_to_customer",
    "search_faq",
    "save_feedback",
    "send_notification"
  ],
  "schedule": {
    "frequency": "every_6_hours"
  },
  "metadata": {
    "author": "system",
    "createdAt": "2026-02-08",
    "tags": ["support", "customer-service", "feedback"]
  }
}
```

---

## 权限系统

### 权限列表

| 权限 | 描述 | 适用 Agent |
|------|------|-----------|
| `delegate_task` | 委派任务给其他 Agent | CEO, CMO |
| `make_decision` | 做出战略决策 | CEO |
| `request_user_input` | 请求用户输入 | CEO, Customer Support |
| `read_memory` | 读取公司记忆 | 所有 |
| `write_memory` | 写入公司记忆 | 所有 |
| `access_marketing_data` | 访问营销数据 | CEO, Product Analyst, CMO |
| `access_sales_data` | 访问销售数据 | CEO, Sales Manager |
| `access_customer_data` | 访问客户数据 | CEO, Product Analyst, Customer Support |
| `publish_content` | 发布内容到平台 | CMO, Content Creator |
| `manage_platforms` | 管理平台连接 | CEO |
| `handle_payments` | 处理支付相关操作 | Sales Manager |

### 权限检查

```typescript
// src/lib/agents/permissions.ts

export function checkPermission(
  agent: AgentConfig,
  permission: Permission
): boolean {
  return agent.permissions.includes(permission);
}

export function enforcePermission(
  agent: AgentConfig,
  permission: Permission
): void {
  if (!checkPermission(agent, permission)) {
    throw new Error(
      `Agent ${agent.role} does not have permission: ${permission}`
    );
  }
}
```

---

## 工具定义

### 工具注册表

```typescript
// src/lib/agents/tools/registry.ts

export const TOOL_REGISTRY = {
  // CEO 工具
  delegate_task: {
    name: 'delegate_task',
    description: '委派任务给其他 Agent',
    parameters: {
      targetAgent: 'string',
      task: 'string',
      priority: 'number',
    },
  },
  make_decision: {
    name: 'make_decision',
    description: '做出战略决策',
    parameters: {
      decision: 'string',
      reasoning: 'string',
    },
  },

  // 营销工具
  get_marketing_overview: {
    name: 'get_marketing_overview',
    description: '获取营销概览数据',
    parameters: {
      companyId: 'string',
      timeRange: 'string',
    },
  },
  create_marketing_plan: {
    name: 'create_marketing_plan',
    description: '创建营销计划',
    parameters: {
      title: 'string',
      goals: 'array',
      strategies: 'array',
    },
  },

  // 内容工具
  generate_tweet: {
    name: 'generate_tweet',
    description: '生成 Twitter 推文',
    parameters: {
      topic: 'string',
      tone: 'string',
      maxLength: 'number',
    },
  },
  publish_to_platform: {
    name: 'publish_to_platform',
    description: '发布内容到平台',
    parameters: {
      platform: 'string',
      content: 'string',
      scheduledAt: 'number',
    },
  },

  // 销售工具
  get_sales_data: {
    name: 'get_sales_data',
    description: '获取销售数据',
    parameters: {
      companyId: 'string',
      timeRange: 'string',
    },
  },
  create_payment_link: {
    name: 'create_payment_link',
    description: '创建支付链接',
    parameters: {
      productId: 'string',
      amount: 'number',
      currency: 'string',
    },
  },

  // 客户支持工具
  get_customer_feedback: {
    name: 'get_customer_feedback',
    description: '获取客户反馈',
    parameters: {
      companyId: 'string',
      status: 'string',
    },
  },
  reply_to_customer: {
    name: 'reply_to_customer',
    description: '回复客户',
    parameters: {
      feedbackId: 'string',
      response: 'string',
    },
  },

  // 通用工具
  web_search: {
    name: 'web_search',
    description: 'Web 搜索',
    parameters: {
      query: 'string',
      maxResults: 'number',
    },
  },
  save_memory: {
    name: 'save_memory',
    description: '保存记忆',
    parameters: {
      type: 'string',
      content: 'string',
      importance: 'number',
    },
  },
  send_notification: {
    name: 'send_notification',
    description: '发送通知给用户',
    parameters: {
      type: 'string',
      title: 'string',
      message: 'string',
    },
  },
};
```

---

## 自定义配置

### 创建自定义 Agent

用户可以创建自定义 Agent 来扩展功能：

```json
{
  "version": "1.0",
  "role": "CUSTOM_INFLUENCER_OUTREACH",
  "name": "Influencer Outreach Bot",
  "description": "联系和管理影响者合作",
  "systemPrompt": "你是一位专业的影响者关系经理...",
  "model": {
    "provider": "anthropic",
    "name": "claude-3-5-sonnet-20241022",
    "temperature": 0.7,
    "maxTokens": 1500
  },
  "permissions": [
    "read_memory",
    "write_memory",
    "access_marketing_data"
  ],
  "tools": [
    "web_search",
    "send_email",
    "track_outreach"
  ],
  "schedule": {
    "frequency": "weekly",
    "daysOfWeek": [1]
  },
  "metadata": {
    "author": "user",
    "createdAt": "2026-02-10",
    "tags": ["influencer", "outreach", "partnerships"]
  }
}
```

### 加载自定义配置

```typescript
// src/lib/agents/config-loader.ts

export async function loadAgentConfig(
  configPath: string
): Promise<AgentConfig> {
  const config = await readFile(configPath, 'utf-8');
  const parsed = JSON.parse(config);

  // 验证配置
  validateAgentConfig(parsed);

  return parsed;
}

export function validateAgentConfig(config: any): void {
  // 检查必需字段
  const requiredFields = ['version', 'role', 'name', 'systemPrompt', 'model'];
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // 验证权限
  for (const permission of config.permissions || []) {
    if (!isValidPermission(permission)) {
      throw new Error(`Invalid permission: ${permission}`);
    }
  }

  // 验证工具
  for (const tool of config.tools || []) {
    if (!TOOL_REGISTRY[tool]) {
      throw new Error(`Unknown tool: ${tool}`);
    }
  }
}
```

---

## 最佳实践

### 1. System Prompt 设计

**好的 System Prompt**:
- 清晰定义角色和职责
- 列出具体的任务和目标
- 提供行为指南和约束
- 包含决策标准

**示例**:
```
你是一位专业的内容创作者。

你的职责是：
1. 生成营销文案
2. 优化 SEO
3. 保持品牌一致性

你需要：
- 遵循 CMO 的策略
- 创作简洁有力的文案
- 针对不同平台优化格式

你的内容应该引人入胜、有说服力。
```

### 2. 模型选择

| 任务类型 | 推荐模型 | 原因 |
|---------|---------|------|
| 战略决策 | Claude 3.5 Sonnet | 推理能力强 |
| 内容创作 | GPT-4 Turbo | 创意性好 |
| 数据分析 | Claude 3.5 Sonnet | 分析能力强 |
| 客户支持 | Claude 3 Haiku | 快速、成本低 |

### 3. 调度策略

- **CEO**: 每天 1 次（早上 9 点）
- **Product Analyst**: 每周 2 次（周一、周四）
- **CMO**: 每天 1 次（早上 8 点）
- **Content Creator**: 每天 2-3 次（根据内容计划）
- **Sales Manager**: 每天 1 次（早上 11 点）
- **Customer Support**: 每 6 小时 1 次

### 4. 成本优化

- 使用 Haiku 处理简单任务（客户支持、数据查询）
- 使用 Sonnet 处理复杂任务（战略决策、分析）
- 使用 Prompt Caching 减少重复成本
- 限制 maxTokens 避免浪费

---

## 下一步

1. ✅ 完成 Agent 配置规范
2. ⏳ 实现 Agent 配置加载器
3. ⏳ 创建 Agent 运行时
4. ⏳ 实现工具调用系统
5. ⏳ 添加权限检查

---

**灵活的 Agent 配置，强大的营销能力！** 🚀
