// Agent Executor - Executes tasks using LLM

import { db } from '@/lib/db'
import { agents, tasks, activities, companies, costs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { callLLM, trackCost } from '@/lib/llm'
import type { ModelTier } from '@/lib/llm'
import { AgentStateMachine } from './state-machine'
import type {
  AgentContext,
  AgentMemory,
  TaskExecution,
  AgentExecutionResult,
  AgentDecision,
} from './types'
import { AgentRoleExecutor, type AgentExecutionContext } from './roles'

export class AgentExecutor {
  private stateMachine: AgentStateMachine
  private agentId: string
  private companyId: string

  constructor(agentId: string, companyId: string) {
    this.agentId = agentId
    this.companyId = companyId

    // Initialize state machine (will be set up in initialize())
    this.stateMachine = null as any
  }

  /**
   * Initialize the executor by loading agent data
   */
  async initialize(): Promise<void> {
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, this.agentId),
    })

    if (!agent) {
      throw new Error(`Agent ${this.agentId} not found`)
    }

    const context: AgentContext = {
      agentId: this.agentId,
      companyId: this.companyId,
      role: agent.role,
      systemPrompt: agent.system_prompt,
      config: (agent.config as any) || {},
      memory: {
        shortTerm: [],
        longTerm: [],
      },
    }

    this.stateMachine = new AgentStateMachine(context)
  }

  /**
   * Execute a task
   */
  async executeTask(taskId: string): Promise<AgentExecutionResult> {
    const startTime = Date.now()

    try {
      // Load task
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      })

      if (!task) {
        throw new Error(`Task ${taskId} not found`)
      }

      // Create task execution
      const taskExecution: TaskExecution = {
        taskId: task.id,
        agentId: this.agentId,
        status: 'IN_PROGRESS',
        input: {
          title: task.title,
          description: task.description,
        },
        retryCount: 0,
        maxRetries: 3,
      }

      // Start task in state machine
      await this.stateMachine.startTask(taskExecution)

      // Log task start activity
      await this.logActivity('TASK_STARTED', {
        taskId,
        taskTitle: task.title,
      })

      // Load agent data
      const agent = await db.query.agents.findFirst({
        where: eq(agents.id, this.agentId),
      })

      if (!agent) {
        throw new Error(`Agent ${this.agentId} not found`)
      }

      // Load company data
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, this.companyId),
      })

      if (!company) {
        throw new Error(`Company ${this.companyId} not found`)
      }

      // Build execution context for role-based execution
      const roleContext: AgentExecutionContext = {
        agentId: this.agentId,
        companyId: this.companyId,
        taskId: task.id,
        role: agent.role as any,
        companyType: company.type as any,
        availableTools: [],
        memory: [],
        recentDecisions: [],
      }

      // Use role-based executor
      const roleResponse = await AgentRoleExecutor.executeTask(
        roleContext,
        task.description || task.title
      )

      // Track cost (estimate based on response length)
      const taskDesc = task.description || task.title || ''
      const estimatedTokens = Math.ceil((roleResponse.content.length + taskDesc.length) / 4)
      const estimatedCost = estimatedTokens * 0.000001 // Rough estimate

      // Record cost to database
      await db.insert(costs).values({
        company_id: this.companyId,
        agent_id: this.agentId,
        category: 'ai_api',
        amount: Math.ceil(estimatedCost * 100), // Convert to cents
        currency: 'USD',
        description: `Task execution: ${task.title}`,
        metadata: {
          taskId,
          tokensUsed: estimatedTokens,
        },
      })

      // Parse decisions from role response
      const decisions = [roleResponse.decision]

      // Update task with result
      await db
        .update(tasks)
        .set({
          status: 'COMPLETED',
          result: {
            content: roleResponse.content,
            decisions,
            thoughts: roleResponse.thoughts,
            nextSteps: roleResponse.nextSteps,
          },
          completed_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(tasks.id, taskId))

      // Log activity
      await this.logActivity('TASK_COMPLETED', {
        taskId,
        taskTitle: task.title,
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
      })

      // Complete task in state machine
      await this.stateMachine.completeTask()

      // Update agent status back to IDLE
      await db
        .update(agents)
        .set({
          status: 'IDLE',
          updated_at: new Date(),
        })
        .where(eq(agents.id, this.agentId))

      const duration = Date.now() - startTime

      return {
        success: true,
        output: roleResponse.content,
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
        duration,
        decisions,
      }
    } catch (error: any) {
      // Handle error
      await this.stateMachine.handleError(error)

      // Update task as failed
      await db
        .update(tasks)
        .set({
          status: 'FAILED',
          error: error.message,
          updated_at: new Date(),
        })
        .where(eq(tasks.id, taskId))

      // Update agent status back to IDLE
      await db
        .update(agents)
        .set({
          status: 'IDLE',
          updated_at: new Date(),
        })
        .where(eq(agents.id, this.agentId))

      // Log activity
      await this.logActivity('TASK_FAILED', {
        taskId,
        error: error.message,
      })

      const duration = Date.now() - startTime

      return {
        success: false,
        error: error.message,
        tokensUsed: 0,
        cost: 0,
        duration,
        decisions: [],
      }
    }
  }

  /**
   * Build prompt for a task
   */
  private buildTaskPrompt(task: any): string {
    return `
You are assigned the following task:

**Task**: ${task.title}
${task.description ? `**Description**: ${task.description}` : ''}
**Priority**: ${task.priority || 5}/10

Please analyze this task and provide:
1. Your approach to completing this task
2. Any decisions you need to make
3. The expected outcome
4. Any risks or blockers

Format your response clearly and concisely.
`.trim()
  }

  /**
   * Select model tier based on task priority
   */
  private selectModelTier(priority: number): ModelTier {
    if (priority >= 8) {
      return 'powerful' // High priority tasks
    } else if (priority >= 5) {
      return 'balanced' // Medium priority tasks
    } else {
      return 'fast' // Low priority tasks
    }
  }

  /**
   * Parse decisions from LLM response
   */
  private parseDecisions(content: string): AgentDecision[] {
    // Simple decision extraction
    // In a real implementation, this would use structured output or parsing
    const decisions: AgentDecision[] = []

    // Look for decision keywords
    if (content.toLowerCase().includes('execute') || content.toLowerCase().includes('implement')) {
      decisions.push({
        type: 'EXECUTE',
        reason: 'Agent decided to execute the task',
        confidence: 0.8,
      })
    }

    if (content.toLowerCase().includes('need') && content.toLowerCase().includes('user')) {
      decisions.push({
        type: 'ASK_USER',
        reason: 'Agent needs user input',
        confidence: 0.7,
        question: 'User input required',
      })
    }

    return decisions
  }

  /**
   * Log activity
   */
  private async logActivity(type: string, metadata: any): Promise<void> {
    await db.insert(activities).values({
      company_id: this.companyId,
      agent_id: this.agentId,
      type,
      description: `Agent ${this.agentId} ${type.toLowerCase().replace('_', ' ')}`,
      metadata,
    })
  }

  /**
   * Get agent status
   */
  getStatus() {
    return this.stateMachine.getStatus()
  }

  /**
   * Check if agent can accept tasks
   */
  canAcceptTask(): boolean {
    return this.stateMachine.canAcceptTask()
  }
}

// Global executor instances
const executors = new Map<string, AgentExecutor>()

/**
 * Get or create executor for an agent
 */
export async function getExecutor(
  agentId: string,
  companyId: string
): Promise<AgentExecutor> {
  if (!executors.has(agentId)) {
    const executor = new AgentExecutor(agentId, companyId)
    await executor.initialize()
    executors.set(agentId, executor)
  }

  return executors.get(agentId)!
}

/**
 * Execute a task with an agent
 */
export async function executeTask(
  agentId: string,
  companyId: string,
  taskId: string
): Promise<AgentExecutionResult> {
  const executor = await getExecutor(agentId, companyId)
  return await executor.executeTask(taskId)
}
