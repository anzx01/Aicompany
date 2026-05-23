-- 验证 Agent 角色更新
-- 检查当前数据库中的所有 Agent 角色

-- 1. 查看所有 Agent 及其角色
SELECT id, name, role, status, created_at
FROM agents
ORDER BY created_at DESC;

-- 2. 统计每个角色的数量
SELECT role, COUNT(*) as count
FROM agents
GROUP BY role
ORDER BY role;

-- 3. 查找可能还有旧角色名的 Agents
SELECT id, name, role
FROM agents
WHERE role LIKE '%_%'
  AND role != UPPER(role);

-- 4. 如果发现还有旧角色名，手动更新
-- 取消下面的注释来执行更新

-- UPDATE agents SET role = 'CONTENT_CREATOR' WHERE role = 'Content_Creator';
-- UPDATE agents SET role = 'SALES_MANAGER' WHERE role = 'Sales_Manager';
-- UPDATE agents SET role = 'PRODUCT_ANALYST' WHERE role = 'Product_Analyst';
