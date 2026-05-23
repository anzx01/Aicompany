import { pgTable, uuid, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. profiles 表（用户资料）
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 2. companies 表（公司）
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').references(() => profiles.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // MARKETING | CONTENT | CUSTOMER_SERVICE | DEVELOPMENT
  status: text('status').default('INITIALIZING').notNull(), // INITIALIZING | ACTIVE | PAUSED | ARCHIVED
  description: text('description'),
  config: jsonb('config'),
  platform_connections: jsonb('platform_connections'),
  last_heartbeat: timestamp('last_heartbeat'),
  next_heartbeat: timestamp('next_heartbeat'),
  heartbeat_interval: integer('heartbeat_interval').default(21600), // 6 hours in seconds
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 3. agents 表（AI Agent）
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // CEO, CMO, Content_Creator, etc.
  name: text('name').notNull(),
  system_prompt: text('system_prompt').notNull(),
  config: jsonb('config'),
  status: text('status').default('IDLE').notNull(), // IDLE | RUNNING | ERROR
  model: text('model').default('claude-3-haiku').notNull(),
  temperature: integer('temperature').default(70), // 0-100
  max_tokens: integer('max_tokens').default(4000),
  last_run: timestamp('last_run'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 4. tasks 表（任务）
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  agent_id: uuid('agent_id').references(() => agents.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('PENDING').notNull(), // PENDING | IN_PROGRESS | COMPLETED | FAILED
  priority: integer('priority').default(5), // 1-10
  result: jsonb('result'),
  error: text('error'),
  scheduled_at: timestamp('scheduled_at'),
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 5. decisions 表（决策点）
export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  agent_id: uuid('agent_id').references(() => agents.id),
  question: text('question').notNull(),
  context: text('context'),
  options: jsonb('options'),
  user_choice: text('user_choice'),
  user_feedback: text('user_feedback'),
  status: text('status').default('PENDING').notNull(), // PENDING | APPROVED | REJECTED
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 6. memories 表（记忆系统）
// Note: vector type requires pgvector extension
// After enabling pgvector, uncomment the embedding field
export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // PRODUCT | MARKETING | CUSTOMER | DECISION
  content: text('content').notNull(),
  importance: integer('importance').default(50), // 0-100
  // embedding: sql`vector(1536)`, // Vector embedding for semantic search (OpenAI text-embedding-3-small)
  // Uncomment after running: supabase/migrations/003_enable_pgvector.sql
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 7. activities 表（活动日志）
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  agent_id: uuid('agent_id').references(() => agents.id),
  type: text('type').notNull(),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// 8. costs 表（成本追踪）
export const costs = pgTable('costs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  agent_id: uuid('agent_id').references(() => agents.id),
  category: text('category').notNull(), // ai_api | platform_fee | infrastructure
  amount: integer('amount').notNull(), // in cents
  currency: text('currency').default('USD').notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// 9. platform_connections 表（平台连接）
export const platformConnections = pgTable('platform_connections', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  platform: text('platform').notNull(), // twitter | product_hunt | medium | github | etc.
  connected: boolean('connected').default(false).notNull(),
  credentials: jsonb('credentials'), // encrypted
  last_sync_at: timestamp('last_sync_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// 10. goals 表（公司目标）
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  company_id: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  target_date: timestamp('target_date'),
  status: text('status').default('ACTIVE').notNull(), // ACTIVE | COMPLETED | CANCELLED
  priority: integer('priority').default(5), // 1-10
  kpis: jsonb('kpis'), // Key performance indicators
  progress: integer('progress').default(0), // 0-100
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Type exports for TypeScript
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;

export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

export type Cost = typeof costs.$inferSelect;
export type NewCost = typeof costs.$inferInsert;

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type NewPlatformConnection = typeof platformConnections.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
