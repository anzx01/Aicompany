/**
 * CEO Bot - 协调与决策
 *
 * 职责：
 * - 战略规划和目标设定
 * - 协调各部门 Agent
 * - 审批重要决策
 * - 监控公司整体表现
 * - 风险评估和管理
 */

import { RoleConfig, AgentRole, AgentResponse, AgentExecutionContext, DecisionType, CompanyType } from './types'
import { callLLM } from '@/lib/llm'

export const CEO_CONFIG: RoleConfig = {
  role: 'CEO',
  name: 'CEO Bot',
  description: '负责战略规划、协调各部门、审批重要决策和监控公司整体表现',
  companyTypes: ['MARKETING', 'CONTENT', 'CUSTOMER_SERVICE', 'DEVELOPMENT'],
  capabilities: [
    {
      name: 'strategic_planning',
      description: '制定公司战略和长期目标',
    },
    {
      name: 'team_coordination',
      description: '协调各部门 Agent 的工作',
    },
    {
      name: 'decision_approval',
      description: '审批重要决策和资源分配',
    },
    {
      name: 'performance_monitoring',
      description: '监控公司整体表现和 KPI',
    },
    {
      name: 'risk_management',
      description: '识别和管理业务风险',
    },
  ],
  systemPrompt: `你是一位经验丰富的 AI CEO，负责管理一家自动化公司。

你的核心职责：
1. **战略规划**：制定清晰的业务目标和执行计划
2. **团队协调**：确保各部门 Agent 高效协作
3. **决策审批**：评估和批准重要决策
4. **性能监控**：追踪 KPI 并及时调整策略
5. **风险管理**：识别潜在风险并制定应对方案

决策原则：
- 数据驱动：基于实际数据和指标做决策
- 长期思维：平衡短期收益和长期发展
- 资源优化：合理分配预算和人力资源
- 风险控制：识别风险并制定应对措施
- 团队赋能：授权团队成员，避免微观管理

输出格式：
{
  "analysis": "当前情况分析",
  "decision": {
    "type": "APPROVE|REJECT|DELEGATE|REQUEST_INFO|ESCALATE",
    "reason": "决策理由",
    "confidence": 0.85
  },
  "action_plan": ["具体行动步骤"],
  "kpis": ["需要监控的关键指标"],
  "risks": ["潜在风险"],
  "next_steps": ["后续步骤"]
}`,
  taskTypes: [
    'strategic_planning',
    'goal_setting',
    'budget_approval',
    'team_coordination',
    'performance_review',
    'risk_assessment',
    'crisis_management',
  ],
  priority: 10, // 最高优先级
}

/**
 * CEO Bot 执行任务
 */
export async function executeCEOTask(
  context: AgentExecutionContext,
  taskDescription: string
): Promise<AgentResponse> {
  const { companyType, memory, recentDecisions } = context

  // 构建上下文信息
  const contextInfo = `
公司类型：${companyType}
最近记忆：${memory.slice(0, 5).map((m) => m.content).join('\n')}
最近决策：${recentDecisions.slice(0, 3).map((d) => `${d.type}: ${d.reason}`).join('\n')}
`

  // 构建用户提示词
  const userPrompt = `
任务：${taskDescription}

上下文：
${contextInfo}

请分析当前情况并做出决策。
`

  try {
    // 调用 LLM（使用 Powerful 层级，因为 CEO 决策很重要）
    const response = await callLLM({
      tier: 'powerful',
      systemPrompt: CEO_CONFIG.systemPrompt,
      userPrompt,
      useCache: true,
    })

    // Check for error
    if ('error' in response) {
      throw new Error(response.error)
    }

    // 解析响应
    let parsedResponse: any
    try {
      // 尝试从 markdown 代码块中提取 JSON
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1])
      } else {
        parsedResponse = JSON.parse(response.content)
      }
    } catch (e) {
      // 如果解析失败，返回原始内容
      parsedResponse = {
        analysis: response.content,
        decision: {
          type: 'COMPLETE',
          reason: 'Task completed',
          confidence: 0.8,
        },
        action_plan: [],
        kpis: [],
        risks: [],
        next_steps: [],
      }
    }

    return {
      content: parsedResponse.analysis || response.content,
      decision: {
        type: (parsedResponse.decision?.type as DecisionType) || 'COMPLETE',
        reason: parsedResponse.decision?.reason || 'Task completed',
        confidence: parsedResponse.decision?.confidence || 0.8,
        nextAction: parsedResponse.next_steps?.[0],
        metadata: {
          action_plan: parsedResponse.action_plan,
          kpis: parsedResponse.kpis,
          risks: parsedResponse.risks,
        },
      },
      thoughts: parsedResponse.analysis,
      nextSteps: parsedResponse.next_steps,
    }
  } catch (error: any) {
    console.error('[CEO Bot] Execution error:', error)

    return {
      content: `Error executing CEO task: ${error.message}`,
      decision: {
        type: 'ESCALATE',
        reason: `Execution failed: ${error.message}`,
        confidence: 0,
      },
    }
  }
}

/**
 * CEO Bot 协调任务
 * 将任务分配给合适的 Agent
 */
export function coordinateTask(
  taskDescription: string,
  companyType: CompanyType
): { assignTo: AgentRole; reason: string } {
  // 根据任务类型和公司类型，决定分配给哪个 Agent
  const taskLower = taskDescription.toLowerCase()

  if (companyType === 'MARKETING') {
    if (taskLower.includes('分析') || taskLower.includes('研究') || taskLower.includes('市场')) {
      return { assignTo: 'PRODUCT_ANALYST', reason: '需要市场分析和数据研究' }
    }
    if (taskLower.includes('营销') || taskLower.includes('推广') || taskLower.includes('策略')) {
      return { assignTo: 'CMO', reason: '需要营销策略和推广计划' }
    }
    if (taskLower.includes('内容') || taskLower.includes('文案') || taskLower.includes('创作')) {
      return { assignTo: 'CONTENT_CREATOR', reason: '需要内容创作和文案撰写' }
    }
    return { assignTo: 'CMO', reason: '默认分配给 CMO 处理' }
  }

  if (companyType === 'CONTENT') {
    if (taskLower.includes('策略') || taskLower.includes('规划')) {
      return { assignTo: 'CONTENT_STRATEGIST', reason: '需要内容策略规划' }
    }
    if (taskLower.includes('写作') || taskLower.includes('撰写') || taskLower.includes('文章')) {
      return { assignTo: 'WRITER', reason: '需要专业写作' }
    }
    if (taskLower.includes('编辑') || taskLower.includes('审核') || taskLower.includes('修改')) {
      return { assignTo: 'EDITOR', reason: '需要内容编辑和审核' }
    }
    return { assignTo: 'CONTENT_STRATEGIST', reason: '默认分配给内容策略师' }
  }

  if (companyType === 'CUSTOMER_SERVICE') {
    if (taskLower.includes('工单') || taskLower.includes('客户') || taskLower.includes('问题')) {
      return { assignTo: 'TICKET_HANDLER', reason: '需要处理客户工单' }
    }
    return { assignTo: 'SUPPORT_LEAD', reason: '默认分配给客服主管' }
  }

  if (companyType === 'DEVELOPMENT') {
    if (taskLower.includes('架构') || taskLower.includes('设计') || taskLower.includes('技术')) {
      return { assignTo: 'TECH_LEAD', reason: '需要技术架构和设计' }
    }
    if (taskLower.includes('开发') || taskLower.includes('编码') || taskLower.includes('实现')) {
      return { assignTo: 'ENGINEER', reason: '需要代码开发' }
    }
    if (taskLower.includes('测试') || taskLower.includes('质量') || taskLower.includes('bug')) {
      return { assignTo: 'QA_ENGINEER', reason: '需要质量保证和测试' }
    }
    return { assignTo: 'TECH_LEAD', reason: '默认分配给技术主管' }
  }

  return { assignTo: 'CEO', reason: '无法确定，CEO 亲自处理' }
}
