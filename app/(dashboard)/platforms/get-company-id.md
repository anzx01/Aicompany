# 如何获取 Company ID

Company ID 是一个 UUID 格式的字符串，用于唯一标识您的公司。

## 方法 1: 从 Dashboard 获取

1. 访问 `/dashboard` 页面
2. 在页面顶部或 URL 中可以看到您的 Company ID
3. 复制该 ID 并粘贴到平台测试页面

## 方法 2: 从数据库查询

```sql
-- 查询所有公司
SELECT id, name, type, created_at 
FROM companies 
ORDER BY created_at DESC;

-- 查询特定用户的公司
SELECT c.id, c.name, c.type 
FROM companies c
JOIN user_companies uc ON c.id = uc.company_id
WHERE uc.user_id = 'YOUR_USER_ID';
```

## 方法 3: 创建新公司

如果您还没有公司，请先访问 `/company/create` 创建一个新公司。

## UUID 格式示例

正确的 Company ID 格式：
```
123e4567-e89b-12d3-a456-426614174000
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

错误的格式：
```
947057797@qq.com  ❌ (这是邮箱地址)
12345             ❌ (太短)
company-name      ❌ (不是 UUID)
```
