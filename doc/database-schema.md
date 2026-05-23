# AI Company Builder - 数据库设计文档（Supabase）

> 使用 Supabase（PostgreSQL + 实时订阅 + pgvector），开源、免费层充足、功能完整

---

## 为什么选择 Supabase？

### 核心优势
1. **开源免费**：基于 PostgreSQL 的开源 BaaS 平台，免费层充足
2. **实时同步**：内置实时订阅（Realtime），无需 WebSocket
3. **向量搜索**：pgvector 扩展支持，无需 Pinecone
4. **完整生态**：Auth、Storage、Edge Functions 一体化
5. **Row Level Security**：数据库级别的权限控制

### 与 PostgreSQL + Redis 对比

| 特性 | PostgreSQL + Redis | Supabase |
|------|-------------------|--------|
| 月度成本 | $30-50 | **$0（免费层）** |
| 实时功能 | 需要 WebSocket | **内置 Realtime** |
| 配置复杂度 | 高（需要迁移脚本） | **简单** |
| 类型安全 | 需要 Prisma | **原生 TypeScript** |
| 向量搜索 | 需要 pgvector | **内置 pgvector** |
| 认证系统 | 需要自建 | **内置 Auth** |
| 部署 | 需要独立服务器 | **托管** |

---

## 完整 Supabase Schema

```sql
-- ============================================
-- 启用必要的扩展
-- ============================================

-- UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 向量搜索扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 用户表（使用 Supabase Auth）
-- ============================================

-- Supabase Auth 自动管理 auth.users 表
-- 我们创建一个 public.profiles 表来存储额外的用户信息

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看和更新自己的 profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 公司表
-- ============================================

CREATE TABLE public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('MARKETING', 'CONTENT', 'CUSTOMER_SERVICE', 'DEVELOPMENT')),
  status TEXT NOT NULL CHECK (status IN ('INITIALIZING', 'ACTIVE', 'PAUSED', 'ARCHIVED')),

  -- 公司配置（JSONB）
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 平台连接状态（JSONB）
  platform_connections JSONB DEFAULT '{}'::jsonb,

  -- 心跳机制
  last_heartbeat TIMESTAMPTZ,
  next_heartbeat TIMESTAMPTZ,
  heartbeat_interval INTEGER DEFAULT 6, -- 小时

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_type ON public.companies(type);
CREATE INDEX idx_companies_next_heartbeat ON public.companies(next_heartbeat);

-- RLS 策略
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Agent 表
-- ============================================

CREATE TABLE public.agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,

  -- Agent 配置
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 运行状态
  status TEXT NOT NULL CHECK (status IN ('IDLE', 'RUNNING', 'ERROR')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_agents_company_id ON public.agents(company_id);
CREATE INDEX idx_agents_company_role ON public.agents(company_id, role);

-- RLS 策略
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agents of own companies"
  ON public.agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = agents.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 任务表
-- ============================================

CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  priority INTEGER DEFAULT 5,

  -- 任务结果
  result JSONB,
  error TEXT,

  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_tasks_agent_id ON public.tasks(agent_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_scheduled_at ON public.tasks(scheduled_at);

-- RLS 策略
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of own companies"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = tasks.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 决策表
-- ============================================

CREATE TABLE public.decisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,

  question TEXT NOT NULL,
  context TEXT,
  options JSONB NOT NULL,

  -- 用户决策
  user_choice TEXT,
  user_feedback TEXT,

  status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX idx_decisions_company_id ON public.decisions(company_id);
CREATE INDEX idx_decisions_status ON public.decisions(status);

-- RLS 策略
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view decisions of own companies"
  ON public.decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = decisions.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update decisions of own companies"
  ON public.decisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = decisions.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 记忆表（支持向量搜索）
-- ============================================

CREATE TABLE public.memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('PRODUCT', 'MARKETING', 'CUSTOMER', 'DECISION')),
  content TEXT NOT NULL,
  importance FLOAT DEFAULT 0.5,

  -- 向量嵌入（1536 维，OpenAI embedding）
  embedding vector(1536),

  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_memories_company_id ON public.memories(company_id);
CREATE INDEX idx_memories_type ON public.memories(type);
CREATE INDEX idx_memories_importance ON public.memories(importance);

-- 向量搜索索引（使用 HNSW 算法）
CREATE INDEX idx_memories_embedding ON public.memories
  USING hnsw (embedding vector_cosine_ops);

-- RLS 策略
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memories of own companies"
  ON public.memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = memories.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 活动记录表
-- ============================================

CREATE TABLE public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,

  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_activities_company_id ON public.activities(company_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at);

-- RLS 策略
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities of own companies"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = activities.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 成本记录表
-- ============================================

CREATE TABLE public.costs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,

  category TEXT NOT NULL CHECK (category IN ('ai_api', 'platform_fee', 'infrastructure')),

  amount DECIMAL(10, 6) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_costs_company_id ON public.costs(company_id);
CREATE INDEX idx_costs_category ON public.costs(category);
CREATE INDEX idx_costs_created_at ON public.costs(created_at);

-- RLS 策略
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view costs of own companies"
  ON public.costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = costs.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 平台连接表
-- ============================================

CREATE TABLE public.platform_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,

  platform TEXT NOT NULL,
  connected BOOLEAN DEFAULT false,

  -- 加密的凭证（使用 Supabase Vault）
  credentials JSONB,

  last_sync_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, platform)
);

-- 索引
CREATE INDEX idx_platform_connections_company_id ON public.platform_connections(company_id);

-- RLS 策略
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage platform connections of own companies"
  ON public.platform_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE companies.id = platform_connections.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON public.platform_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 实时订阅配置
-- ============================================

-- 为需要实时更新的表启用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
```

---

## TypeScript 类型定义

```typescript
// types/database.ts

export type CompanyType = 'MARKETING' | 'CONTENT' | 'CUSTOMER_SERVICE' | 'DEVELOPMENT';
export type CompanyStatus = 'INITIALIZING' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type AgentStatus = 'IDLE' | 'RUNNING' | 'ERROR';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type DecisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MemoryType = 'PRODUCT' | 'MARKETING' | 'CUSTOMER' | 'DECISION';
export type CostCategory = 'ai_api' | 'platform_fee' | 'infrastructure';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          name?: string | null;
          avatar_url?: string | null;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: CompanyType;
          status: CompanyStatus;
          config: Record<string, any>;
          platform_connections: Record<string, any>;
          last_heartbeat: string | null;
          next_heartbeat: string | null;
          heartbeat_interval: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          type: CompanyType;
          status: CompanyStatus;
          config: Record<string, any>;
          heartbeat_interval?: number;
        };
        Update: {
          name?: string;
          status?: CompanyStatus;
          config?: Record<string, any>;
          platform_connections?: Record<string, any>;
          last_heartbeat?: string | null;
          next_heartbeat?: string | null;
        };
      };
      agents: {
        Row: {
          id: string;
          company_id: string;
          role: string;
          name: string;
          system_prompt: string;
          config: Record<string, any>;
          status: AgentStatus;
          last_run_at: string | null;
          next_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          role: string;
          name: string;
          system_prompt: string;
          config: Record<string, any>;
          status: AgentStatus;
        };
        Update: {
          system_prompt?: string;
          config?: Record<string, any>;
          status?: AgentStatus;
          last_run_at?: string | null;
          next_run_at?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          company_id: string;
          agent_id: string | null;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: number;
          result: Record<string, any> | null;
          error: string | null;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          agent_id?: string | null;
          title: string;
          description?: string | null;
          status: TaskStatus;
          priority?: number;
        };
        Update: {
          status?: TaskStatus;
          result?: Record<string, any> | null;
          error?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      memories: {
        Row: {
          id: string;
          company_id: string;
          type: MemoryType;
          content: string;
          importance: number;
          embedding: number[] | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          company_id: string;
          type: MemoryType;
          content: string;
          importance?: number;
          embedding?: number[] | null;
          created_by?: string | null;
        };
      };
      costs: {
        Row: {
          id: string;
          company_id: string;
          agent_id: string | null;
          category: CostCategory;
          amount: number;
          currency: string;
          description: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          company_id: string;
          agent_id?: string | null;
          category: CostCategory;
          amount: number;
          description?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
  };
}
```

---

## Supabase 客户端配置

```typescript
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 服务端客户端（使用 service role key）
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## 向量搜索示例

```typescript
// lib/memory/search.ts

import { supabase } from '@/lib/supabase/client';

export async function searchMemories(
  companyId: string,
  queryEmbedding: number[],
  limit: number = 5
) {
  const { data, error } = await supabase.rpc('match_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    company_id: companyId,
  });

  if (error) throw error;
  return data;
}

// 创建 RPC 函数（在 Supabase SQL Editor 中执行）
/*
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  company_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.content,
    1 - (memories.embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE memories.company_id = match_memories.company_id
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
*/
```

---

## 实时订阅示例

```typescript
// hooks/useRealtimeCompany.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Company = Database['public']['Tables']['companies']['Row'];

export function useRealtimeCompany(companyId: string) {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    // 初始加载
    supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
      .then(({ data }) => setCompany(data));

    // 订阅实时更新
    const channel = supabase
      .channel(`company:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        (payload) => {
          setCompany(payload.new as Company);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return company;
}
```

---

## 成本估算

### Supabase 免费层

- **数据库存储**: 500 MB
- **文件存储**: 1 GB
- **带宽**: 5 GB/月
- **Edge Functions**: 500K 次调用/月
- **Auth 用户**: 50,000 MAU

### 预估使用量（单公司）

- **存储**: ~50 MB（任务、记忆、日志）
- **带宽**: ~500 MB/月
- **Edge Functions**: ~10K 次/月（心跳机制）

**结论**: 完全在免费额度内，**$0 成本**！

---

## 数据迁移

如果从其他数据库迁移到 Supabase：

```typescript
// scripts/migrate-to-supabase.ts

import { supabaseAdmin } from '@/lib/supabase/client';

async function migrateCompanies(companies: any[]) {
  for (const company of companies) {
    const { error } = await supabaseAdmin
      .from('companies')
      .insert({
        user_id: company.userId,
        name: company.name,
        type: company.type,
        status: company.status,
        config: company.config,
      });

    if (error) {
      console.error(`Failed to migrate company ${company.id}:`, error);
    }
  }
}
```

---

## Drizzle ORM 集成

### 为什么使用 Drizzle ORM？

在 Supabase 的基础上，我们使用 **Drizzle ORM** 来提供类型安全的数据库操作：

1. **类型安全**：完整的 TypeScript 类型推导，编译时检查错误
2. **轻量级**：零依赖，打包体积仅 ~7KB，无运行时开销
3. **SQL-like API**：接近原生 SQL 的查询语法，易于学习
4. **性能优越**：直接生成 SQL，无 ORM 抽象层开销
5. **迁移管理**：内置 migration 工具，支持自动生成
6. **与 Supabase 完美集成**：原生支持 PostgreSQL 和 pgvector

### 安装 Drizzle

```bash
pnpm install drizzle-orm postgres
pnpm install -D drizzle-kit
```

### Drizzle 配置

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema/index.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 数据库客户端

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

### Schema 定义示例

```typescript
// lib/db/schema/companies.ts
import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const companyTypeEnum = pgEnum('company_type', [
  'MARKETING',
  'CONTENT',
  'CUSTOMER_SERVICE',
  'DEVELOPMENT'
]);

export const companyStatusEnum = pgEnum('company_status', [
  'INITIALIZING',
  'ACTIVE',
  'PAUSED',
  'ARCHIVED'
]);

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  name: text('name').notNull(),
  type: companyTypeEnum('type').notNull(),
  status: companyStatusEnum('status').notNull(),
  config: jsonb('config').$type<{
    monthlyBudget?: number;
    weeklyHours?: number;
    autoPublish?: boolean;
    [key: string]: any;
  }>().default({}),
  platformConnections: jsonb('platform_connections').$type<Record<string, any>>().default({}),
  lastHeartbeat: timestamp('last_heartbeat'),
  nextHeartbeat: timestamp('next_heartbeat'),
  heartbeatInterval: integer('heartbeat_interval').default(6),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
```

### 使用 Drizzle 进行 CRUD 操作

```typescript
import { db } from '@/lib/db/client';
import { companies, agents, tasks } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// 创建公司
const newCompany = await db.insert(companies).values({
  userId: user.id,
  name: 'My AI Company',
  type: 'marketing',
  status: 'initializing',
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

// 删除公司
await db
  .delete(companies)
  .where(eq(companies.id, companyId));
```

### 关联查询

```typescript
// 查询公司及其所有 Agents
const companyWithAgents = await db.query.companies.findFirst({
  where: eq(companies.id, companyId),
  with: {
    agents: {
      orderBy: desc(agents.createdAt),
    },
    tasks: {
      where: eq(tasks.status, 'pending'),
      limit: 10,
    },
  },
});

// 查询用户的所有公司及其任务
const userCompaniesWithTasks = await db.query.profiles.findFirst({
  where: eq(profiles.id, userId),
  with: {
    companies: {
      with: {
        tasks: {
          where: eq(tasks.status, 'pending'),
        },
      },
    },
  },
});
```

### 向量搜索（pgvector）

```typescript
import { sql } from 'drizzle-orm';

// 相似记忆搜索
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

### 事务处理

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

### Migration 管理

```bash
# 生成 migration 文件
pnpm drizzle-kit generate:pg

# 应用 migration
pnpm drizzle-kit push:pg

# 查看当前 schema
pnpm drizzle-kit introspect:pg
```

### 与 Supabase 结合使用

```typescript
// 结合 Supabase Auth
import { createServerClient } from '@supabase/ssr';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';

const supabase = createServerClient(/* ... */);
const { data: { user } } = await supabase.auth.getUser();

// 使用 Drizzle 查询用户资料
const profile = await db.query.profiles.findFirst({
  where: eq(profiles.id, user.id),
});

// 结合 Supabase Realtime
const channel = supabase
  .channel('companies')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'companies',
  }, (payload) => {
    // 使用 Drizzle 重新查询
    refreshCompanies();
  })
  .subscribe();

async function refreshCompanies() {
  const companies = await db.query.companies.findMany({
    where: eq(companies.userId, userId),
  });
  // 更新 UI
}
```

### 完整的 Schema 定义

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

### Drizzle 最佳实践

1. **类型安全**：使用 `$inferSelect` 和 `$inferInsert` 类型
2. **查询优化**：只选择需要的字段
3. **关系查询**：使用 Drizzle 的关系查询 API
4. **错误处理**：捕获 `DatabaseError` 并处理约束冲突
5. **连接池**：配置合适的连接池大小
6. **预编译语句**：使用 `.prepare()` 提高性能

---

## 下一步

1. ✅ 完成 Schema 设计
2. ⏳ 在 Supabase Dashboard 创建项目
3. ⏳ 执行 SQL 脚本创建表
4. ⏳ 配置 RLS 策略
5. ⏳ 启用 Realtime
6. ⏳ 测试向量搜索

---

**Supabase 让数据库管理变得简单！** 🚀
