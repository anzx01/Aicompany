// Agent State Machine

import type { AgentStatus, AgentContext, TaskExecution } from './types'

export class AgentStateMachine {
  private status: AgentStatus
  private context: AgentContext
  private currentTask: TaskExecution | null = null

  constructor(context: AgentContext) {
    this.context = context
    this.status = 'IDLE'
  }

  // Get current status
  getStatus(): AgentStatus {
    return this.status
  }

  // Get current task
  getCurrentTask(): TaskExecution | null {
    return this.currentTask
  }

  // Transition to a new state
  transition(newStatus: AgentStatus, task?: TaskExecution): void {
    const validTransitions: Record<AgentStatus, AgentStatus[]> = {
      IDLE: ['RUNNING', 'ERROR'],
      RUNNING: ['WAITING', 'COMPLETED', 'ERROR', 'IDLE'],
      WAITING: ['RUNNING', 'ERROR', 'IDLE'],
      ERROR: ['IDLE', 'RUNNING'],
      COMPLETED: ['IDLE', 'RUNNING'],
    }

    const allowed = validTransitions[this.status]
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid state transition: ${this.status} -> ${newStatus}`
      )
    }

    console.log(`[Agent ${this.context.agentId}] ${this.status} -> ${newStatus}`)
    this.status = newStatus

    if (task) {
      this.currentTask = task
    }
  }

  // Start executing a task
  async startTask(task: TaskExecution): Promise<void> {
    if (this.status !== 'IDLE') {
      throw new Error(`Agent is not idle. Current status: ${this.status}`)
    }

    this.transition('RUNNING', task)
  }

  // Mark task as waiting (e.g., waiting for user input)
  async waitForInput(): Promise<void> {
    if (this.status !== 'RUNNING') {
      throw new Error('Agent must be running to wait for input')
    }

    this.transition('WAITING')
  }

  // Resume from waiting
  async resume(): Promise<void> {
    if (this.status !== 'WAITING') {
      throw new Error('Agent must be waiting to resume')
    }

    this.transition('RUNNING')
  }

  // Complete current task
  async completeTask(): Promise<void> {
    if (this.status !== 'RUNNING') {
      throw new Error('Agent must be running to complete task')
    }

    this.transition('COMPLETED')
    this.currentTask = null

    // Auto-transition back to IDLE after completion
    setTimeout(() => {
      if (this.status === 'COMPLETED') {
        this.transition('IDLE')
      }
    }, 100)
  }

  // Handle error
  async handleError(error: Error): Promise<void> {
    console.error(`[Agent ${this.context.agentId}] Error:`, error)
    this.transition('ERROR')

    // Auto-transition back to IDLE after error
    setTimeout(() => {
      if (this.status === 'ERROR') {
        this.transition('IDLE')
      }
    }, 1000)
  }

  // Reset to idle
  async reset(): Promise<void> {
    this.status = 'IDLE'
    this.currentTask = null
  }

  // Check if agent can accept new tasks
  canAcceptTask(): boolean {
    return this.status === 'IDLE'
  }

  // Get context
  getContext(): AgentContext {
    return this.context
  }

  // Update context
  updateContext(updates: Partial<AgentContext>): void {
    this.context = { ...this.context, ...updates }
  }
}
