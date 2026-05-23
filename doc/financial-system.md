# AI API 成本追踪系统（v0.2 简化版）

> v0.2 专注于 AI API 成本追踪，移除完整财务系统，保持极简设计

---

## 目录

1. [系统概述](#系统概述)
2. [AI API 成本追踪](#ai-api-成本追踪)
3. [成本优化](#成本优化)
4. [成本仪表板](#成本仪表板)
5. [预算警告](#预算警告)
6. [API 设计](#api-设计)

---

## 系统概述

### v0.2 简化设计

v0.2 版本移除了完整的财务系统（收入管理、ROI 分析等），**仅保留 AI API 成本追踪**，原因：

1. **极简 MVP**: 专注核心功能，快速验证
2. **降低复杂度**: 减少开发时间和维护成本
3. **用户需求**: 用户最关心的是 AI API 成本控制
4. **未来扩展**: 可在后续版本添加完整财务功能

### 设计目标

1. **实时成本追踪**: 自动记录所有 AI API 调用成本
2. **成本优化**: Prompt Caching + 模型分层降低成本
3. **预算控制**: 设置预算上限，超限自动警告
4. **成本透明**: 按 Agent、模型、时间维度分析成本
5. **成本预测**: 基于历史数据预测未来成本

### 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                  AI Agent 调用                            │
│  (CEO, Product Analyst, CMO, Content Creator, etc.)      │
└──────────────────────────────────────────────────────────┘
                        │
                        ↓
┌──────────────────────────────────────────────────────────┐
│                  LLM Router                               │
│  - 模型选择（Haiku/Sonnet/GPT-4）                         │
│  - Prompt Caching                                        │
│  - Token 计数                                            │
└──────────────────────────────────────────────────────────┘
                        │
                        ↓
┌──────────────────────────────────────────────────────────┐
│              Cost Tracker                                 │
│  - 记录每次调用成本                                        │
│  - 按 Agent/模型/时间聚合                                  │
│  - 预算监控和警告                                          │
└──────────────────────────────────────────────────────────┘
                        │
                        ↓
┌──────────────────────────────────────────────────────────┐
│              Supabase + Drizzle ORM                       │
│  - financial_records 表                                   │
└──────────────────────────────────────────────────────────┘
```

## AI API 成本追踪

### 1. 成本追踪器实现

```typescript
// src/lib/financial/cost-tracker.ts

import { db } from '@/lib/db/client';
import { financialRecords } from '@/lib/db/schema';

export class CostTracker {
  /**
   * 追踪 AI API 调用成本
   */
  async trackAICost(
    companyId: string,
    agentId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    cached: boolean = false
  ): Promise<void> {
    // AI 模型定价（2025 年 1 月）
    const pricing = {
      // Anthropic Claude
      'claude-sonnet-4': {
        prompt: 3.0 / 1_000_000,      // $3 per 1M tokens
        completion: 15.0 / 1_000_000,  // $15 per 1M tokens
        cachedPrompt: 0.3 / 1_000_000, // $0.30 per 1M tokens (90% 节省)
      },
      'claude-haiku-3.5': {
        prompt: 0.8 / 1_000_000,       // $0.80 per 1M tokens
        completion: 4.0 / 1_000_000,   // $4 per 1M tokens
        cachedPrompt: 0.08 / 1_000_000,
      },
      // OpenAI GPT
      'gpt-4-turbo': {
        prompt: 10.0 / 1_000_000,
        completion: 30.0 / 1_000_000,
        cachedPrompt: 10.0 / 1_000_000, // OpenAI 不支持 Prompt Caching
      },
      'gpt-3.5-turbo': {
        prompt: 0.5 / 1_000_000,
        completion: 1.5 / 1_000_000,
        cachedPrompt: 0.5 / 1_000_000,
      },
    };

    const modelPricing = pricing[model] || pricing['claude-sonnet-4'];

    // 计算成本（考虑 Prompt Caching）
    const promptCost = cached
      ? promptTokens * modelPricing.cachedPrompt
      : promptTokens * modelPricing.prompt;
    const completionCost = completionTokens * modelPricing.completion;
    const totalCost = promptCost + completionCost;

    // 记录到 Supabase
    await db.insert(financialRecords).values({
      companyId,
      agentId,
      provider: model.startsWith('claude') ? 'anthropic' : 'openai',
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost: totalCost,
      cached,
    });
  }

  /**
   * 获取总成本
   */
  async getTotalCost(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const { sum } = await db
      .select({ sum: sql<number>`sum(${financialRecords.cost})` })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.companyId, companyId),
          startDate ? gte(financialRecords.createdAt, startDate) : undefined,
          endDate ? lte(financialRecords.createdAt, endDate) : undefined
        )
      )
      .then(rows => rows[0]);

    return sum || 0;
  }

  /**
   * 按 Agent 获取成本
   */
  async getCostByAgent(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const results = await db
      .select({
        agentId: financialRecords.agentId,
        totalCost: sql<number>`sum(${financialRecords.cost})`,
      })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.companyId, companyId),
          startDate ? gte(financialRecords.createdAt, startDate) : undefined,
          endDate ? lte(financialRecords.createdAt, endDate) : undefined
        )
      )
      .groupBy(financialRecords.agentId);

    return results.reduce((acc, row) => {
      acc[row.agentId] = row.totalCost;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 按模型获取成本
   */
  async getCostByModel(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<string, number>> {
    const results = await db
      .select({
        model: financialRecords.model,
        totalCost: sql<number>`sum(${financialRecords.cost})`,
      })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.companyId, companyId),
          startDate ? gte(financialRecords.createdAt, startDate) : undefined,
          endDate ? lte(financialRecords.createdAt, endDate) : undefined
        )
      )
      .groupBy(financialRecords.model);

    return results.reduce((acc, row) => {
      acc[row.model] = row.totalCost;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const costTracker = new CostTracker();
```

### 2. LLM Router 集成

```typescript
// src/lib/ai/llm-router.ts

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { costTracker } from '../financial/cost-tracker';

export class LLMRouter {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * 统一的 LLM 调用接口（自动追踪成本）
   */
  async chat(params: {
    companyId: string;
    agentId: string;
    model: string;
    systemPrompt: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; usage: any }> {
    const { companyId, agentId, model, systemPrompt, messages, temperature, maxTokens } = params;

    let response: any;
    let usage: any;

    // 根据模型选择 API
    if (model.startsWith('claude')) {
      // Anthropic Claude
      const result = await this.anthropic.messages.create({
        model,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }, // 启用 Prompt Caching
          },
        ],
        messages,
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 2000,
      });

      response = result.content[0].text;
      usage = result.usage;

      // 追踪成本（检测是否使用了缓存）
      const cached = usage.cache_read_input_tokens > 0;
      await costTracker.trackAICost(
        companyId,
        agentId,
        model,
        usage.input_tokens,
        usage.output_tokens,
        cached
      );
    } else if (model.startsWith('gpt')) {
      // OpenAI GPT
      const result = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 2000,
      });

      response = result.choices[0].message.content;
      usage = result.usage;

      // 追踪成本
      await costTracker.trackAICost(
        companyId,
        agentId,
        model,
        usage.prompt_tokens,
        usage.completion_tokens,
        false
      );
    }

    return { content: response, usage };
  }
}

export const llmRouter = new LLMRouter();
```

### 3. Drizzle 成本查询

```typescript
// src/lib/db/queries/costs.ts

import { db } from '@/lib/db/client';
import { financialRecords, companies } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

// 获取总成本
export async function getTotalCost(
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const result = await db
    .select({ totalCost: sql<number>`sum(${financialRecords.cost})` })
    .from(financialRecords)
    .where(
      and(
        eq(financialRecords.companyId, companyId),
        startDate ? gte(financialRecords.createdAt, startDate) : undefined,
        endDate ? lte(financialRecords.createdAt, endDate) : undefined
      )
    )
    .then(rows => rows[0]);

  return result?.totalCost || 0;
}

// 按 Agent 获取成本
export async function getCostByAgent(
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const results = await db
    .select({
      agentId: financialRecords.agentId,
      totalCost: sql<number>`sum(${financialRecords.cost})`,
    })
    .from(financialRecords)
    .where(
      and(
        eq(financialRecords.companyId, companyId),
        startDate ? gte(financialRecords.createdAt, startDate) : undefined,
        endDate ? lte(financialRecords.createdAt, endDate) : undefined
      )
    )
    .groupBy(financialRecords.agentId);

  return results.reduce((acc, row) => {
    acc[row.agentId] = row.totalCost;
    return acc;
  }, {} as Record<string, number>);
}

// 按模型获取成本
export async function getCostByModel(
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const results = await db
    .select({
      model: financialRecords.model,
      totalCost: sql<number>`sum(${financialRecords.cost})`,
    })
    .from(financialRecords)
    .where(
      and(
        eq(financialRecords.companyId, companyId),
        startDate ? gte(financialRecords.createdAt, startDate) : undefined,
        endDate ? lte(financialRecords.createdAt, endDate) : undefined
      )
    )
    .groupBy(financialRecords.model);

  return results.reduce((acc, row) => {
    acc[row.model] = row.totalCost;
    return acc;
  }, {} as Record<string, number>);
}
```

---

## 成本优化

### 1. Prompt Caching（90% 成本节省）

**Anthropic Prompt Caching** 是 v0.2 的核心成本优化策略：

- **原理**: 缓存 system prompt，后续调用只需支付 10% 的 prompt 成本
- **节省**: 90% 的 prompt token 成本
- **适用场景**: Agent 的 system prompt 通常很长（500-2000 tokens），且每次调用都相同

**实现示例**:

```typescript
// LLM Router 已自动启用 Prompt Caching
const result = await llmRouter.chat({
  companyId,
  agentRole: 'CEO',
  model: 'claude-sonnet-4',
  systemPrompt: longSystemPrompt, // 自动缓存
  messages: [{ role: 'user', content: 'What should we do today?' }],
});

// 第一次调用: $0.003 (1000 prompt tokens × $3/1M)
// 后续调用: $0.0003 (1000 cached tokens × $0.3/1M)
// 节省: 90%
```

### 2. 模型分层（按复杂度选择模型）

不同任务使用不同模型，平衡成本和质量：

| 任务复杂度 | 推荐模型 | 成本 | 适用场景 |
|-----------|---------|------|---------|
| 简单 | claude-haiku-3.5 | $0.80/1M | 数据提取、分类、简单回复 |
| 中等 | claude-sonnet-4 | $3/1M | 内容生成、分析、决策 |
| 复杂 | gpt-4-turbo | $10/1M | 复杂推理、代码生成 |

**实现示例**:

```typescript
// Agent 配置中指定模型
const agentConfig = {
  role: 'PRODUCT_ANALYST',
  model: 'claude-haiku-3.5', // 简单任务用 Haiku
  // ...
};

const ceoConfig = {
  role: 'CEO',
  model: 'claude-sonnet-4', // 复杂决策用 Sonnet
  // ...
};
```

### 3. Heart beat 机制（83% 调用减少）

**原理**: 不是持续运行,而是每 6 小时唤醒一次

- **v0.1**: 24/7 持续运行 → 每天 24 次调用
- **v0.2**: 每 6 小时唤醒 → 每天 4 次调用
- **节省**: 83% 的 AI API 调用

**实现**:

```typescript
// supabase/functions/heartbeat/index.ts

import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db/client';
import { companies, heartbeats } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';

Deno.serve(async (req) => {
  try {
    // 获取所有需要唤醒的公司
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

    // 唤醒每个公司
    for (const { companies: company } of companiesToWake) {
      // 触发公司的 AI Agent 运行
      await fetch(`${Deno.env.get('APP_URL')}/api/companies/${company.id}/wake`, {
        method: 'POST',
      });
    }

    return new Response(
      JSON.stringify({ success: true, woken: companiesToWake.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

配置 Supabase Cron（在 Supabase Dashboard → Database → Cron Jobs）:

```sql
-- 每 6 小时运行一次
SELECT cron.schedule(
  'heartbeat-check',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://[project-ref].supabase.co/functions/v1/heartbeat',
    headers := '{"Authorization": "Bearer [anon-key]"}'::jsonb
  );
  $$
);
```

### 4. 成本预测

基于历史数据预测未来成本：

```typescript
// src/lib/financial/cost-predictor.ts

import { costTracker } from './cost-tracker';

export class CostPredictor {
  /**
   * 预测下月成本
   */
  async predictNextMonthCost(companyId: string): Promise<number> {
    // 获取过去 3 个月的成本数据
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    const costs: number[] = [];
    for (let i = 0; i < 3; i++) {
      const startDate = new Date(now.getTime() - (i + 1) * oneMonth);
      const endDate = new Date(now.getTime() - i * oneMonth);

      const cost = await costTracker.getTotalCost(companyId, startDate, endDate);
      costs.push(cost);
    }

    // 简单的线性预测
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const trend = (costs[0] - costs[2]) / 2;

    return avgCost + trend;
  }
}
```

## 成本仪表板

### 1. 成本概览组件

```typescript
// src/app/dashboard/[companyId]/costs/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { CostChart } from '@/components/costs/cost-chart';
import { CostBreakdown } from '@/components/costs/cost-breakdown';
import { getTotalCost, getCostByAgent, getCostByModel } from '@/lib/db/queries/costs';

export default function CostsDashboard({
  params,
}: {
  params: { companyId: string };
}) {
  const [totalCost, setTotalCost] = useState<number>(0);
  const [costByAgent, setCostByAgent] = useState<Record<string, number>>({});
  const [costByModel, setCostByModel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCosts() {
      // 获取当月成本
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [total, byAgent, byModel] = await Promise.all([
        getTotalCost(params.companyId, startOfMonth),
        getCostByAgent(params.companyId, startOfMonth),
        getCostByModel(params.companyId, startOfMonth),
      ]);

      setTotalCost(total);
      setCostByAgent(byAgent);
      setCostByModel(byModel);
      setLoading(false);
    }

    loadCosts();
  }, [params.companyId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">成本追踪</h1>

      {/* 成本概况 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-500">本月总成本</div>
          <div className="text-2xl font-bold text-red-600">
            ${totalCost.toFixed(2)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500">平均每日成本</div>
          <div className="text-2xl font-bold">
            ${(totalCost / new Date().getDate()).toFixed(2)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500">预计月度成本</div>
          <div className="text-2xl font-bold">
            ${((totalCost / new Date().getDate()) * 30).toFixed(2)}
          </div>
        </Card>
      </div>

      {/* 按 Agent 的成本分布 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">按 Agent 的成本分布</h2>
        <CostChart data={costByAgent} type="agent" />
      </Card>

      {/* 按模型的成本分布 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">按模型的成本分布</h2>
        <CostChart data={costByModel} type="model" />
      </Card>

      {/* 成本明细 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">成本明细</h2>
        <CostBreakdown
          costByAgent={costByAgent}
          costByModel={costByModel}
        />
      </Card>
    </div>
  );
}
```

### 2. 成本图表组件

```typescript
// src/components/costs/cost-chart.tsx

'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CostChartProps {
  data: Record<string, number>;
  type: 'agent' | 'model';
}

export function CostChart({ data, type }: CostChartProps) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: type === 'agent' ? 'Agent 成本' : '模型成本',
        data: values,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '$' + value.toFixed(2);
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
```

---

## 预算警告

### 1. 预算监控

```typescript
// src/lib/db/queries/budgets.ts

import { db } from '@/lib/db/client';
import { companies, financialRecords } from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

// 创建预算（存储在 companies 表的 config 中）
export async function setMonthlyBudget(
  companyId: string,
  monthlyBudget: number
) {
  await db
    .update(companies)
    .set({
      config: sql`jsonb_set(config, '{monthlyBudget}', ${monthlyBudget}::text::jsonb)`,
    })
    .where(eq(companies.id, companyId));
}

// 检查预算使用情况
export async function checkBudgetUsage(companyId: string) {
  // 获取公司配置
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  });

  if (!company || !company.config?.monthlyBudget) {
    return { status: 'NO_BUDGET', percentage: 0 };
  }

  const monthlyBudget = company.config.monthlyBudget;

  // 获取当月成本
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await db
    .select({ totalCost: sql<number>`sum(${financialRecords.cost})` })
    .from(financialRecords)
    .where(
      and(
        eq(financialRecords.companyId, companyId),
        gte(financialRecords.createdAt, startOfMonth)
      )
    )
    .then(rows => rows[0]);

  const totalCost = result?.totalCost || 0;
  const percentage = (totalCost / monthlyBudget) * 100;

  let status: string;
  if (percentage < 50) status = 'HEALTHY';
  else if (percentage < 80) status = 'WARNING';
  else if (percentage < 100) status = 'CRITICAL';
  else status = 'EXCEEDED';

  return {
    status,
    percentage,
    totalCost,
    budget: monthlyBudget,
    remaining: monthlyBudget - totalCost,
  };
}
```

### 2. 预算警告组件

```typescript
// src/components/costs/budget-alert.tsx

'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { checkBudgetUsage } from '@/lib/db/queries/budgets';

interface BudgetAlertProps {
  companyId: string;
}

export function BudgetAlert({ companyId }: BudgetAlertProps) {
  const [budgetUsage, setBudgetUsage] = useState<any>(null);

  useEffect(() => {
    async function loadBudgetUsage() {
      const usage = await checkBudgetUsage(companyId);
      setBudgetUsage(usage);
    }
    loadBudgetUsage();
  }, [companyId]);

  if (!budgetUsage || budgetUsage.status === 'NO_BUDGET') {
    return null;
  }

  const { status, percentage, totalCost, budget, remaining } = budgetUsage;

  if (status === 'HEALTHY') {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">预算健康</AlertTitle>
        <AlertDescription className="text-green-700">
          已使用 {percentage.toFixed(1)}% 的月度预算（${totalCost.toFixed(2)} / ${budget.toFixed(2)}）
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'WARNING') {
    return (
      <Alert className="border-yellow-500 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">预算警告</AlertTitle>
        <AlertDescription className="text-yellow-700">
          已使用 {percentage.toFixed(1)}% 的月度预算，剩余 ${remaining.toFixed(2)}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === 'CRITICAL' || status === 'EXCEEDED') {
    return (
      <Alert className="border-red-500 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">
          {status === 'EXCEEDED' ? '预算超限！' : '预算即将超限'}
        </AlertTitle>
        <AlertDescription className="text-red-700">
          {status === 'EXCEEDED'
            ? `已超出预算 $${Math.abs(remaining).toFixed(2)}`
            : `已使用 ${percentage.toFixed(1)}% 的月度预算，剩余 ${remaining.toFixed(2)}`}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
```

---

## API 设计

### Drizzle Schema

```typescript
// lib/db/schema/financial-records.ts

import { pgTable, uuid, text, integer, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { agents } from './agents';

export const financialRecords = pgTable('financial_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  agentId: uuid('agent_id').references(() => agents.id).notNull(),

  // AI Provider 信息
  provider: text('provider').notNull(), // 'anthropic' | 'openai'
  model: text('model').notNull(),

  // Token 使用
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),

  // 成本
  cost: decimal('cost', { precision: 10, scale: 6 }).notNull(),
  cached: boolean('cached').default(false).notNull(),

  // 时间戳
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type FinancialRecord = typeof financialRecords.$inferSelect;
export type NewFinancialRecord = typeof financialRecords.$inferInsert;
```

### 索引优化

```sql
-- 为常用查询创建索引
CREATE INDEX idx_financial_records_company_id ON financial_records(company_id);
CREATE INDEX idx_financial_records_agent_id ON financial_records(agent_id);
CREATE INDEX idx_financial_records_created_at ON financial_records(created_at);
CREATE INDEX idx_financial_records_company_created ON financial_records(company_id, created_at);
```

---

## 总结

v0.2 的 AI API 成本追踪系统专注于：

1. **实时成本追踪**: 自动记录所有 AI API 调用成本
2. **成本优化**: Prompt Caching + 模型分层 + Heart beat 机制
3. **预算控制**: 设置预算上限，超限自动警告
4. **成本透明**: 按 Agent、模型、时间维度分析成本
5. **成本预测**: 基于历史数据预测未来成本

**核心优势**:
- 极简设计，专注核心功能
- Supabase + Drizzle ORM 零成本数据库
- 90% 成本节省（Prompt Caching）
- 83% 调用减少（Heart beat）
- 实时成本监控和预警
- 类型安全的数据库操作
