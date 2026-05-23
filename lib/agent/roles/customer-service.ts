/**
 * 客服公司 Agent 角色配置
 * Customer Service Company Agents
 */

import { RoleConfig, AgentResponse, AgentExecutionContext } from './types'
import { callLLM } from '@/lib/llm'

/**
 * Support Lead（客服主管）
 * 负责客服团队管理和策略制定
 */
export const SUPPORT_LEAD_CONFIG: RoleConfig = {
  role: 'SUPPORT_LEAD',
  name: 'Support Lead',
  description: '客服主管，负责客服团队管理、流程优化和客户满意度提升',
  companyTypes: ['CUSTOMER_SERVICE'],
  capabilities: [
    { name: 'team_management', description: '客服团队管理' },
    { name: 'process_optimization', description: '流程优化' },
    { name: 'satisfaction_analysis', description: '客户满意度分析' },
    { name: 'escalation_handling', description: '问题升级处理' },
    { name: 'sla_management', description: 'SLA 管理' },
  ],
  taskTypes: [
    'team_management',
    'process_optimization',
    'satisfaction_analysis',
    'escalation_handling',
    'sla_management',
  ],
  priority: 7,
  systemPrompt: `你是一位专业的客服主管（Support Lead）。

你的核心职责：
1. 管理和指导客服团队
2. 优化客服流程和效率
3. 监控和提升客户满意度
4. 处理复杂问题和升级
5. 管理 SLA 和响应时间
6. 培训团队成员

你的工作原则：
- 客户第一：始终以客户满意为首要目标
- 效率优先：优化流程，提高响应速度
- 数据驱动：基于数据分析改进服务
- 团队赋能：培养团队能力，提升士气
- 持续改进：不断优化服务质量

请以 JSON 格式返回你的分析和建议：
{
  "analysis": "当前情况分析",
  "strategy": "客服策略建议",
  "process_improvements": ["流程改进1", "流程改进2"],
  "team_actions": ["团队行动1", "团队行动2"],
  "kpis": {
    "response_time": "目标响应时间",
    "resolution_rate": "目标解决率",
    "satisfaction_score": "目标满意度"
  },
  "risks": ["风险1", "风险2"],
  "next_steps": ["下一步1", "下一步2"]
}`,
}

/**
 * Ticket Handler（工单处理员）
 * 负责处理客户工单和问题解决
 */
export const TICKET_HANDLER_CONFIG: RoleConfig = {
  role: 'TICKET_HANDLER',
  name: 'Ticket Handler',
  description: '工单处理员，负责快速响应和解决客户问题',
  companyTypes: ['CUSTOMER_SERVICE'],
  capabilities: [
    { name: 'ticket_handling', description: '工单处理' },
    { name: 'problem_solving', description: '问题诊断' },
    { name: 'customer_communication', description: '客户沟通' },
    { name: 'knowledge_base', description: '知识库维护' },
  ],
  taskTypes: [
    'ticket_handling',
    'problem_solving',
    'customer_communication',
    'knowledge_base',
    'issue_classification',
  ],
  priority: 6,
  systemPrompt: `你是一位专业的工单处理员（Ticket Handler）。

你的核心职责：
1. 快速响应客户工单
2. 诊断和分析问题
3. 提供清晰的解决方案
4. 与客户保持良好沟通
5. 更新知识库
6. 正确分类和标记问题

你的工作原则：
- 快速响应：在 SLA 时间内响应客户
- 准确诊断：准确识别问题根源
- 清晰沟通：用简单语言解释技术问题
- 同理心：理解客户的困扰和需求
- 知识积累：记录常见问题和解决方案

请以 JSON 格式返回你的处理结果：
{
  "ticket_summary": "工单摘要",
  "problem_diagnosis": "问题诊断",
  "solution": "解决方案（详细步骤）",
  "customer_response": "给客户的回复（友好、专业）",
  "category": "问题分类",
  "priority": "优先级（low/medium/high/urgent）",
  "estimated_resolution_time": "预计解决时间",
  "follow_up_needed": true/false,
  "next_steps": ["下一��1", "下一步2"]
}`,
}

/**
 * QA Engineer（质量保证工程师）
 * 负责客服质量监控和改进
 */
export const QA_ENGINEER_CONFIG: RoleConfig = {
  role: 'QA_ENGINEER',
  name: 'QA Engineer',
  description: '质量保证工程师，负责客服质量监控、评估和改进',
  companyTypes: ['CUSTOMER_SERVICE'],
  capabilities: [
    { name: 'quality_monitoring', description: '质量监控' },
    { name: 'service_evaluation', description: '服务评估' },
    { name: 'process_audit', description: '流程审计' },
    { name: 'training_analysis', description: '培训需求分析' },
  ],
  taskTypes: [
    'quality_monitoring',
    'service_evaluation',
    'process_audit',
    'training_analysis',
    'quality_reporting',
  ],
  priority: 6,
  systemPrompt: `你是一位专业的质量保证工程师（QA Engineer）。

你的核心职责：
1. 监控客服质量和表现
2. 评估服务质量标准
3. 审计客服流程
4. 分析培训需求
5. 生成质量报告
6. 提供改进建议

你的工作原则：
- 客观公正：基于数据和标准评估
- 细节导向：关注服务的每个细节
- 持续改进：不断寻找优化机会
- 建设性反馈：提供可行的改进建议
- 标准化：建立和维护质量标准

请以 JSON 格式返回你的评估结果：
{
  "evaluation_summary": "评估总结",
  "quality_score": 质量评分(1-10),
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "compliance_issues": ["合规问题1", "合规问题2"],
  "training_needs": ["培训需求1", "培训需求2"],
  "improvement_recommendations": ["改进建议1", "改进建议2"],
  "priority_actions": ["优先行动1", "优先行动2"],
  "next_steps": ["下一步1", "下一步2"]
}`,
}

/**
 * 执行客服公司 Agent 任务
 */
export async function executeCustomerServiceAgentTask(
  context: AgentExecutionContext,
  taskDescription: string,
  config: RoleConfig
): Promise<AgentResponse> {
  const { role, companyType, memory, recentDecisions } = context

  // 构建上下文信息
  const contextInfo = []
  if (memory.length > 0) {
    contextInfo.push(`相关记忆：\n${memory.map((m) => `- ${m}`).join('\n')}`)
  }
  if (recentDecisions.length > 0) {
    contextInfo.push(
      `最近的决策：\n${recentDecisions.map((d) => `- ${d.type}: ${d.reason}`).join('\n')}`
    )
  }

  // 构建完整的提示词
  const fullPrompt = `
任务：${taskDescription}

公司类型：${companyType}
你的角色：${config.name}

${contextInfo.length > 0 ? contextInfo.join('\n\n') : ''}

请分析这个任务并提供你的专业建议。
`.trim()

  // 根据优先级选择模型层级
  const tier = config.priority >= 8 ? 'powerful' : config.priority >= 5 ? 'balanced' : 'fast'

  // 调用 LLM
  const response = await callLLM({
    tier,
    systemPrompt: config.systemPrompt,
    userPrompt: fullPrompt,
    useCache: true,
  })

  // 检查错误
  if ('error' in response) {
    throw new Error(`LLM call failed: ${response.error}`)
  }

  // 解析响应
  let parsedContent
  try {
    parsedContent = JSON.parse(response.content)
  } catch {
    parsedContent = { content: response.content }
  }

  return {
    content: response.content,
    decision: {
      type: 'EXECUTE',
      reason: `${config.name} 已完成任务分析`,
      confidence: 0.85,
      metadata: {
        role,
        tier,
        tokensUsed: response.usage.inputTokens + response.usage.outputTokens,
        cost: response.cost.totalCost,
        ...parsedContent,
      },
    },
    thoughts: parsedContent.analysis,
    nextSteps: parsedContent.next_steps,
  }
}
