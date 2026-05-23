-- Security Configuration for AI Company Builder
-- This script sets up Row Level Security (RLS) policies for all tables

-- ============================================================================
-- 1. Enable RLS on all tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Profiles Table Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- 3. Companies Table Policies
-- ============================================================================

-- Users can view their own companies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own companies
CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own companies
CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Agents Table Policies
-- ============================================================================

-- Users can view agents of their companies
CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = agents.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert agents for their companies
CREATE POLICY "Users can insert own agents"
  ON agents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = agents.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can update agents of their companies
CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = agents.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can delete agents of their companies
CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = agents.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Tasks Table Policies
-- ============================================================================

-- Users can view tasks of their companies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert tasks for their companies
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can update tasks of their companies
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can delete tasks of their companies
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = tasks.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. Decisions Table Policies
-- ============================================================================

-- Users can view decisions of their companies
CREATE POLICY "Users can view own decisions"
  ON decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = decisions.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert decisions for their companies
CREATE POLICY "Users can insert own decisions"
  ON decisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = decisions.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can update decisions of their companies
CREATE POLICY "Users can update own decisions"
  ON decisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = decisions.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. Memories Table Policies
-- ============================================================================

-- Users can view memories of their companies
CREATE POLICY "Users can view own memories"
  ON memories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memories.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert memories for their companies
CREATE POLICY "Users can insert own memories"
  ON memories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memories.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can update memories of their companies
CREATE POLICY "Users can update own memories"
  ON memories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memories.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can delete memories of their companies
CREATE POLICY "Users can delete own memories"
  ON memories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = memories.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. Activities Table Policies
-- ============================================================================

-- Users can view activities of their companies
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = activities.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert activities for their companies
CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = activities.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. Costs Table Policies
-- ============================================================================

-- Users can view costs of their companies
CREATE POLICY "Users can view own costs"
  ON costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = costs.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert costs for their companies
CREATE POLICY "Users can insert own costs"
  ON costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = costs.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. Platform Connections Table Policies
-- ============================================================================

-- Users can view platform connections of their companies
CREATE POLICY "Users can view own platform connections"
  ON platform_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = platform_connections.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can insert platform connections for their companies
CREATE POLICY "Users can insert own platform connections"
  ON platform_connections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = platform_connections.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can update platform connections of their companies
CREATE POLICY "Users can update own platform connections"
  ON platform_connections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = platform_connections.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Users can delete platform connections of their companies
CREATE POLICY "Users can delete own platform connections"
  ON platform_connections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = platform_connections.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. Verify RLS is enabled
-- ============================================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 12. List all policies
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. All policies use auth.uid() to identify the current user
-- 2. Policies ensure users can only access data from their own companies
-- 3. Service role bypasses RLS, so be careful with service_role key
-- 4. Test policies thoroughly before deploying to production
-- 5. Consider adding policies for service accounts if needed
