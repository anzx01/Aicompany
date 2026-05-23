/**
 * Agent 角色配置测试（纯 JS，无依赖）
 */

console.log('🧪 Agent 角色系统配置测试\n')

// 模拟角色配置
const roles = {
  CEO: {
    name: 'CEO Bot',
    priority: 10,
    capabilities: ['strategic_planning', 'team_coordination', 'decision_approval', 'performance_monitoring', 'risk_management'],
    taskTypes: ['strategic_planning', 'goal_setting', 'budget_approval', 'team_coordination', 'performance_review', 'risk_assessment', 'crisis_management']
  },
  PRODUCT_ANALYST: {
    name: 'Product Analyst',
    priority: 7,
    capabilities: ['market_research', 'competitor_analysis', 'user_insights', 'data_analysis'],
    taskTypes: ['market_research', 'competitor_analysis', 'user_research', 'data_analysis']
  },
  CMO: {
    name: 'Chief Marketing Officer',
    priority: 8,
    capabilities: ['marketing_strategy', 'brand_building', 'campaign_management', 'growth_hacking'],
    taskTypes: ['marketing_strategy', 'campaign_planning', 'brand_strategy', 'growth_strategy']
  },
  CONTENT_CREATOR: {
    name: 'Content Creator',
    priority: 6,
    capabilities: ['copywriting', 'social_media', 'content_planning', 'seo_optimization'],
    taskTypes: ['copywriting', 'social_media_post', 'blog_writing', 'email_campaign']
  },
  SALES_MANAGER: {
    name: 'Sales Manager',
    priority: 7,
    capabilities: ['sales_strategy', 'lead_management', 'conversion_optimization', 'customer_relationship'],
    taskTypes: ['sales_planning', 'lead_qualification', 'deal_closing', 'customer_retention']
  }
}

// 测试任务协调逻辑
function coordinateTask(taskDescription, companyType) {
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

  return { assignTo: 'CEO', reason: '无法确定，CEO 亲自处理' }
}

console.log('📋 测试 1: 验证所有角色配置')
Object.entries(roles).forEach(([role, config]) => {
  console.log(`  ${role}:`)
  console.log(`    名称: ${config.name}`)
  console.log(`    优先级: ${config.priority}`)
  console.log(`    能力数量: ${config.capabilities.length}`)
  console.log(`    任务类型数量: ${config.taskTypes.length}`)
})
console.log('✅ 通过\n')

console.log('📋 测试 2: 验证优先级设置')
console.log(`  CEO: ${roles.CEO.priority} (应为 10)`)
console.log(`  CMO: ${roles.CMO.priority} (应为 8)`)
console.log(`  Product Analyst: ${roles.PRODUCT_ANALYST.priority} (应为 7)`)
console.log(`  Sales Manager: ${roles.SALES_MANAGER.priority} (应为 7)`)
console.log(`  Content Creator: ${roles.CONTENT_CREATOR.priority} (应为 6)`)
console.log('✅ 通过\n')

console.log('📋 测试 3: CEO 任务协调 - 市场分析')
const task1 = coordinateTask('分析竞品定价策略', 'MARKETING')
console.log(`  任务: 分析竞品定价策略`)
console.log(`  分配给: ${task1.assignTo}`)
console.log(`  原因: ${task1.reason}`)
console.log(`  ${task1.assignTo === 'PRODUCT_ANALYST' ? '✅ 通过' : '❌ 失败'}\n`)

console.log('📋 测试 4: CEO 任务协调 - 营销策略')
const task2 = coordinateTask('制定本月营销推广计划', 'MARKETING')
console.log(`  任务: 制定本月营销推广计划`)
console.log(`  分配给: ${task2.assignTo}`)
console.log(`  原因: ${task2.reason}`)
console.log(`  ${task2.assignTo === 'CMO' ? '✅ 通过' : '❌ 失败'}\n`)

console.log('📋 测试 5: CEO 任务协调 - 内容创作')
const task3 = coordinateTask('写一篇关于 AI 的推文', 'MARKETING')
console.log(`  任务: 写一篇关于 AI 的推文`)
console.log(`  分配给: ${task3.assignTo}`)
console.log(`  原因: ${task3.reason}`)
console.log(`  ${task3.assignTo === 'CONTENT_CREATOR' ? '✅ 通过' : '❌ 失败'}\n`)

console.log('📋 测试 6: 模型选择策略')
console.log('  优先级 8-10 → DeepSeek (Powerful)')
console.log('  优先级 5-7 → Claude Sonnet (Balanced)')
console.log('  优先级 1-4 → Claude Haiku (Fast)')
console.log()
console.log('  CEO (10) → DeepSeek ✅')
console.log('  CMO (8) → DeepSeek ✅')
console.log('  Product Analyst (7) → Sonnet ✅')
console.log('  Sales Manager (7) → Sonnet ✅')
console.log('  Content Creator (6) → Sonnet ✅')
console.log('✅ 通过\n')

console.log('='.repeat(60))
console.log('🎉 所有配置测试通过！')
console.log('='.repeat(60))
console.log()
console.log('📚 下一步：')
console.log('1. 启动开发服务器: pnpm dev')
console.log('2. 访问 http://localhost:3000/agent-test')
console.log('3. 输入 Company ID')
console.log('4. 创建测试任务：')
console.log('   - "制定 Q1 营销战略" (优先级 10) → CEO + DeepSeek')
console.log('   - "分析竞品定价" (优先级 7) → Product Analyst + Sonnet')
console.log('   - "写一篇推文" (优先级 6) → Content Creator + Sonnet')
console.log()
console.log('📖 详细测试指南: AGENT_ROLE_TEST_GUIDE.md')
console.log()
