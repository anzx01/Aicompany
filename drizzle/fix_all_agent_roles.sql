-- 简单直接的角色名更新脚本
-- 一次性更新所有可能的旧角色名

-- 首先查看当前的角色
SELECT DISTINCT role FROM agents;

-- 更新所有旧角色名（不管是否存在）
UPDATE agents SET role = 'CONTENT_CREATOR' WHERE role IN ('Content_Creator', 'content_creator');
UPDATE agents SET role = 'SALES_MANAGER' WHERE role IN ('Sales_Manager', 'sales_manager');
UPDATE agents SET role = 'PRODUCT_ANALYST' WHERE role IN ('Product_Analyst', 'product_analyst');
UPDATE agents SET role = 'CONTENT_STRATEGIST' WHERE role IN ('Content_Strategist', 'content_strategist');
UPDATE agents SET role = 'WRITER' WHERE role IN ('Writer', 'writer');
UPDATE agents SET role = 'EDITOR' WHERE role IN ('Editor', 'editor');
UPDATE agents SET role = 'SUPPORT_LEAD' WHERE role IN ('Support_Lead', 'support_lead');
UPDATE agents SET role = 'TICKET_HANDLER' WHERE role IN ('Ticket_Handler', 'ticket_handler');
UPDATE agents SET role = 'QA_ENGINEER' WHERE role IN ('QA_Specialist', 'QA_Engineer', 'qa_engineer', 'qa_specialist');
UPDATE agents SET role = 'TECH_LEAD' WHERE role IN ('Tech_Lead', 'tech_lead');
UPDATE agents SET role = 'ENGINEER' WHERE role IN ('Engineer', 'engineer');
UPDATE agents SET role = 'DEVOPS' WHERE role IN ('DevOps', 'devops');

-- 再次查看更新后的角色
SELECT DISTINCT role FROM agents;

-- 查看所有 agents 的详细信息
SELECT id, name, role, company_id FROM agents ORDER BY created_at DESC;
