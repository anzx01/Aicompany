-- Migration: Update Agent Role Names to Match Code
-- Date: 2026-02-10
-- Purpose: Fix role name mismatch between database and code

-- Update Marketing company agents
UPDATE agents
SET role = 'CONTENT_CREATOR', updated_at = NOW()
WHERE role = 'Content_Creator';

UPDATE agents
SET role = 'SALES_MANAGER', updated_at = NOW()
WHERE role = 'Sales_Manager';

-- Update Content company agents
UPDATE agents
SET role = 'CONTENT_STRATEGIST', updated_at = NOW()
WHERE role = 'Content_Strategist';

UPDATE agents
SET role = 'WRITER', updated_at = NOW()
WHERE role = 'Writer';

UPDATE agents
SET role = 'EDITOR', updated_at = NOW()
WHERE role = 'Editor';

-- Update Customer Service company agents
UPDATE agents
SET role = 'SUPPORT_LEAD', updated_at = NOW()
WHERE role = 'Support_Lead';

UPDATE agents
SET role = 'TICKET_HANDLER', updated_at = NOW()
WHERE role = 'Ticket_Handler';

UPDATE agents
SET role = 'QA_ENGINEER', updated_at = NOW()
WHERE role = 'QA_Specialist';

-- Update Development company agents
UPDATE agents
SET role = 'TECH_LEAD', updated_at = NOW()
WHERE role = 'Tech_Lead';

UPDATE agents
SET role = 'ENGINEER', updated_at = NOW()
WHERE role = 'Engineer';

UPDATE agents
SET role = 'DEVOPS', updated_at = NOW()
WHERE role = 'DevOps';

-- Verify the updates
SELECT role, COUNT(*) as count
FROM agents
GROUP BY role
ORDER BY role;
