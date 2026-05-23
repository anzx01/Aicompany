import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { tasks, companies } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

const TaskStatus = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);

export const taskRouter = router({
  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        agentId: z.string().uuid().optional(),
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        priority: z.number().min(1).max(10).optional(),
        scheduled_at: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

      const [task] = await ctx.db
        .insert(tasks)
        .values({
          company_id: input.companyId,
          agent_id: input.agentId || null,
          title: input.title,
          description: input.description,
          priority: input.priority || 5,
          status: 'PENDING',
          scheduled_at: input.scheduled_at,
        })
        .returning();

      return task;
    }),

  // List tasks for a company
  list: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        status: TaskStatus.optional(),
        limit: z.number().optional(),
      })
    )
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

      const conditions = [eq(tasks.company_id, input.companyId)];

      if (input.status) {
        conditions.push(eq(tasks.status, input.status));
      }

      return await ctx.db.query.tasks.findMany({
        where: and(...conditions),
        orderBy: [desc(tasks.created_at)],
        limit: input.limit || 50,
      });
    }),

  // Update task status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: TaskStatus,
        result: z.any().optional(),
        error: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: any = {
        status: input.status,
        updated_at: new Date(),
      };

      if (input.status === 'IN_PROGRESS') {
        updates.started_at = new Date();
      } else if (input.status === 'COMPLETED') {
        updates.completed_at = new Date();
        if (input.result) {
          updates.result = input.result;
        }
      } else if (input.status === 'FAILED') {
        updates.error = input.error;
      }

      const [updated] = await ctx.db
        .update(tasks)
        .set(updates)
        .where(eq(tasks.id, input.id))
        .returning();

      return updated;
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get task to verify ownership
      const task = await ctx.db.query.tasks.findFirst({
        where: eq(tasks.id, input.id),
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Verify user owns the company
      const company = await ctx.db.query.companies.findFirst({
        where: and(
          eq(companies.id, task.company_id),
          eq(companies.user_id, ctx.user.id)
        ),
      });

      if (!company) {
        throw new Error('Unauthorized');
      }

      await ctx.db.delete(tasks).where(eq(tasks.id, input.id));

      return { success: true };
    }),
});
