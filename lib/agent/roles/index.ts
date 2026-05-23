/**
 * Agent 角色注册表
 * 管理所有 Agent 角色配置和执行器
 */

import { AgentRole, RoleConfig, AgentResponse, AgentExecutionContext } from './types'
import { CEO_CONFIG, executeCEOTask, coordinateTask } from './ceo'
import {
  PRODUCT_ANALYST_CONFIG,
  CMO_CONFIG,
  CONTENT_CREATOR_CONFIG,
  SALES_MANAGER_CONFIG,
  executeMarketingAgentTask,
} from './marketing'
import {
  CONTENT_STRATEGIST_CONFIG,
  WRITER_CONFIG,
  EDITOR_CONFIG,
  executeContentAgentTask,
} from './content'
import {
  SUPPORT_LEAD_CONFIG,
  TICKET_HANDLER_CONFIG,
  QA_ENGINEER_CONFIG,
  executeCustomerServiceAgentTask,
} from './customer-service'
import {
  TECH_LEAD_CONFIG,
  ENGINEER_CONFIG,
  DEVOPS_CONFIG,
  executeDevelopmentAgentTask,
} from './development'

/**
 * 所有角色配置
 */
export const ROLE_CONFIGS: Record<AgentRole, RoleConfig> = {
  CEO: CEO_CONFIG,
  PRODUCT_ANALYST: PRODUCT_ANALYST_CONFIG,
  CMO: CMO_CONFIG,
  CONTENT_CREATOR: CONTENT_CREATOR_CONFIG,
  SALES_MANAGER: SALES_MANAGER_CONFIG,
  CONTENT_STRATEGIST: CONTENT_STRATEGIST_CONFIG,
  WRITER: WRITER_CONFIG,
  EDITOR: EDITOR_CONFIG,
  SUPPORT_LEAD: SUPPORT_LEAD_CONFIG,
  TICKET_HANDLER: TICKET_HANDLER_CONFIG,
  QA_ENGINEER: QA_ENGINEER_CONFIG,
  TECH_LEAD: TECH_LEAD_CONFIG,
  ENGINEER: ENGINEER_CONFIG,
  DEVOPS: DEVOPS_CONFIG,
}

/**
 * Agent 角色执行器
 */
export class AgentRoleExecutor {
  /**
   * 执行 Agent 任务
   */
  static async executeTask(
    context: AgentExecutionContext,
    taskDescription: string
  ): Promise<AgentResponse> {
    const { role } = context
    const config = ROLE_CONFIGS[role]

    if (!config || !config.systemPrompt) {
      throw new Error(`Role ${role} not implemented yet`)
    }

    // 根据角色调用对应的执行器
    switch (role) {
      case 'CEO':
        return executeCEOTask(context, taskDescription)

      case 'PRODUCT_ANALYST':
      case 'CMO':
      case 'CONTENT_CREATOR':
      case 'SALES_MANAGER':
        return executeMarketingAgentTask(context, taskDescription, config)

      case 'CONTENT_STRATEGIST':
      case 'WRITER':
      case 'EDITOR':
        return executeContentAgentTask(context, taskDescription, config)

      case 'SUPPORT_LEAD':
      case 'TICKET_HANDLER':
      case 'QA_ENGINEER':
        return executeCustomerServiceAgentTask(context, taskDescription, config)

      case 'TECH_LEAD':
      case 'ENGINEER':
      case 'DEVOPS':
        return executeDevelopmentAgentTask(context, taskDescription, config)

      default:
        throw new Error(`Executor for role ${role} not implemented yet`)
    }
  }

  /**
   * 获取角色配置
   */
  static getRoleConfig(role: AgentRole): RoleConfig {
    return ROLE_CONFIGS[role]
  }

  /**
   * 检查角色是否支持公司类型
   */
  static isRoleSupportedForCompany(role: AgentRole, companyType: string): boolean {
    const config = ROLE_CONFIGS[role]
    return config && config.companyTypes?.includes(companyType as any)
  }

  /**
   * 获取公司类型支持的所有角色
   */
  static getRolesForCompanyType(companyType: string): AgentRole[] {
    return Object.entries(ROLE_CONFIGS)
      .filter(([_, config]) => config.companyTypes?.includes(companyType as any))
      .map(([role]) => role as AgentRole)
  }

  /**
   * CEO 协调任务分配
   */
  static coordinateTask(taskDescription: string, companyType: any) {
    return coordinateTask(taskDescription, companyType)
  }
}

/**
 * 导出所有配置
 */
export * from './types'
export * from './ceo'
export * from './marketing'
export * from './content'
export * from './customer-service'
export * from './development'
