// Task Scheduler - Manages task queue and execution

import { db } from '@/lib/db'
import { tasks, agents } from '@/lib/db/schema'
import { eq, and, or, isNull, lt } from 'drizzle-orm'
import type { TaskExecution, TaskStatus } from './types'
import { executeTask } from './executor'

export class TaskScheduler {
  private companyId: string
  private pollingInterval: number = 5000 // 5 seconds
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null
  private isProcessing: boolean = false // Prevent concurrent ticks

  constructor(companyId: string) {
    this.companyId = companyId
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('[Scheduler] Already running')
      return
    }

    console.log(`[Scheduler] Starting for company ${this.companyId}`)
    this.isRunning = true

    // Run immediately
    this.tick()

    // Then run on interval
    this.intervalId = setInterval(() => {
      this.tick()
    }, this.pollingInterval)
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log(`[Scheduler] Stopping for company ${this.companyId}`)
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * One tick of the scheduler
   */
  private async tick(): Promise<void> {
    // Prevent concurrent execution
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      // Get pending tasks
      const pendingTasks = await this.getPendingTasks()

      if (pendingTasks.length === 0) {
        return
      }

      console.log(`[Scheduler] Found ${pendingTasks.length} pending tasks`)

      // Get available agents
      const availableAgents = await this.getAvailableAgents()

      if (availableAgents.length === 0) {
        console.log('[Scheduler] No available agents')
        return
      }

      // Assign tasks to agents
      await this.assignTasks(pendingTasks, availableAgents)
    } catch (error: any) {
      // Silently handle network errors to avoid log spam
      if (error?.cause?.code === 'ETIMEDOUT' ||
          error?.cause?.code === 'ENOTFOUND' ||
          error?.cause?.code === 'ENOENT') {
        // Network error - will retry on next tick
        return
      }
      // Log other errors
      console.error('[Scheduler] Error in tick:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Get pending tasks that are ready to execute
   */
  private async getPendingTasks(): Promise<any[]> {
    const now = new Date()

    return await db.query.tasks.findMany({
      where: and(
        eq(tasks.company_id, this.companyId),
        eq(tasks.status, 'PENDING'), // Only get truly pending tasks
        or(
          isNull(tasks.scheduled_at),
          lt(tasks.scheduled_at, now)
        )
      ),
      orderBy: (tasks, { asc, desc }) => [
        desc(tasks.priority),
        asc(tasks.created_at),
      ],
      limit: 10,
    })
  }

  /**
   * Get available agents (IDLE status)
   */
  private async getAvailableAgents(): Promise<any[]> {
    return await db.query.agents.findMany({
      where: and(
        eq(agents.company_id, this.companyId),
        eq(agents.status, 'IDLE')
      ),
    })
  }

  /**
   * Assign tasks to available agents
   */
  private async assignTasks(
    pendingTasks: any[],
    availableAgents: any[]
  ): Promise<void> {
    for (let i = 0; i < Math.min(pendingTasks.length, availableAgents.length); i++) {
      const task = pendingTasks[i]
      const agent = availableAgents[i]

      try {
        // Assign task to agent
        await this.assignTask(task, agent)
      } catch (error) {
        console.error(`[Scheduler] Failed to assign task ${task.id} to agent ${agent.id}:`, error)
      }
    }
  }

  /**
   * Assign a specific task to a specific agent
   */
  private async assignTask(task: any, agent: any): Promise<void> {
    console.log(`[Scheduler] Assigning task ${task.id} to agent ${agent.id}`)

    try {
      // Use a transaction to ensure atomicity
      // First, verify the agent is still IDLE and task is still PENDING
      const currentAgent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, agent.id),
          eq(agents.status, 'IDLE')
        )
      })

      const currentTask = await db.query.tasks.findFirst({
        where: and(
          eq(tasks.id, task.id),
          eq(tasks.status, 'PENDING')
        )
      })

      if (!currentAgent) {
        console.log(`[Scheduler] Agent ${agent.id} is no longer available`)
        return
      }

      if (!currentTask) {
        console.log(`[Scheduler] Task ${task.id} is no longer pending`)
        return
      }

      // Update task status
      await db
        .update(tasks)
        .set({
          agent_id: agent.id,
          status: 'IN_PROGRESS',
          started_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(tasks.id, task.id))

      // Update agent status
      await db
        .update(agents)
        .set({
          status: 'RUNNING',
          last_run: new Date(),
          updated_at: new Date(),
        })
        .where(eq(agents.id, agent.id))

      // Trigger agent execution asynchronously
      // Don't await to allow scheduler to continue processing other tasks
      executeTask(agent.id, this.companyId, task.id).catch((error) => {
        console.error(`[Scheduler] Task execution failed for task ${task.id}:`, error)
      })
    } catch (error) {
      console.error(`[Scheduler] Error assigning task ${task.id}:`, error)
      throw error
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<any> {
    return await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    })
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    result?: any,
    error?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date(),
    }

    if (status === 'COMPLETED') {
      updates.completed_at = new Date()
      updates.result = result
    }

    if (status === 'FAILED') {
      updates.error = error
    }

    await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
  }

  /**
   * Create a new task
   */
  async createTask(taskData: {
    title: string
    description?: string
    priority?: number
    scheduled_at?: Date
    agent_id?: string
  }): Promise<string> {
    const result = await db
      .insert(tasks)
      .values({
        company_id: this.companyId,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 5,
        scheduled_at: taskData.scheduled_at,
        agent_id: taskData.agent_id || null,
        status: 'PENDING',
      })
      .returning({ id: tasks.id })

    return result[0].id
  }

  /**
   * Get task statistics
   */
  async getStatistics(): Promise<{
    pending: number
    inProgress: number
    completed: number
    failed: number
  }> {
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.company_id, this.companyId),
    })

    return {
      pending: allTasks.filter((t) => t.status === 'PENDING').length,
      inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: allTasks.filter((t) => t.status === 'COMPLETED').length,
      failed: allTasks.filter((t) => t.status === 'FAILED').length,
    }
  }
}

// Global scheduler instances (one per company)
const schedulers = new Map<string, TaskScheduler>()

/**
 * Get or create scheduler for a company
 */
export function getScheduler(companyId: string): TaskScheduler {
  if (!schedulers.has(companyId)) {
    const scheduler = new TaskScheduler(companyId)
    schedulers.set(companyId, scheduler)
  }

  return schedulers.get(companyId)!
}

/**
 * Start scheduler for a company
 */
export function startScheduler(companyId: string): void {
  const scheduler = getScheduler(companyId)
  scheduler.start()
}

/**
 * Stop scheduler for a company
 */
export function stopScheduler(companyId: string): void {
  const scheduler = schedulers.get(companyId)
  if (scheduler) {
    scheduler.stop()
  }
}
