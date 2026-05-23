// Heartbeat Service - Periodic company check-in and task execution

import { db } from '@/lib/db'
import { companies, agents, tasks, goals, costs } from '@/lib/db/schema'
import { eq, and, or, lte, isNull, gte, sql } from 'drizzle-orm'
import { executeTask } from '@/lib/agent/executor'
import { storeMemory } from '@/lib/memory'
import { executeCEOTask } from '@/lib/agent/roles/ceo'

export interface HeartbeatResult {
  companyId: string
  companyName: string
  tasksExecuted: number
  tasksCreated: number
  memoriesCreated: number
  errors: string[]
  timestamp: Date
}

/**
 * Execute heartbeat for a single company
 * This should be called periodically (e.g., every 6 hours)
 */
export async function executeHeartbeat(companyId: string): Promise<HeartbeatResult> {
  const result: HeartbeatResult = {
    companyId,
    companyName: '',
    tasksExecuted: 0,
    tasksCreated: 0,
    memoriesCreated: 0,
    errors: [],
    timestamp: new Date(),
  }

  try {
    // 1. Get company details
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    })

    if (!company) {
      result.errors.push('Company not found')
      return result
    }

    result.companyName = company.name

    // Check if company is active
    if (company.status !== 'ACTIVE') {
      result.errors.push(`Company status is ${company.status}, skipping heartbeat`)
      return result
    }

    // Check budget before executing tasks
    const budgetCheck = await checkBudget(companyId, company.config as any)
    if (budgetCheck.shouldPause) {
      // Auto-pause company if budget exceeded
      await db.update(companies)
        .set({ status: 'PAUSED', updated_at: new Date() })
        .where(eq(companies.id, companyId))

      result.errors.push(`Budget limit reached (${budgetCheck.percentageUsed}%). Company auto-paused.`)

      // Store memory of budget pause
      await storeMemory(
        companyId,
        'DECISION',
        `Company auto-paused due to budget limit. Used: $${budgetCheck.totalSpent.toFixed(2)} / $${budgetCheck.budget.toFixed(2)}`,
        90, // High importance
        {
          totalSpent: budgetCheck.totalSpent,
          budget: budgetCheck.budget,
          percentageUsed: budgetCheck.percentageUsed,
        }
      )

      return result
    }

    if (budgetCheck.shouldWarn) {
      result.errors.push(`Budget warning: ${budgetCheck.percentageUsed}% used ($${budgetCheck.totalSpent.toFixed(2)} / $${budgetCheck.budget.toFixed(2)})`)
    }

    // 2. Get all agents for this company
    const companyAgents = await db.query.agents.findMany({
      where: eq(agents.company_id, companyId),
    })

    if (companyAgents.length === 0) {
      result.errors.push('No agents found for company')
      return result
    }

    // 3. Find pending or scheduled tasks
    const pendingTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.company_id, companyId),
        or(
          eq(tasks.status, 'PENDING'),
          and(
            eq(tasks.status, 'SCHEDULED'),
            lte(tasks.scheduled_at, new Date())
          )
        )
      ),
      orderBy: (tasks, { desc }) => [desc(tasks.priority), desc(tasks.created_at)],
      limit: 10, // Process up to 10 tasks per heartbeat
    })

    // 4. Execute pending tasks
    for (const task of pendingTasks) {
      try {
        // Find an idle agent to execute the task
        const idleAgent = companyAgents.find(agent => agent.status === 'IDLE')

        if (!idleAgent) {
          result.errors.push(`No idle agent available for task ${task.id}`)
          continue
        }

        // Execute the task
        await executeTask(idleAgent.id, companyId, task.id)
        result.tasksExecuted++

        // Store memory of task completion
        await storeMemory(
          companyId,
          'TASK',
          `Completed task: ${task.title}. ${task.description || ''}`,
          60, // Medium importance
          {
            taskId: task.id,
            agentId: idleAgent.id,
            agentRole: idleAgent.role,
          }
        )
        result.memoriesCreated++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Failed to execute task ${task.id}: ${errorMessage}`)
      }
    }

    // 5. Check if CEO should create new tasks
    const ceoAgent = companyAgents.find(agent => agent.role === 'CEO')
    if (ceoAgent && pendingTasks.length < 3) {
      try {
        // Get recent memories for context
        const recentMemories = await db.query.memories.findMany({
          where: eq(companies.id, companyId),
          orderBy: (memories, { desc }) => [desc(memories.created_at)],
          limit: 10,
        })

        // Get completed tasks for context
        const completedTasks = await db.query.tasks.findMany({
          where: and(
            eq(tasks.company_id, companyId),
            eq(tasks.status, 'COMPLETED')
          ),
          orderBy: (tasks, { desc }) => [desc(tasks.completed_at)],
          limit: 5,
        })

        // Get active goals for context
        const activeGoals = await db.query.goals.findMany({
          where: and(
            eq(goals.company_id, companyId),
            eq(goals.status, 'ACTIVE')
          ),
          orderBy: (goals, { desc }) => [desc(goals.priority)],
          limit: 5,
        })

        // Ask CEO to analyze situation and create new tasks
        const ceoResponse = await executeCEOTask(
          {
            companyType: company.type as any,
            memory: recentMemories.map(m => ({
              content: m.content,
              type: m.type,
              importance: m.importance,
              timestamp: m.created_at,
            })),
            recentDecisions: [],
          },
          `Analyze the current company situation and create 2-3 new high-priority tasks to keep the company moving forward.

Current status:
- Pending tasks: ${pendingTasks.length}
- Recently completed: ${completedTasks.map(t => t.title).join(', ')}
- Company description: ${company.description || 'No description'}

Active Goals:
${activeGoals.map(g => `- ${g.title} (Priority: ${g.priority}, Progress: ${g.progress}%): ${g.description}`).join('\n')}

Please suggest specific, actionable tasks that align with the company's goals and current progress. Focus on tasks that will help achieve the active goals.`
        )

        // Parse CEO response to extract task suggestions
        const taskSuggestions = extractTasksFromCEOResponse(ceoResponse.content)

        // Create the suggested tasks
        for (const suggestion of taskSuggestions) {
          await db.insert(tasks).values({
            company_id: companyId,
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority || 7,
            status: 'PENDING',
          })
          result.tasksCreated++
        }

        console.log(`[Heartbeat] CEO created ${taskSuggestions.length} new tasks for company ${companyId}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`CEO task creation failed: ${errorMessage}`)
      }
    }

    // 6. Update company's last heartbeat time
    await db.update(companies)
      .set({
        updated_at: new Date(),
      })
      .where(eq(companies.id, companyId))

    // 7. Store heartbeat memory
    await storeMemory(
      companyId,
      'DECISION',
      `Heartbeat completed: ${result.tasksExecuted} tasks executed, ${result.errors.length} errors`,
      50,
      {
        tasksExecuted: result.tasksExecuted,
        tasksCreated: result.tasksCreated,
        errorCount: result.errors.length,
      }
    )
    result.memoriesCreated++

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(`Heartbeat failed: ${errorMessage}`)
  }

  return result
}

/**
 * Execute heartbeat for all active companies
 * This should be called by a cron job
 */
export async function executeAllHeartbeats(): Promise<HeartbeatResult[]> {
  // Get all active companies
  const activeCompanies = await db.query.companies.findMany({
    where: eq(companies.status, 'ACTIVE'),
  })

  const results: HeartbeatResult[] = []

  for (const company of activeCompanies) {
    try {
      const result = await executeHeartbeat(company.id)
      results.push(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        companyId: company.id,
        companyName: company.name,
        tasksExecuted: 0,
        tasksCreated: 0,
        memoriesCreated: 0,
        errors: [`Heartbeat failed: ${errorMessage}`],
        timestamp: new Date(),
      })
    }
  }

  return results
}

/**
 * Get heartbeat interval for a company (in hours)
 * Default is 6 hours, but can be customized based on company settings
 */
export function getHeartbeatInterval(company: any): number {
  // Check if company has custom heartbeat_interval
  if (company.heartbeat_interval && company.heartbeat_interval > 0) {
    return company.heartbeat_interval
  }

  // Default to 6 hours
  return 6
}

/**
 * Check if a company needs a heartbeat
 * Returns true if last heartbeat was more than interval hours ago
 */
export async function needsHeartbeat(companyId: string): Promise<boolean> {
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, companyId),
  })

  if (!company || company.status !== 'ACTIVE') {
    return false
  }

  const interval = getHeartbeatInterval(company)
  const intervalMs = interval * 60 * 60 * 1000 // Convert hours to milliseconds

  const lastUpdate = company.updated_at.getTime()
  const now = Date.now()

  return (now - lastUpdate) >= intervalMs
}

/**
 * Extract task suggestions from CEO response
 * Parses the CEO's response to extract actionable tasks
 */
function extractTasksFromCEOResponse(content: string): Array<{
  title: string
  description: string
  priority?: number
}> {
  const tasks: Array<{ title: string; description: string; priority?: number }> = []

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content)
    if (parsed.action_plan && Array.isArray(parsed.action_plan)) {
      parsed.action_plan.forEach((action: string, index: number) => {
        tasks.push({
          title: action.substring(0, 100), // Limit title length
          description: action,
          priority: 8 - index, // Descending priority
        })
      })
    }
  } catch {
    // If not JSON, try to extract tasks from text
    // Look for numbered lists or bullet points
    const lines = content.split('\n')
    let currentTask: { title: string; description: string; priority?: number } | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      // Match numbered items (1., 2., etc.) or bullet points (-, *, •)
      const taskMatch = trimmed.match(/^(?:\d+\.|[-*•])\s+(.+)$/)
      if (taskMatch) {
        if (currentTask) {
          tasks.push(currentTask)
        }
        currentTask = {
          title: taskMatch[1].substring(0, 100),
          description: taskMatch[1],
          priority: 8 - tasks.length,
        }
      } else if (currentTask && trimmed.length > 0 && !trimmed.startsWith('#')) {
        // Add to description if we're building a task
        currentTask.description += ' ' + trimmed
      }
    }

    if (currentTask) {
      tasks.push(currentTask)
    }
  }

  // If we couldn't extract any tasks, create a generic one
  if (tasks.length === 0) {
    tasks.push({
      title: 'Continue company operations',
      description: 'Review current progress and identify next steps based on company goals.',
      priority: 7,
    })
  }

  // Limit to 3 tasks maximum
  return tasks.slice(0, 3)
}

/**
 * Check budget and determine if company should be paused or warned
 */
async function checkBudget(
  companyId: string,
  config: any
): Promise<{
  budget: number
  totalSpent: number
  percentageUsed: number
  shouldWarn: boolean
  shouldPause: boolean
}> {
  // Get budget from company config (in dollars)
  const budget = config?.budget || 0

  // If no budget set, no limits
  if (budget <= 0) {
    return {
      budget: 0,
      totalSpent: 0,
      percentageUsed: 0,
      shouldWarn: false,
      shouldPause: false,
    }
  }

  // Calculate total spent this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const costRecords = await db.query.costs.findMany({
    where: and(
      eq(costs.company_id, companyId),
      gte(costs.created_at, startOfMonth)
    ),
  })

  // Sum up costs (stored in cents, convert to dollars)
  const totalSpent = costRecords.reduce((sum, cost) => sum + cost.amount, 0) / 100

  const percentageUsed = (totalSpent / budget) * 100

  return {
    budget,
    totalSpent,
    percentageUsed,
    shouldWarn: percentageUsed >= 80, // Warn at 80%
    shouldPause: percentageUsed >= 90, // Pause at 90%
  }
}
