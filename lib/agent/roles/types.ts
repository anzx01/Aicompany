/**
 * Agent 角色类型定义
 */

import type { AgentDecision as BaseAgentDecision } from '../types'

export type AgentRole =
  | 'CEO'
  | 'PRODUCT_ANALYST'
  | 'CMO'
  | 'CONTENT_CREATOR'
  | 'SALES_MANAGER'
  | 'CONTENT_STRATEGIST'
  | 'WRITER'
  | 'EDITOR'
  | 'SUPPORT_LEAD'
  | 'TICKET_HANDLER'
  | 'TECH_LEAD'
  | 'ENGINEER'
  | 'QA_ENGINEER'
  | 'DEVOPS'

export type CompanyType = 'MARKETING' | 'CONTENT' | 'CUSTOMER_SERVICE' | 'DEVELOPMENT'

/**
 * Agent 能力定义
 */
export interface AgentCapability {
  name: string
  description: string
  requiredTools?: string[]
}

/**
 * Agent 角色配置
 */
export interface RoleConfig {
  role: AgentRole
  name: string
  description: string
  companyTypes: CompanyType[]
  capabilities: AgentCapability[]
  systemPrompt: string
  taskTypes: string[]
  priority: number // 1-10, 10 最高
}

/**
 * Agent 决策类型 - 使用基础类型
 */
export type DecisionType = BaseAgentDecision['type']

/**
 * Agent 决策 - 使用基础类型
 */
export type AgentDecision = BaseAgentDecision

/**
 * Agent 工具调用
 */
export interface ToolCall {
  tool: string
  parameters: Record<string, any>
  result?: any
  error?: string
}

/**
 * Agent 执行上下文
 */
export interface AgentExecutionContext {
  agentId: string
  companyId: string
  taskId: string
  role: AgentRole
  companyType: CompanyType
  availableTools: string[]
  memory: AgentMemoryItem[]
  recentDecisions: AgentDecision[]
}

/**
 * Agent 记忆项
 */
export interface AgentMemoryItem {
  id: string
  type: 'TASK' | 'DECISION' | 'INTERACTION' | 'LEARNING'
  content: string
  metadata?: Record<string, any>
  timestamp: Date
  importance: number // 0-1
}

/**
 * Agent 响应
 */
export interface AgentResponse {
  content: string
  decision: AgentDecision
  toolCalls?: ToolCall[]
  thoughts?: string
  nextSteps?: string[]
}
