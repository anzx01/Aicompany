import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { companies, agents, tasks, platformConnections, goals, costs, activities } from '@/lib/db/schema';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { startScheduler } from '@/lib/agent/scheduler';

// Company type enum
const CompanyType = z.enum(['MARKETING', 'CONTENT', 'CUSTOMER_SERVICE', 'DEVELOPMENT']);
const CompanyStatus = z.enum(['INITIALIZING', 'ACTIVE', 'PAUSED', 'ARCHIVED']);

export const companyRouter = router({
  // Create a new company
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: CompanyType,
        description: z.string().optional(),
        config: z.object({
          budget: z.number().optional(),
          automationLevel: z.number().optional(),
        }).optional(),
        heartbeat_interval: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create company
      const [company] = await ctx.db
        .insert(companies)
        .values({
          user_id: ctx.user.id,
          name: input.name,
          type: input.type,
          description: input.description,
          status: 'INITIALIZING',
          config: input.config || {},
          platform_connections: {},
          heartbeat_interval: input.heartbeat_interval || 21600, // 6 hours
        })
        .returning();

      // Create default agents based on company type
      const agentTemplates = getAgentTemplates(input.type);

      for (const template of agentTemplates) {
        await ctx.db.insert(agents).values({
          company_id: company.id,
          role: template.role,
          name: template.name,
          system_prompt: template.system_prompt,
          config: template.config,
          status: 'IDLE',
          model: 'claude-3-haiku',
          temperature: 70,
          max_tokens: 4000,
        });
      }

      // Auto-activate company status
      await ctx.db
        .update(companies)
        .set({ status: 'ACTIVE', updated_at: new Date() })
        .where(eq(companies.id, company.id));

      // Generate initial tasks based on company type
      await generateInitialTasks(ctx.db, company.id, input.type, input.description);

      // Auto-start scheduler for autonomous operation
      startScheduler(company.id);
      console.log(`[Company] Auto-started scheduler for company ${company.id}`);

      return { ...company, status: 'ACTIVE' };
    }),

  // Get company by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, input.id),
          eq(companies.user_id, ctx.user.id)
        ),
        with: {
          // Note: Relations need to be defined in schema
        },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      return company;
    }),

  // List all companies for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log('[company.list] Fetching companies for user:', ctx.user.id);

      // Use select() instead of query API for better compatibility
      const userCompanies = await ctx.db
        .select()
        .from(companies)
        .where(eq(companies.user_id, ctx.user.id))
        .orderBy(desc(companies.created_at));

      console.log('[company.list] Found', userCompanies.length, 'companies');
      return userCompanies;
    } catch (error: any) {
      console.error('[company.list] Error:', error);
      console.error('[company.list] Error stack:', error.stack);
      console.error('[company.list] User ID:', ctx.user?.id);
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }
  }),

  // Get dashboard data
  getDashboard: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get company
      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, input.companyId),
          eq(companies.user_id, ctx.user.id)
        ),
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Get agents
      const companyAgents = await ctx.db.query.agents.findMany({
        where: eq(agents.company_id, input.companyId),
      });

      // Get recent tasks
      const recentTasks = await ctx.db.query.tasks.findMany({
        where: eq(tasks.company_id, input.companyId),
        orderBy: [desc(tasks.created_at)],
        limit: 20,
      });

      // Get platform connections
      const platforms = await ctx.db.query.platformConnections.findMany({
        where: eq(platformConnections.company_id, input.companyId),
      });

      // Get recent activities (last 50)
      const recentActivities = await ctx.db.query.activities.findMany({
        where: eq(activities.company_id, input.companyId),
        orderBy: [desc(activities.created_at)],
        limit: 50,
      });

      // Get costs for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyCosts = await ctx.db.query.costs.findMany({
        where: and(
          eq(costs.company_id, input.companyId),
          gte(costs.created_at, startOfMonth)
        ),
      });

      // Calculate total monthly cost
      const totalMonthlyCost = monthlyCosts.reduce((sum, cost) => sum + cost.amount, 0);
      const budget = (company.config as any)?.budget || 0;
      const budgetUsedPercent = budget > 0 ? (totalMonthlyCost / (budget * 100)) * 100 : 0;

      // Get cost breakdown by category
      const costByCategory = monthlyCosts.reduce((acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
        return acc;
      }, {} as Record<string, number>);

      // Mock AI report (will be replaced with real AI later)
      const completedToday = recentTasks.filter(t => {
        if (t.status !== 'COMPLETED' || !t.completed_at) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return t.completed_at >= today;
      }).length;

      const aiReport = {
        summary: `Your ${company.type.toLowerCase().replace('_', ' ')} company is running autonomously. ${completedToday} tasks completed today.`,
        completedToday,
        upcomingTasks: recentTasks.filter(t => t.status === 'PENDING').length,
        risks: budgetUsedPercent > 80 ? [
          {
            level: 'high' as const,
            description: `Budget usage at ${budgetUsedPercent.toFixed(1)}% - approaching limit`,
          },
        ] : [],
      };

      return {
        company,
        agents: companyAgents,
        tasks: recentTasks,
        platforms,
        activities: recentActivities,
        costs: {
          monthly: monthlyCosts,
          total: totalMonthlyCost,
          byCategory: costByCategory,
          budgetUsedPercent,
        },
        aiReport,
      };
    }),

  // Update company status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: CompanyStatus,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(companies)
        .set({ status: input.status, updated_at: new Date() })
        .where(
          and(
            eq(companies.id, input.id),
            eq(companies.user_id, ctx.user.id)
          )
        )
        .returning();

      return updated;
    }),

  // Create a goal
  createGoal: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        title: z.string().min(1).max(200),
        description: z.string(),
        targetDate: z.date().optional(),
        priority: z.number().min(1).max(10).optional(),
        kpis: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify company ownership
      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, input.companyId),
          eq(companies.user_id, ctx.user.id)
        ),
      });

      if (!company) {
        throw new Error('Company not found');
      }

      const [goal] = await ctx.db
        .insert(goals)
        .values({
          company_id: input.companyId,
          title: input.title,
          description: input.description,
          target_date: input.targetDate,
          priority: input.priority || 5,
          kpis: input.kpis ? { items: input.kpis } : null,
          status: 'ACTIVE',
          progress: 0,
        })
        .returning();

      return goal;
    }),

  // List goals for a company
  listGoals: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify company ownership
      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, input.companyId),
          eq(companies.user_id, ctx.user.id)
        ),
      });

      if (!company) {
        throw new Error('Company not found');
      }

      return await ctx.db.query.goals.findMany({
        where: eq(goals.company_id, input.companyId),
        orderBy: (goals, { desc }) => [desc(goals.priority), desc(goals.created_at)],
      });
    }),

  // Update goal progress
  updateGoalProgress: protectedProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        progress: z.number().min(0).max(100),
        status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify goal ownership through company
      const goal = await ctx.db.query.goals.findFirst({
        where: eq(goals.id, input.goalId),
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, goal.company_id),
          eq(companies.user_id, ctx.user.id)
        ),
      });

      if (!company) {
        throw new Error('Unauthorized');
      }

      const updates: any = {
        progress: input.progress,
        updated_at: new Date(),
      };

      if (input.status) {
        updates.status = input.status;
      }

      // Auto-complete if progress reaches 100%
      if (input.progress >= 100 && !input.status) {
        updates.status = 'COMPLETED';
      }

      const [updated] = await ctx.db
        .update(goals)
        .set(updates)
        .where(eq(goals.id, input.goalId))
        .returning();

      return updated;
    }),
});

// Helper function to get agent templates based on company type
function getAgentTemplates(type: string) {
  const templates: Record<string, any[]> = {
    MARKETING: [
      {
        role: 'CEO',
        name: 'CEO Bot',
        system_prompt: 'You are the CEO of this marketing company. Your role is to oversee strategy, coordinate agents, monitor progress, and make high-level decisions.',
        config: { tools: ['web_search', 'data_analysis'] },
      },
      {
        role: 'CMO',
        name: 'CMO Bot',
        system_prompt: 'You are the Chief Marketing Officer. Your role is to develop marketing strategies, analyze market trends, and coordinate marketing campaigns.',
        config: { tools: ['web_search', 'social_media', 'analytics'] },
      },
      {
        role: 'CONTENT_CREATOR',
        name: 'Content Creator Bot',
        system_prompt: 'You are a content creator. Your role is to create engaging marketing content, write posts, and optimize content for different platforms.',
        config: { tools: ['content_generation', 'image_generation'] },
      },
      {
        role: 'SALES_MANAGER',
        name: 'Sales Manager Bot',
        system_prompt: 'You are the Sales Manager. Your role is to track leads, manage customer relationships, and optimize conversion funnels.',
        config: { tools: ['crm', 'analytics', 'email'] },
      },
    ],
    CONTENT: [
      {
        role: 'CEO',
        name: 'CEO Bot',
        system_prompt: 'You are the CEO of this content company. Oversee content strategy and coordinate the team.',
        config: { tools: ['web_search', 'data_analysis'] },
      },
      {
        role: 'CONTENT_STRATEGIST',
        name: 'Content Strategist Bot',
        system_prompt: 'You develop content strategies and publishing plans.',
        config: { tools: ['web_search', 'analytics'] },
      },
      {
        role: 'WRITER',
        name: 'Writer Bot',
        system_prompt: 'You create high-quality written content.',
        config: { tools: ['content_generation'] },
      },
      {
        role: 'EDITOR',
        name: 'Editor Bot',
        system_prompt: 'You review and improve content quality.',
        config: { tools: ['content_analysis'] },
      },
    ],
    CUSTOMER_SERVICE: [
      {
        role: 'CEO',
        name: 'CEO Bot',
        system_prompt: 'You are the CEO of this customer service company. Oversee support operations.',
        config: { tools: ['web_search', 'data_analysis'] },
      },
      {
        role: 'SUPPORT_LEAD',
        name: 'Support Lead Bot',
        system_prompt: 'You manage customer support operations and ticket routing.',
        config: { tools: ['ticket_management', 'analytics'] },
      },
      {
        role: 'TICKET_HANDLER',
        name: 'Ticket Handler Bot',
        system_prompt: 'You handle customer support tickets and inquiries.',
        config: { tools: ['ticket_management', 'knowledge_base'] },
      },
      {
        role: 'QA_ENGINEER',
        name: 'QA Specialist Bot',
        system_prompt: 'You ensure quality of customer support responses.',
        config: { tools: ['quality_analysis'] },
      },
    ],
    DEVELOPMENT: [
      {
        role: 'CEO',
        name: 'CEO Bot',
        system_prompt: 'You are the CEO of this development company. Oversee development operations.',
        config: { tools: ['web_search', 'data_analysis'] },
      },
      {
        role: 'TECH_LEAD',
        name: 'Tech Lead Bot',
        system_prompt: 'You manage development projects and code reviews.',
        config: { tools: ['code_analysis', 'git'] },
      },
      {
        role: 'ENGINEER',
        name: 'Engineer Bot',
        system_prompt: 'You write and maintain code.',
        config: { tools: ['code_execution', 'git'] },
      },
      {
        role: 'DEVOPS',
        name: 'DevOps Bot',
        system_prompt: 'You manage deployments and infrastructure.',
        config: { tools: ['deployment', 'monitoring'] },
      },
    ],
  };

  return templates[type] || templates.MARKETING;
}

/**
 * Generate initial tasks for a new company
 */
async function generateInitialTasks(
  db: any,
  companyId: string,
  companyType: string,
  description?: string
): Promise<void> {
  const taskTemplates: Record<string, Array<{ title: string; description: string; priority: number }>> = {
    MARKETING: [
      {
        title: 'Analyze target market and competitors',
        description: 'Research the target market, identify key competitors, and analyze their strategies.',
        priority: 10,
      },
      {
        title: 'Develop initial marketing strategy',
        description: 'Create a comprehensive marketing strategy based on market analysis.',
        priority: 9,
      },
      {
        title: 'Set up social media presence',
        description: 'Create and optimize social media profiles on key platforms.',
        priority: 8,
      },
    ],
    CONTENT: [
      {
        title: 'Define content strategy and calendar',
        description: 'Create a content strategy and publishing calendar for the next 30 days.',
        priority: 10,
      },
      {
        title: 'Research trending topics in niche',
        description: 'Identify trending topics and keywords relevant to the target audience.',
        priority: 9,
      },
      {
        title: 'Create first batch of content',
        description: 'Write and prepare the first 5 pieces of content for publication.',
        priority: 8,
      },
    ],
    CUSTOMER_SERVICE: [
      {
        title: 'Set up support ticket system',
        description: 'Configure the ticket management system and define workflows.',
        priority: 10,
      },
      {
        title: 'Create knowledge base structure',
        description: 'Design and implement the knowledge base structure with initial articles.',
        priority: 9,
      },
      {
        title: 'Define support SLAs and metrics',
        description: 'Establish service level agreements and key performance metrics.',
        priority: 8,
      },
    ],
    DEVELOPMENT: [
      {
        title: 'Set up development environment',
        description: 'Configure development tools, repositories, and CI/CD pipelines.',
        priority: 10,
      },
      {
        title: 'Define technical architecture',
        description: 'Design the technical architecture and technology stack.',
        priority: 9,
      },
      {
        title: 'Create initial project roadmap',
        description: 'Develop a project roadmap with milestones and deliverables.',
        priority: 8,
      },
    ],
  };

  const templates = taskTemplates[companyType] || taskTemplates.MARKETING;

  // Insert initial tasks
  for (const template of templates) {
    await db.insert(tasks).values({
      company_id: companyId,
      title: template.title,
      description: description
        ? `${template.description}\n\nCompany context: ${description}`
        : template.description,
      priority: template.priority,
      status: 'PENDING',
    });
  }

  console.log(`[Company] Generated ${templates.length} initial tasks for company ${companyId}`);
}
