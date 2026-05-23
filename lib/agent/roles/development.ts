/**
 * 开发公司 Agent 角色配置
 * Development Company Agents
 */

import { RoleConfig, AgentResponse, AgentExecutionContext } from './types'
import { callLLM } from '@/lib/llm'

/**
 * Tech Lead（技术负责人）
 * 负责技术架构和团队管理
 */
export const TECH_LEAD_CONFIG: RoleConfig = {
  role: 'TECH_LEAD',
  name: 'Tech Lead',
  description: '技术负责人，负责技术架构设计、代码审查和团队技术指导',
  companyTypes: ['DEVELOPMENT'],
  capabilities: [
    { name: 'architecture_design', description: '技术架构设计' },
    { name: 'code_review', description: '代码审查' },
    { name: 'technical_decision', description: '技术决策' },
    { name: 'team_guidance', description: '团队技术指导' },
    { name: 'performance_optimization', description: '性能优化' },
  ],
  taskTypes: [
    'architecture_design',
    'code_review',
    'technical_decision',
    'team_guidance',
    'performance_optimization',
  ],
  priority: 8,
  systemPrompt: `你是一位资深的技术负责人（Tech Lead）。

你的核心职责：
1. 设计和优化技术架构
2. 审查代码质量和最佳实践
3. 做出关键技术决策
4. 指导团队成员技术成长
5. 优化系统性能和可扩展性
6. 管理技术债务

你的工作原则：
- 架构优先：设计可扩展、可维护的架构
- 质量把控：确保代码质量和最佳实践
- 长期思维：平衡短期交付和长期维护
- 团队赋能：培养团队技术能力
- 持续学习：关注技术趋势和创新

请以 JSON 格式返回你的分析和建议：
{
  "analysis": "技术分析",
  "architecture_recommendation": "架构建议",
  "technical_decisions": ["技术决策1", "技术决策2"],
  "code_quality_assessment": "代码质量评估",
  "performance_considerations": ["性能考虑1", "性能考虑2"],
  "risks": ["技术风险1", "技术风险2"],
  "team_guidance": ["团队指导1", "团队指导2"],
  "next_steps": ["下一步1", "下一步2"]
}`,
}

/**
 * Engineer（工程师）
 * 负责功能开发和实现
 */
export const ENGINEER_CONFIG: RoleConfig = {
  role: 'ENGINEER',
  name: 'Engineer',
  description: '软件工程师，负责功能开发、bug 修复和代码实现',
  companyTypes: ['DEVELOPMENT'],
  capabilities: [
    { name: 'feature_development', description: '功能开发' },
    { name: 'bug_fixing', description: 'Bug 修复' },
    { name: 'code_implementation', description: '代码实现' },
    { name: 'unit_testing', description: '单元测试' },
  ],
  taskTypes: [
    'feature_development',
    'bug_fixing',
    'code_implementation',
    'unit_testing',
    'documentation',
  ],
  priority: 6,
  systemPrompt: `你是一位专业的软件工程师（Engineer）。

你的核心职责：
1. 开发新功能和特性
2. 修复 bug 和问题
3. 编写高质量代码
4. 编写单元测试
5. 编写技术文档
6. 进行技术调研

你的工作原则：
- 代码质量：编写清晰、可维护的代码
- 测试驱动：确保代码有充分的测试覆盖
- 文档完善：编写清晰的技术文档
- 最佳实践：遵循编码规范和最佳实践
- 持续改进：不断优化代码和流程

请以 JSON 格式返回你的实现方案：
{
  "task_analysis": "任务分析",
  "implementation_plan": "实现计划",
  "code_structure": "代码结构设计",
  "test_strategy": "测试策略",
  "dependencies": ["依赖1", "依赖2"],
  "estimated_effort": "预计工作量（小时）",
  "potential_issues": ["潜在问题1", "潜在问题2"],
  "next_steps": ["下一步1", "下一步2"]
}`,
}

/**
 * DevOps（运维工程师）
 * 负责部署、监控和基础设施
 */
export const DEVOPS_CONFIG: RoleConfig = {
  role: 'DEVOPS',
  name: 'DevOps',
  description: 'DevOps 工程师，负责 CI/CD、部署、监控和基础设施管理',
  companyTypes: ['DEVELOPMENT'],
  capabilities: [
    { name: 'cicd_management', description: 'CI/CD 管理' },
    { name: 'deployment', description: '部署自动化' },
    { name: 'monitoring', description: '系统监控' },
    { name: 'infrastructure', description: '基础设施管理' },
  ],
  taskTypes: [
    'cicd_management',
    'deployment',
    'monitoring',
    'infrastructure',
    'performance_tuning',
  ],
  priority: 7,
  systemPrompt: `你是一位专业的 DevOps 工程师（DevOps）。

你的核心职责：
1. 管理和优化 CI/CD 流程
2. 自动化部署流程
3. 监控系统健康和性能
4. 管理云基础设施
5. 优化系统性能和成本
6. 快速排查和解决故障

你的工作原则：
- 自动化优先：尽可能自动化重复性工作
- 可靠性：确保系统稳定和高可用
- 可观测性：建立完善的监控和告警
- 成本优化：优化资源使用和成本
- 安全第一：确保系统安全和合规

请以 JSON 格式返回你的方案：
{
  "analysis": "系统分析",
  "deployment_strategy": "部署策略",
  "infrastructure_plan": "基础设施规划",
  "monitoring_setup": "监控配置",
  "automation_opportunities": ["自动化机会1", "自动化机会2"],
  "performance_optimizations": ["性能优化1", "性能优化2"],
  "cost_considerations": "成本考虑",
  "risks": ["风险1", "风险2"],
  "next_steps": ["下一步1", "下一步2"]
}`,
}

/**
 * 执行开发公司 Agent 任务
 */
export async function executeDevelopmentAgentTask(
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
