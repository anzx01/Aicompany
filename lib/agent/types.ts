// Agent Engine Types

export type AgentStatus = 'IDLE' | 'RUNNING' | 'WAITING' | 'ERROR' | 'COMPLETED'

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED'

export interface AgentContext {
  agentId: string
  companyId: string
  role: string
  systemPrompt: string
  config: Record<string, any>
  memory: AgentMemory
}

export interface AgentMemory {
  shortTerm: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
  }>
  longTerm: Array<{
    type: string
    content: string
    importance: number
    timestamp: Date
  }>
}

export interface TaskExecution {
  taskId: string
  agentId: string
  status: TaskStatus
  input: any
  output?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
  retryCount: number
  maxRetries: number
}

export interface AgentDecision {
  type: 'EXECUTE' | 'DELEGATE' | 'ASK_USER' | 'SKIP' | 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'ESCALATE' | 'COMPLETE'
  reason: string
  confidence: number // 0-1
  nextAction?: string
  delegateTo?: string
  question?: string
  metadata?: Record<string, any>
}

export interface AgentMessage {
  from: string
  to: string
  type: 'TASK_REQUEST' | 'TASK_RESULT' | 'QUESTION' | 'NOTIFICATION'
  payload: any
  timestamp: Date
}

export interface AgentExecutionResult {
  success: boolean
  output?: any
  error?: string
  tokensUsed: number
  cost: number
  duration: number
  decisions: AgentDecision[]
}
