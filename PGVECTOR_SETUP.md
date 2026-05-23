# pgvector 集成指南

本文档说明如何在 Supabase 中启用 pgvector 扩展，实现 AI 记忆系统的向量搜索功能。

## 📋 概述

pgvector 是 PostgreSQL 的向量相似度搜索扩展，支持：
- 向量存储和索引
- 余弦相似度、欧几里得距离、内积等相似度计算
- HNSW 和 IVFFlat 索引算法
- 高性能的向量搜索

## 🚀 快速开始

### 1. 在 Supabase 中启用 pgvector

1. 访问 Supabase Dashboard
2. 进入项目的 SQL Editor
3. 执行迁移脚本：`supabase/migrations/003_enable_pgvector.sql`

或者直接运行以下 SQL：

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 2. 验证安装

```sql
-- Check if vector type is available
SELECT typname FROM pg_type WHERE typname = 'vector';

-- Should return: vector
```

### 3. 测试向量操作

```sql
-- Create a test table
CREATE TABLE test_vectors (
  id serial PRIMARY KEY,
  embedding vector(3)
);

-- Insert test data
INSERT INTO test_vectors (embedding) VALUES
  ('[1,2,3]'),
  ('[4,5,6]'),
  ('[7,8,9]');

-- Test cosine similarity search
SELECT id, embedding, 1 - (embedding <=> '[1,2,3]') as similarity
FROM test_vectors
ORDER BY embedding <=> '[1,2,3]'
LIMIT 3;

-- Clean up
DROP TABLE test_vectors;
```

## 📊 记忆系统功能

### 存储记忆

```typescript
import { storeMemory } from '@/lib/memory/service';

const memory = await storeMemory(
  'company-id',
  'PRODUCT',
  'Our product is an AI-powered automation platform',
  80 // importance
);
```

### 搜索相似记忆

```typescript
import { searchMemories } from '@/lib/memory/service';

const results = await searchMemories({
  companyId: 'company-id',
  query: 'What is our product about?',
  limit: 5,
  minSimilarity: 0.7,
});

results.forEach(({ memory, similarity }) => {
  console.log(`${similarity.toFixed(2)}: ${memory.content}`);
});
```

### 获取记忆统计

```typescript
import { getMemoryStats } from '@/lib/memory/service';

const stats = await getMemoryStats('company-id');
console.log(`Total memories: ${stats.total}`);
console.log(`Average importance: ${stats.averageImportance}`);
```

## 🔧 数据库函数

### search_similar_memories

搜索相似记忆的数据库函数：

```sql
SELECT * FROM search_similar_memories(
  query_embedding := '[0.1, 0.2, ...]'::vector,
  match_threshold := 0.7,
  match_count := 10,
  filter_company_id := 'company-id'::uuid
);
```

### get_memory_stats

获取记忆统计：

```sql
SELECT * FROM get_memory_stats('company-id'::uuid);
```

## 📈 性能优化

### 索引类型

我们使用 HNSW 索引以获得最佳性能：

```sql
CREATE INDEX memories_embedding_idx
ON memories
USING hnsw (embedding vector_cosine_ops);
```

**HNSW vs IVFFlat**:
- HNSW: 更快的查询速度，更高的召回率，但构建时间较长
- IVFFlat: 更快的构建速度，但查询速度较慢

### 相似度计算

支持三种距离计算方式：

1. **余弦距离** (推荐): `embedding <=> query`
   - 范围: 0-2 (0 = 完全相同)
   - 相似度: `1 - (embedding <=> query)`

2. **欧几里得距离**: `embedding <-> query`
   - 范围: 0-∞
   - 适用于绝对距离重要的场景

3. **内积**: `embedding <#> query`
   - 范围: -∞ to ∞
   - 适用于已归一化的向量

## 💰 成本估算

### OpenAI Embeddings

使用 `text-embedding-3-small` 模型：
- 成本: $0.00002 / 1k tokens
- 维度: 1536
- 性能: 优秀

**示例成本**:
- 100 条记忆 (平均 50 tokens): $0.0001
- 1,000 条记忆: $0.001
- 10,000 条记忆: $0.01

### 存储成本

Supabase 免费层:
- 500MB 数据库存储
- 向量数据约占 6KB/条 (1536 维 * 4 bytes)
- 可存储约 80,000 条记忆

## 🔍 使用场景

### 1. 产品知识库

```typescript
await storeMemory(
  companyId,
  'PRODUCT',
  'Our SaaS platform helps teams automate workflows',
  90
);

const results = await searchMemories({
  companyId,
  query: 'What does our product do?',
  type: 'PRODUCT',
});
```

### 2. 营销内容

```typescript
await storeMemory(
  companyId,
  'MARKETING',
  'Our target audience is small business owners',
  85
);

const results = await searchMemories({
  companyId,
  query: 'Who are our customers?',
  type: 'MARKETING',
});
```

### 3. 客户反馈

```typescript
await storeMemory(
  companyId,
  'CUSTOMER',
  'Customer requested dark mode feature',
  75
);

const results = await searchMemories({
  companyId,
  query: 'What features do customers want?',
  type: 'CUSTOMER',
});
```

### 4. 决策历史

```typescript
await storeMemory(
  companyId,
  'DECISION',
  'Decided to focus on B2B market instead of B2C',
  95
);

const results = await searchMemories({
  companyId,
  query: 'What strategic decisions have we made?',
  type: 'DECISION',
});
```

## 🛠️ 故障排查

### 问题: pgvector 扩展未安装

```sql
-- Check if extension exists
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- If not available, contact Supabase support
```

### 问题: 向量维度不匹配

```sql
-- Check vector dimensions
SELECT pg_typeof(embedding) FROM memories LIMIT 1;

-- Should return: vector(1536)
```

### 问题: 索引未创建

```sql
-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'memories';

-- Recreate index if needed
DROP INDEX IF EXISTS memories_embedding_idx;
CREATE INDEX memories_embedding_idx
ON memories
USING hnsw (embedding vector_cosine_ops);
```

### 问题: 查询速度慢

```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM memories
WHERE company_id = 'xxx'
ORDER BY embedding <=> '[...]'::vector
LIMIT 10;

-- Should show "Index Scan using memories_embedding_idx"
```

## 📚 参考资源

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)

## 🎯 下一步

1. 在 Supabase 中执行迁移脚本
2. 测试向量搜索功能
3. 创建一些测试记忆
4. 在 Agent 中集成记忆系统
5. 监控性能和成本

---

**更新日期**: 2026-02-13
**状态**: ✅ 已实现，待配置
