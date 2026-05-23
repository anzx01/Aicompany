-- AI Company Builder Database Migration
-- Check and create missing tables only

-- Drop existing tables if you want to start fresh (OPTIONAL - UNCOMMENT IF NEEDED)
-- DROP TABLE IF EXISTS platform_connections CASCADE;
-- DROP TABLE IF EXISTS costs CASCADE;
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS memories CASCADE;
-- DROP TABLE IF EXISTS decisions CASCADE;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- DROP TABLE IF EXISTS agents CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Create tables only if they don't exist

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Companies table
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'INITIALIZING' NOT NULL,
	"description" text,
	"config" jsonb,
	"platform_connections" jsonb,
	"last_heartbeat" timestamp,
	"next_heartbeat" timestamp,
	"heartbeat_interval" integer DEFAULT 21600,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 3. Agents table
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text NOT NULL,
	"config" jsonb,
	"status" text DEFAULT 'IDLE' NOT NULL,
	"model" text DEFAULT 'claude-3-haiku' NOT NULL,
	"temperature" integer DEFAULT 70,
	"max_tokens" integer DEFAULT 4000,
	"last_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 4. Tasks table
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"priority" integer DEFAULT 5,
	"result" jsonb,
	"error" text,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 5. Decisions table
CREATE TABLE IF NOT EXISTS "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid,
	"question" text NOT NULL,
	"context" text,
	"options" jsonb,
	"user_choice" text,
	"user_feedback" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 6. Memories table
CREATE TABLE IF NOT EXISTS "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 7. Activities table
CREATE TABLE IF NOT EXISTS "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 8. Costs table
CREATE TABLE IF NOT EXISTS "costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"agent_id" uuid,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 9. Platform Connections table
CREATE TABLE IF NOT EXISTS "platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"credentials" jsonb,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add Foreign Key Constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_user_id_profiles_id_fk') THEN
        ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_profiles_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_company_id_companies_id_fk') THEN
        ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_company_id_companies_id_fk') THEN
        ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_agent_id_agents_id_fk') THEN
        ALTER TABLE "tasks" ADD CONSTRAINT "tasks_agent_id_agents_id_fk"
          FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_company_id_companies_id_fk') THEN
        ALTER TABLE "decisions" ADD CONSTRAINT "decisions_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_agent_id_agents_id_fk') THEN
        ALTER TABLE "decisions" ADD CONSTRAINT "decisions_agent_id_agents_id_fk"
          FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memories_company_id_companies_id_fk') THEN
        ALTER TABLE "memories" ADD CONSTRAINT "memories_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_company_id_companies_id_fk') THEN
        ALTER TABLE "activities" ADD CONSTRAINT "activities_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_agent_id_agents_id_fk') THEN
        ALTER TABLE "activities" ADD CONSTRAINT "activities_agent_id_agents_id_fk"
          FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'costs_company_id_companies_id_fk') THEN
        ALTER TABLE "costs" ADD CONSTRAINT "costs_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'costs_agent_id_agents_id_fk') THEN
        ALTER TABLE "costs" ADD CONSTRAINT "costs_agent_id_agents_id_fk"
          FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_connections_company_id_companies_id_fk') THEN
        ALTER TABLE "platform_connections" ADD CONSTRAINT "platform_connections_company_id_companies_id_fk"
          FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
