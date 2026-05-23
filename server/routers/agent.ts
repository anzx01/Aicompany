import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { agents, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { executeTask, getExecutor, startScheduler, stopScheduler, getScheduler } from '@/lib/agent';

export const agentRouter = router({
  // Get all agents for a company
  getByCompany: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the company
      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, input.companyId),
          eq(companies.user_id, ctx.user.id)
        ),
      });

      if (!company) {
        throw new Error('Company not found');
      }

      return await ctx.db.query.agents.findMany({
        where: eq(agents.company_id, input.companyId),
      });
    }),

  // Update agent configuration
  updateConfig: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        system_prompt: z.string().optional(),
        model: z.string().optional(),
        temperature: z.number().min(0).max(100).optional(),
        max_tokens: z.number().optional(),
        config: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [updated] = await ctx.db
        .update(agents)
        .set({
          ...updates,
          updated_at: new Date(),
        })
        .where(eq(agents.id, id))
        .returning();

      return updated;
    }),

  // Generate agents using AI (Mock version)
  generate: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        requirements: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Mock AI generation - in real implementation, this would call Claude API
      const mockAgents = [
        {
          role: 'Custom_Agent_1',
          name: 'Custom Agent 1',
          system_prompt: `You are a custom agent generated based on: ${input.requirements}`,
          config: { tools: ['web_search'] },
        },
        {
          role: 'Custom_Agent_2',
          name: 'Custom Agent 2',
          system_prompt: `You are another custom agent for: ${input.requirements}`,
          config: { tools: ['data_analysis'] },
        },
      ];

      const createdAgents = [];

      for (const agentData of mockAgents) {
        const [agent] = await ctx.db
          .insert(agents)
          .values({
            company_id: input.companyId,
            ...agentData,
            status: 'IDLE',
            model: 'claude-3-haiku',
            temperature: 70,
            max_tokens: 4000,
          })
          .returning();

        createdAgents.push(agent);
      }

      return createdAgents;
    }),

  // Execute a task with a specific agent
  executeTask: protectedProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        companyId: z.string().uuid(),
        taskId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await executeTask(input.agentId, input.companyId, input.taskId);
      return result;
    }),

  // Get agent status
  getStatus: protectedProcedure
    .input(
      z.object({
        agentId: z.string().uuid(),
        companyId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const executor = await getExecutor(input.agentId, input.companyId);
      return {
        status: executor.getStatus(),
        canAcceptTask: executor.canAcceptTask(),
      };
    }),

  // Start scheduler for a company
  startScheduler: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      startScheduler(input.companyId);
      return { success: true, message: 'Scheduler started' };
    }),

  // Stop scheduler for a company
  stopScheduler: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      stopScheduler(input.companyId);
      return { success: true, message: 'Scheduler stopped' };
    }),

  // Get scheduler statistics
  getSchedulerStats: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ input }) => {
      const scheduler = getScheduler(input.companyId);
      const stats = await scheduler.getStatistics();
      return stats;
    }),
});
