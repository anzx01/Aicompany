# AI Company Builder - API 文档

> 本文档提供 AI Company Builder 的完整 API 参考

---

## 📋 目录

1. [认证](#认证)
2. [公司 API](#公司-api)
3. [Agent API](#agent-api)
4. [任务 API](#任务-api)
5. [平台 API](#平台-api)
6. [成本 API](#成本-api)
7. [心跳 API](#心跳-api)
8. [错误处理](#错误处理)

---

## 🔐 认证

所有 API 请求都需要通过 Supabase Auth 进行认证。

### 获取访问令牌

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// 获取访问令牌
const accessToken = data.session?.access_token;
```

### 使用访问令牌

```typescript
// 在请求头中包含访问令牌
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};
```

---

## 🏢 公司 API

### 创建公司

**端点**: `POST /api/trpc/company.create`

**请求体**:
```json
{
  "name": "My Marketing Company",
  "type": "marketing",
  "description": "AI-powered marketing automation",
  "budget": 100,
  "goals": {
    "daily_posts": 3,
    "engagement_rate": 0.05
  }
}
```

**响应**:
```json
{
  "result": {
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Marketing Company",
      "type": "marketing",
      "status": "active",
      "created_at": "2026-02-14T10:00:00Z"
    }
  }
}
```

### 获取公司列表

**端点**: `GET /api/trpc/company.list`

**响应**:
```json
{
  "result": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Marketing Company",
        "type": "marketing",
        "status": "active",
        "created_at": "2026-02-14T10:00:00Z"
      }
    ]
  }
}
```

### 获取公司详情

**端点**: `GET /api/trpc/company.get?id={companyId}`

**响应**:
```json
{
  "result": {
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "My Marketing Company",
      "type": "marketing",
      "description": "AI-powered marketing automation",
      "status": "active",
      "budget": 100,
      "goals": {
        "daily_posts": 3,
        "engagement_rate": 0.05
      },
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-14T10:00:00Z"
    }
  }
}
```

### 更新公司

**端点**: `POST /api/trpc/company.update`

**请求体**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Company Name",
  "budget": 150
}
```

### 删除公司

**端点**: `POST /api/trpc/company.delete`

**请求体**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🤖 Agent API

### 获取 Agent 列表

**端点**: `GET /api/trpc/agent.list?companyId={companyId}`

**响应**:
```json
{
  "result": {
    "data": [
      {
        "id": "agent-1",
        "name": "CEO",
        "role": "ceo",
        "status": "active",
        "capabilities": ["strategy", "coordination", "decision_making"],
        "priority": 10
      },
      {
        "id": "agent-2",
        "name": "Content Creator",
        "role": "content_creator",
        "status": "active",
        "capabilities": ["writing", "seo", "social_media"],
        "priority": 6
      }
    ]
  }
}
```

### 获取 Agent 详情

**端点**: `GET /api/trpc/agent.get?id={agentId}`

**响应**:
```json
{
  "result": {
    "data": {
      "id": "agent-1",
      "name": "CEO",
      "role": "ceo",
      "status": "active",
      "capabilities": ["strategy", "coordination", "decision_making"],
      "priority": 10,
      "system_prompt": "You are the CEO of a marketing company...",
      "tools": ["web_search", "data_analysis"],
      "memory_enabled": true,
      "created_at": "2026-02-14T10:00:00Z"
    }
  }
}
```

### 更新 Agent 配置

**端点**: `POST /api/trpc/agent.update`

**请求体**:
```json
{
  "id": "agent-1",
  "system_prompt": "Updated system prompt...",
  "tools": ["web_search", "data_analysis", "code_executor"]
}
```

### 执行 Agent 任务

**端点**: `POST /api/trpc/agent.execute`

**请求体**:
```json
{
  "agent_id": "agent-1",
  "task": "Analyze market trends for Q1 2026",
  "priority": 8,
  "context": {
    "industry": "SaaS",
    "region": "North America"
  }
}
```

**响应**:
```json
{
  "result": {
    "data": {
      "task_id": "task-1",
      "status": "completed",
      "result": "Market analysis shows...",
      "cost": 0.05,
      "duration": 3.2
    }
  }
}
```

---

## 📋 任务 API

### 创建任务

**端点**: `POST /api/trpc/task.create`

**请求体**:
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Write blog post",
  "description": "Write a blog post about AI trends",
  "priority": 7,
  "assigned_to": "agent-2"
}
```

**响应**:
```json
{
  "result": {
    "data": {
      "id": "task-1",
      "title": "Write blog post",
      "status": "pending",
      "priority": 7,
      "created_at": "2026-02-14T10:00:00Z"
    }
  }
}
```

### 获取任务列表

**端点**: `GET /api/trpc/task.list?companyId={companyId}&status={status}`

**查询参数**:
- `companyId` (必需): 公司 ID
- `status` (可选): 任务状态 (`pending`, `in_progress`, `completed`, `failed`)
- `limit` (可选): 返回数量限制，默认 50
- `offset` (可选): 分页偏移量，默认 0

**响应**:
```json
{
  "result": {
    "data": [
      {
        "id": "task-1",
        "title": "Write blog post",
        "description": "Write a blog post about AI trends",
        "status": "completed",
        "priority": 7,
        "assigned_to": "agent-2",
        "result": "Blog post content...",
        "created_at": "2026-02-14T10:00:00Z",
        "completed_at": "2026-02-14T10:05:00Z"
      }
    ]
  }
}
```

### 获取任务详情

**端点**: `GET /api/trpc/task.get?id={taskId}`

**响应**:
```json
{
  "result": {
    "data": {
      "id": "task-1",
      "title": "Write blog post",
      "description": "Write a blog post about AI trends",
      "status": "completed",
      "priority": 7,
      "assigned_to": "agent-2",
      "result": "Blog post content...",
      "cost": 0.03,
      "duration": 5.2,
      "created_at": "2026-02-14T10:00:00Z",
      "started_at": "2026-02-14T10:00:30Z",
      "completed_at": "2026-02-14T10:05:00Z"
    }
  }
}
```

### 更新任务状态

**端点**: `POST /api/trpc/task.updateStatus`

**请求体**:
```json
{
  "id": "task-1",
  "status": "in_progress"
}
```

### 删除任务

**端点**: `POST /api/trpc/task.delete`

**请求体**:
```json
{
  "id": "task-1"
}
```

---

## 🔗 平台 API

### 获取平台连接列表

**端点**: `GET /api/trpc/platform.list?companyId={companyId}`

**响应**:
```json
{
  "result": {
    "data": [
      {
        "id": "conn-1",
        "platform": "twitter",
        "status": "connected",
        "account": "@mycompany",
        "connected_at": "2026-02-14T10:00:00Z"
      }
    ]
  }
}
```

### 连接平台

**端点**: `POST /api/trpc/platform.connect`

**请求体**:
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "twitter",
  "credentials": {
    "api_key": "xxx",
    "api_secret": "xxx",
    "access_token": "xxx",
    "access_token_secret": "xxx"
  }
}
```

### 断开平台

**端点**: `POST /api/trpc/platform.disconnect`

**请求体**:
```json
{
  "id": "conn-1"
}
```

### 刷新平台令牌

**端点**: `POST /api/trpc/platform.refreshToken`

**请求体**:
```json
{
  "id": "conn-1"
}
```

---

## 💰 成本 API

### 获取成本统计

**端点**: `GET /api/trpc/cost.stats?companyId={companyId}&period={period}`

**查询参数**:
- `companyId` (必需): 公司 ID
- `period` (可选): 统计周期 (`today`, `week`, `month`, `all`)，默认 `month`

**响应**:
```json
{
  "result": {
    "data": {
      "total": 15.50,
      "by_model": {
        "deepseek-chat": 10.20,
        "deepseek-reasoner": 5.30
      },
      "by_agent": {
        "agent-1": 8.00,
        "agent-2": 7.50
      },
      "by_date": [
        {
          "date": "2026-02-14",
          "cost": 2.50
        }
      ]
    }
  }
}
```

### 获取成本详情

**端点**: `GET /api/trpc/cost.list?companyId={companyId}&startDate={startDate}&endDate={endDate}`

**响应**:
```json
{
  "result": {
    "data": [
      {
        "id": "cost-1",
        "agent_id": "agent-1",
        "model": "deepseek-chat",
        "input_tokens": 1000,
        "output_tokens": 500,
        "cost": 0.05,
        "created_at": "2026-02-14T10:00:00Z"
      }
    ]
  }
}
```

---

## ⏰ 心跳 API

### 触发心跳

**端点**: `POST /api/cron/heartbeat`

**请求头**:
```
X-Cron-Secret: your-cron-secret
```

**请求体**:
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**响应**:
```json
{
  "success": true,
  "tasks_executed": 5,
  "duration": 12.5
}
```

### 获取心跳历史

**端点**: `GET /api/trpc/heartbeat.history?companyId={companyId}`

**响应**:
```json
{
  "result": {
    "data": [
      {
        "id": "hb-1",
        "company_id": "550e8400-e29b-41d4-a716-446655440000",
        "tasks_executed": 5,
        "duration": 12.5,
        "status": "success",
        "created_at": "2026-02-14T10:00:00Z"
      }
    ]
  }
}
```

---

## ❌ 错误处理

### 错误响应格式

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "data": {
      "path": "company.create",
      "input": {}
    }
  }
}
```

### 错误代码

| 代码 | HTTP 状态 | 说明 |
|------|----------|------|
| `UNAUTHORIZED` | 401 | 未认证或令牌无效 |
| `FORBIDDEN` | 403 | 无权限访问资源 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `BAD_REQUEST` | 400 | 请求参数错误 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |
| `RATE_LIMIT_EXCEEDED` | 429 | 超过速率限制 |
| `BUDGET_EXCEEDED` | 402 | 超过预算限制 |

### 速率限制

API 请求受到速率限制：

- **认证用户**: 100 请求/分钟
- **未认证用户**: 10 请求/分钟

响应头包含速率限制信息：

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1644840000
```

---

## 📊 Webhook

### 配置 Webhook

**端点**: `POST /api/trpc/webhook.create`

**请求体**:
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://your-domain.com/webhook",
  "events": ["task.completed", "task.failed", "cost.threshold"]
}
```

### Webhook 事件

#### task.completed

```json
{
  "event": "task.completed",
  "timestamp": "2026-02-14T10:00:00Z",
  "data": {
    "task_id": "task-1",
    "title": "Write blog post",
    "result": "Blog post content...",
    "cost": 0.03
  }
}
```

#### task.failed

```json
{
  "event": "task.failed",
  "timestamp": "2026-02-14T10:00:00Z",
  "data": {
    "task_id": "task-1",
    "title": "Write blog post",
    "error": "API rate limit exceeded"
  }
}
```

#### cost.threshold

```json
{
  "event": "cost.threshold",
  "timestamp": "2026-02-14T10:00:00Z",
  "data": {
    "company_id": "550e8400-e29b-41d4-a716-446655440000",
    "current_cost": 80.00,
    "budget": 100.00,
    "threshold": 0.8
  }
}
```

### Webhook 签名验证

每个 Webhook 请求都包含签名头：

```
X-Webhook-Signature: sha256=xxx
```

验证签名：

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}
```

---

## 🔧 SDK 示例

### TypeScript/JavaScript

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/routers/_app';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  ],
});

// 创建公司
const company = await client.company.create.mutate({
  name: 'My Company',
  type: 'marketing',
  budget: 100,
});

// 获取公司列表
const companies = await client.company.list.query();

// 创建任务
const task = await client.task.create.mutate({
  company_id: company.id,
  title: 'Write blog post',
  description: 'Write a blog post about AI trends',
  priority: 7,
});
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3000/api/trpc'
ACCESS_TOKEN = 'your-access-token'

headers = {
    'Authorization': f'Bearer {ACCESS_TOKEN}',
    'Content-Type': 'application/json',
}

# 创建公司
response = requests.post(
    f'{BASE_URL}/company.create',
    headers=headers,
    json={
        'name': 'My Company',
        'type': 'marketing',
        'budget': 100,
    }
)

company = response.json()['result']['data']

# 获取公司列表
response = requests.get(
    f'{BASE_URL}/company.list',
    headers=headers,
)

companies = response.json()['result']['data']
```

### cURL

```bash
# 创建公司
curl -X POST http://localhost:3000/api/trpc/company.create \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "type": "marketing",
    "budget": 100
  }'

# 获取公司列表
curl -X GET http://localhost:3000/api/trpc/company.list \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

---

## 📝 最佳实践

### 1. 认证

- 使用环境变量存储 API 密钥
- 定期刷新访问令牌
- 使用 HTTPS 保护传输

### 2. 错误处理

- 实现重试逻辑（指数退避）
- 记录错误日志
- 向用户显示友好的错误消息

### 3. 性能优化

- 使用批量 API 减少请求次数
- 实现客户端缓存
- 使用分页加载大量数据

### 4. 成本控制

- 监控 API 使用量
- 设置预算警告
- 优化任务优先级

---

## 🆘 获取帮助

如果遇到问题：

1. 查看 [用户指南](./USER_GUIDE.md)
2. 查看 [常见问题](#常见问题)
3. 提交 Issue 到 GitHub
4. 联系技术支持

---

**API 文档持续更新中...** 📚
