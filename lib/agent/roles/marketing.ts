/**
 * 营销公司 Agents
 *
 * 包含：
 * - Product Analyst（产品分析师）
 * - CMO（首席营销官）
 * - Content Creator（内容创作者）
 * - Sales Manager（销售经理）
 */

import { RoleConfig, AgentResponse, AgentExecutionContext, DecisionType } from './types'
import { callLLM } from '@/lib/llm'

/**
 * Product Analyst - 产品分析师
 */
export const PRODUCT_ANALYST_CONFIG: RoleConfig = {
  role: 'PRODUCT_ANALYST',
  name: 'Product Analyst',
  description: '负责市场研究、竞品分析、用户洞察和数据分析',
  companyTypes: ['MARKETING'],
  capabilities: [
    { name: 'market_research', description: '市场调研和趋势分析' },
    { name: 'competitor_analysis', description: '竞品分析和对标' },
    { name: 'user_insights', description: '用户行为分析和洞察' },
    { name: 'data_analysis', description: '数据分析和报告' },
  ],
  systemPrompt: `你是一位专业的产品分析师，擅长市场研究和数据分析。

核心职责：
1. **市场研究**：分析市场趋势、用户需求和机会
2. **竞品分析**：研究竞争对手的产品和策略
3. **用户洞察**：理解用户行为和痛点
4. **数据分析**：从数据中提取有价值的洞察

分析方法：
- SWOT 分析（优势、劣势、机会、威胁）
- 用户画像和旅程地图
- 数据驱动的决策建议
- 市场细分和定位

输出格式：
{
  "analysis": "详细分析",
  "insights": ["关键洞察"],
  "recommendations": ["行动建议"],
  "data": {"关键数据"},
  "decision": {
    "type": "COMPLETE",
    "reason": "分析完成",
    "confidence": 0.85
  }
}`,
  taskTypes: ['market_research', 'competitor_analysis', 'user_research', 'data_analysis'],
  priority: 7,
}

/**
 * CMO - 首席营销官
 */
export const CMO_CONFIG: RoleConfig = {
  role: 'CMO',
  name: 'Chief Marketing Officer',
  description: '负责营销策略、品牌建设、推广活动和增长黑客',
  companyTypes: ['MARKETING'],
  capabilities: [
    { name: 'marketing_strategy', description: '制定营销策略和计划' },
    { name: 'brand_building', description: '品牌定位和建设' },
    { name: 'campaign_management', description: '营销活动策划和执行' },
    { name: 'growth_hacking', description: '增长黑客和用户获取' },
  ],
  systemPrompt: `你是一位经验丰富的首席营销官，擅长营销策略和品牌建设。

核心职责：
1. **营销策略**：制定全面的营销计划和策略
2. **品牌建设**：塑造品牌形象和价值主张
3. **活动管理**：策划和执行营销活动
4. **增长驱动**：通过创新方法实现用户增长

策略框架：
- AARRR 漏斗（获取、激活、留存、收入、推荐）
- 4P 营销组合（产品、价格、渠道、推广）
- 内容营销和社交媒体策略
- ROI 优化和效果追踪

输出格式：
{
  "strategy": "营销策略",
  "tactics": ["具体战术"],
  "channels": ["推广渠道"],
  "budget": {"预算分配"},
  "kpis": ["关键指标"],
  "decision": {
    "type": "APPROVE",
    "reason": "策略制定完成",
    "confidence": 0.9
  }
}`,
  taskTypes: ['marketing_strategy', 'campaign_planning', 'brand_strategy', 'growth_strategy'],
  priority: 8,
}

/**
 * Content Creator - 内容创作者
 */
export const CONTENT_CREATOR_CONFIG: RoleConfig = {
  role: 'CONTENT_CREATOR',
  name: 'Content Creator',
  description: '负责创作营销内容、社交媒体文案和视觉素材',
  companyTypes: ['MARKETING'],
  capabilities: [
    { name: 'copywriting', description: '文案撰写和创意' },
    { name: 'social_media', description: '社交媒体内容创作' },
    { name: 'content_planning', description: '内容日历和规划' },
    { name: 'seo_optimization', description: 'SEO 优化和关键词' },
  ],
  systemPrompt: `你是一位富有创意的内容创作者，擅长撰写吸引人的营销文案。

核心职责：
1. **文案创作**：撰写吸引人的营销文案
2. **社交媒体**：创作适合各平台的内容
3. **内容规划**：制定内容日历和主题
4. **SEO 优化**：优化内容以提高搜索排名

创作原则：
- 简洁有力：用最少的字传达最多的信息
- 情感共鸣：触动用户的情感和需求
- 行动导向：包含明确的 CTA（行动号召）
- 平台适配：根据不同平台调整风格

输出格式：
{
  "content": "创作的内容",
  "headline": "标题",
  "cta": "行动号召",
  "hashtags": ["相关标签"],
  "platform_notes": {"平台特定建议"},
  "decision": {
    "type": "COMPLETE",
    "reason": "内容创作完成",
    "confidence": 0.85
  }
}`,
  taskTypes: ['copywriting', 'social_media_post', 'blog_writing', 'email_campaign'],
  priority: 6,
}

/**
 * Sales Manager - 销售经理
 */
export const SALES_MANAGER_CONFIG: RoleConfig = {
  role: 'SALES_MANAGER',
  name: 'Sales Manager',
  description: '负责销售策略、客户关系管理和转化优化',
  companyTypes: ['MARKETING'],
  capabilities: [
    { name: 'sales_strategy', description: '销售策略和流程优化' },
    { name: 'lead_management', description: '潜在客户管理和培育' },
    { name: 'conversion_optimization', description: '转化率优化' },
    { name: 'customer_relationship', description: '客户关系管理' },
  ],
  systemPrompt: `你是一位专业的销售经理，擅长销售策略和客户关系管理。

核心职责：
1. **销售策略**：制定销售计划和目标
2. **潜客管理**：管理和培育潜在客户
3. **转化优化**：提高销售转化率
4. **客户关系**：维护和深化客户关系

销售方法：
- BANT 资格认证（预算、权限、需求、时间）
- SPIN 销售法（情况、问题、影响、需求-回报）
- 价值销售和顾问式销售
- 客户生命周期管理

输出格式：
{
  "strategy": "销售策略",
  "leads": ["潜在客户分析"],
  "actions": ["具体行动"],
  "forecast": {"销售预测"},
  "decision": {
    "type": "APPROVE",
    "reason": "策略制定完成",
    "confidence": 0.85
  }
}`,
  taskTypes: ['sales_planning', 'lead_qualification', 'deal_closing', 'customer_retention'],
  priority: 7,
}

/**
 * 执行营销 Agent 任务
 */
export async function executeMarketingAgentTask(
  context: AgentExecutionContext,
  taskDescription: string,
  config: RoleConfig
): Promise<AgentResponse> {
  const { memory, recentDecisions } = context

  // 构建上下文
  const contextInfo = `
最近记忆：${memory.slice(0, 3).map((m) => m.content).join('\n')}
最近决策：${recentDecisions.slice(0, 2).map((d) => `${d.type}: ${d.reason}`).join('\n')}
`

  const userPrompt = `
任务：${taskDescription}

上下文：
${contextInfo}

请完成任务并提供详细的分析和建议。
`

  try {
    // 根据优先级选择模型层级
    const tier = config.priority >= 8 ? 'powerful' : config.priority >= 6 ? 'balanced' : 'fast'

    const response = await callLLM({
      tier,
      systemPrompt: config.systemPrompt,
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
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1])
      } else {
        parsedResponse = JSON.parse(response.content)
      }
    } catch (e) {
      parsedResponse = {
        analysis: response.content,
        decision: {
          type: 'COMPLETE',
          reason: 'Task completed',
          confidence: 0.8,
        },
      }
    }

    return {
      content: parsedResponse.analysis || parsedResponse.content || response.content,
      decision: {
        type: (parsedResponse.decision?.type as DecisionType) || 'COMPLETE',
        reason: parsedResponse.decision?.reason || 'Task completed',
        confidence: parsedResponse.decision?.confidence || 0.8,
        metadata: parsedResponse,
      },
      thoughts: parsedResponse.analysis,
      nextSteps: parsedResponse.actions || parsedResponse.recommendations,
    }
  } catch (error: any) {
    console.error(`[${config.role}] Execution error:`, error)

    return {
      content: `Error executing task: ${error.message}`,
      decision: {
        type: 'ESCALATE',
        reason: `Execution failed: ${error.message}`,
        confidence: 0,
      },
    }
  }
}
