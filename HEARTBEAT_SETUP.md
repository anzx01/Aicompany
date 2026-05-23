# 心跳机制配置指南

本文档说明如何在 Supabase 中配置心跳机制，使其每 6 小时自动执行一次。

---

## 📋 前置条件

1. ✅ Supabase 项目已创建
2. ✅ pg_cron 扩展已启用（你已完成）
3. ✅ 应用已部署到可访问的 URL

---

## 🔧 配置步骤

### 1. 添加环境变量

在 `.env.local` 中添加：

```bash
# Cron Secret - 用于保护 cron 端点
CRON_SECRET=your-random-secret-here-change-this-in-production
```

生成随机密钥：
```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

### 2. 在 Supabase 中配置数据库设置

在 Supabase Dashboard 中执行以下 SQL：

```sql
-- 设置应用配置
ALTER DATABASE postgres SET app.heartbeat_api_url = 'https://your-domain.com/api/cron/heartbeat';
ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret-here';

-- 验证配置
SELECT current_setting('app.heartbeat_api_url', true);
SELECT current_setting('app.cron_secret', true);
```

**重要**：将 `your-domain.com` 替换为你的实际域名，将 `your-cron-secret-here` 替换为你生成的密钥。

### 3. 启用必要的扩展

在 Supabase SQL Editor 中执行：

```sql
-- 启用 pg_cron（你已完成）
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 启用 pg_net（用于异步 HTTP 请求）
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 验证扩展
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

### 4. 运行迁移脚本

#### 方法 A：使用 Supabase Dashboard

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/migrations/001_setup_heartbeat_cron.sql` 的内容
4. 执行 SQL
5. 复制 `supabase/migrations/002_setup_http_extension.sql` 的内容
6. 执行 SQL

#### 方法 B：使用 Supabase CLI（如果已安装）

```bash
# 初始化 Supabase（如果还没有）
supabase init

# 链接到你的项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

### 5. 验证 Cron 任务

在 Supabase SQL Editor 中执行：

```sql
-- 查看已调度的任务
SELECT * FROM cron.job;

-- 应该看到类似这样的输出：
-- jobid | schedule    | command                           | nodename  | nodeport | database | username | active | jobname
-- 1     | 0 */6 * * * | SELECT call_heartbeat_api_async() | localhost | 5432     | postgres | postgres | t      | heartbeat-execution

-- 查看任务执行历史
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### 6. 测试心跳端点

#### 测试 1：健康检查

```bash
curl https://your-domain.com/api/cron/heartbeat
```

应该返回：
```json
{
  "status": "ok",
  "endpoint": "heartbeat-cron",
  "timestamp": "2026-02-13T..."
}
```

#### 测试 2：手动触发心跳

```bash
curl -X POST https://your-domain.com/api/cron/heartbeat \
  -H "Authorization: Bearer your-cron-secret-here"
```

应该返回：
```json
{
  "success": true,
  "timestamp": "2026-02-13T...",
  "duration": 1234,
  "results": {
    "total": 2,
    "success": 2,
    "errors": 0
  },
  "details": [...]
}
```

#### 测试 3：从数据库手动触发

在 Supabase SQL Editor 中执行：

```sql
-- 手动调用心跳函数
SELECT call_heartbeat_api_async();

-- 等待几秒后查看结果
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 1;
```

---

## 📊 监控和调试

### 查看 Cron 执行日志

```sql
-- 查看最近的执行记录
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname = 'heartbeat-execution'
ORDER BY start_time DESC
LIMIT 20;
```

### 查看 HTTP 请求日志

```sql
-- 查看最近的 HTTP 请求
SELECT
  id,
  method,
  url,
  status_code,
  content,
  created
FROM net._http_response
ORDER BY created DESC
LIMIT 10;
```

### 应用日志

在你的应用日志中搜索 `[Heartbeat Cron]` 来查看执行情况。

---

## 🔄 调整心跳频率

### 修改为每小时执行一次

```sql
SELECT cron.unschedule('heartbeat-execution');

SELECT cron.schedule(
  'heartbeat-execution',
  '0 * * * *',  -- 每小时的第 0 分钟
  $$SELECT call_heartbeat_api_async()$$
);
```

### 修改为每 12 小时执行一次

```sql
SELECT cron.unschedule('heartbeat-execution');

SELECT cron.schedule(
  'heartbeat-execution',
  '0 */12 * * *',  -- 每 12 小时
  $$SELECT call_heartbeat_api_async()$$
);
```

### Cron 表达式说明

```
┌───────────── 分钟 (0 - 59)
│ ┌───────────── 小时 (0 - 23)
│ │ ┌───────────── 日期 (1 - 31)
│ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6) (0 = 周日)
│ │ │ │ │
* * * * *
```

常用示例：
- `0 */6 * * *` - 每 6 小时（00:00, 06:00, 12:00, 18:00）
- `0 * * * *` - 每小时
- `*/30 * * * *` - 每 30 分钟
- `0 0 * * *` - 每天午夜
- `0 9 * * 1` - 每周一上午 9 点

---

## 🛠️ 故障排除

### 问题 1：Cron 任务未执行

**检查**：
```sql
-- 确认任务是否激活
SELECT * FROM cron.job WHERE jobname = 'heartbeat-execution';

-- 查看错误日志
SELECT * FROM cron.job_run_details
WHERE jobname = 'heartbeat-execution'
AND status = 'failed'
ORDER BY start_time DESC;
```

**解决方案**：
- 确保 pg_cron 扩展已启用
- 确保函数权限正确
- 检查数据库配置是否正确

### 问题 2：HTTP 请求失败

**检查**：
```sql
-- 查看失败的请求
SELECT * FROM net._http_response
WHERE status_code >= 400
ORDER BY created DESC;
```

**解决方案**：
- 确认 API URL 正确且可访问
- 确认 CRON_SECRET 匹配
- 检查应用日志中的错误信息
- 确保应用已部署且运行中

### 问题 3：权限错误

**解决方案**：
```sql
-- 授予必要的权限
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;
```

### 问题 4：配置未生效

**解决方案**：
```sql
-- 重新加载配置
SELECT pg_reload_conf();

-- 或重启数据库连接
-- 在 Supabase Dashboard 中重启数据库
```

---

## 🔒 安全建议

1. **保护 CRON_SECRET**
   - 使用强随机密钥
   - 不要提交到版本控制
   - 定期轮换密钥

2. **限制 API 访问**
   - 只允许来自 Supabase IP 的请求（如果可能）
   - 添加速率限制
   - 记录所有请求

3. **监控异常**
   - 设置告警通知
   - 定期检查执行日志
   - 监控 API 响应时间

---

## 📈 性能优化

### 批量处理

如果有大量公司，考虑分批处理：

```typescript
// 修改 executeAllHeartbeats 函数
export async function executeAllHeartbeats(batchSize = 10): Promise<HeartbeatResult[]> {
  const activeCompanies = await db.query.companies.findMany({
    where: eq(companies.status, 'ACTIVE'),
  })

  const results: HeartbeatResult[] = []

  // 分批处理
  for (let i = 0; i < activeCompanies.length; i += batchSize) {
    const batch = activeCompanies.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(company => executeHeartbeat(company.id))
    )
    results.push(...batchResults)
  }

  return results
}
```

### 超时设置

在 API 路由中添加超时：

```typescript
export const maxDuration = 300 // 5 minutes
```

---

## 📝 下一步

1. ✅ 配置环境变量
2. ✅ 运行迁移脚本
3. ✅ 测试心跳端点
4. ✅ 验证 Cron 任务
5. ⏳ 等待第一次自动执行（最多 6 小时）
6. ⏳ 监控执行日志
7. ⏳ 根据需要调整频率

---

## 🎉 完成！

心跳机制现在应该已经配置完成。系统会每 6 小时自动：
1. 检查所有活跃公司
2. 执行待处理的任务
3. 创建新任务（如果需要）
4. 存储执行记录到记忆系统

你可以在 Dashboard 中查看心跳执行的结果和统计信息。
