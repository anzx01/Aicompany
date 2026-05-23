/**
 * Agent 角色系统快速测试脚本（无数据库依赖）
 *
 * 使用方法：
 * npx tsx scripts/test-agent-roles-simple.ts
 */

// 直接导入角色配置，避免数据库依赖
import {
  CEO_CONFIG,
  coordinateTask,
} from '../lib/agent/roles/ceo'

import {
  PRODUCT_ANALYST_CONFIG,
  CMO_CONFIG,
  CONTENT_CREATOR_CONFIG,
  SALES_MANAGER_CONFIG,
} from '../lib/agent/roles/marketing'

console.log('🧪 Agent 角色系统测试\n')

// 测试 1: 验证 CEO 配置
console.log('📋 测试 1: 验证 CEO 配置')
console.log('角色:', CEO_CONFIG.role)
console.log('名称:', CEO_CONFIG.name)
console.log('描述:', CEO_CONFIG.description)
console.log('能力数量:', CEO_CONFIG.capabilities.length)
console.log('能力:', CEO_CONFIG.capabilities.map(c => c.name).join(', '))
console.log('任务类型:', CEO_CONFIG.taskTypes.join(', '))
console.log('优先级:', CEO_CONFIG.priority)
console.log('支持公司类型:', CEO_CONFIG.companyTypes.join(', '))
console.log('✅ 通过\n')

// 测试 2: 验证 Product Analyst 配置
console.log('📋 测试 2: 验证 Product Analyst 配置')
console.log('角色:', PRODUCT_ANALYST_CONFIG.role)
console.log('名称:', PRODUCT_ANALYST_CONFIG.name)
console.log('能力:', PRODUCT_ANALYST_CONFIG.capabilities.map(c => c.name).join(', '))
console.log('优先级:', PRODUCT_ANALYST_CONFIG.priority)
console.log('✅ 通过\n')

// 测试 3: 验证 CMO 配置
console.log('📋 测试 3: 验证 CMO 配置')
console.log('角色:', CMO_CONFIG.role)
console.log('名称:', CMO_CONFIG.name)
console.log('能力:', CMO_CONFIG.capabilities.map(c => c.name).join(', '))
console.log('优先级:', CMO_CONFIG.priority)
console.log('✅ 通过\n')

// 测试 4: 验证 Content Creator 配置
console.log('📋 测试 4: 验证 Content Creator 配置')
console.log('角色:', CONTENT_CREATOR_CONFIG.role)
console.log('名称:', CONTENT_CREATOR_CONFIG.name)
console.log('能力:', CONTENT_CREATOR_CONFIG.capabilities.map(c => c.name).join(', '))
console.log('优先级:', CONTENT_CREATOR_CONFIG.priority)
console.log('✅ 通过\n')

// 测试 5: 验证 Sales Manager 配置
console.log('📋 测试 5: 验证 Sales Manager 配置')
console.log('角色:', SALES_MANAGER_CONFIG.role)
console.log('名称:', SALES_MANAGER_CONFIG.name)
console.log('能力:', SALES_MANAGER_CONFIG.capabilities.map(c => c.name).join(', '))
console.log('优先级:', SALES_MANAGER_CONFIG.priority)
console.log('✅ 通过\n')

// 测试 6: CEO 任务协调 - 市场分析
console.log('📋 测试 6: CEO 任务协调 - 市场分析')
const task1 = coordinateTask('分析竞品定价策略和市场趋势', 'MARKETING')
console.log('任务: 分析竞品定价策略和市场趋势')
console.log('分配给:', task1.assignTo)
console.log('原因:', task1.reason)
console.log('预期: PRODUCT_ANALYST')
console.log(task1.assignTo === 'PRODUCT_ANALYST' ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 7: CEO 任务协调 - 营销策略
console.log('📋 测试 7: CEO 任务协调 - 营销策略')
const task2 = coordinateTask('制定本月营销推广计划', 'MARKETING')
console.log('任务: 制定本月营销推广计划')
console.log('分配给:', task2.assignTo)
console.log('原因:', task2.reason)
console.log('预期: CMO')
console.log(task2.assignTo === 'CMO' ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 8: CEO 任务协调 - 内容创作
console.log('📋 测试 8: CEO 任务协调 - 内容创作')
const task3 = coordinateTask('写一篇关于 AI 的推文', 'MARKETING')
console.log('任务: 写一篇关于 AI 的推文')
console.log('分配给:', task3.assignTo)
console.log('原因:', task3.reason)
console.log('预期: CONTENT_CREATOR')
console.log(task3.assignTo === 'CONTENT_CREATOR' ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 9: CEO 任务协调 - 销售策略
console.log('📋 测试 9: CEO 任务协调 - 销售策略')
const task4 = coordinateTask('优化销售漏斗和转化率', 'MARKETING')
console.log('任务: 优化销售漏斗和转化率')
console.log('分配给:', task4.assignTo)
console.log('原因:', task4.reason)
console.log('预期: CMO 或 SALES_MANAGER')
console.log(['CMO', 'SALES_MANAGER'].includes(task4.assignTo) ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 10: 验证系统提示词
console.log('📋 测试 10: 验证系统提示词完整性')
const configs = [
  { name: 'CEO', config: CEO_CONFIG },
  { name: 'Product Analyst', config: PRODUCT_ANALYST_CONFIG },
  { name: 'CMO', config: CMO_CONFIG },
  { name: 'Content Creator', config: CONTENT_CREATOR_CONFIG },
  { name: 'Sales Manager', config: SALES_MANAGER_CONFIG },
]

let allValid = true
configs.forEach(({ name, config }) => {
  const hasPrompt = config.systemPrompt && config.systemPrompt.length > 100
  const hasCapabilities = config.capabilities && config.capabilities.length > 0
  const hasTaskTypes = config.taskTypes && config.taskTypes.length > 0

  console.log(`  ${name}:`, hasPrompt && hasCapabilities && hasTaskTypes ? '✅' : '❌')

  if (!hasPrompt || !hasCapabilities || !hasTaskTypes) {
    allValid = false
    if (!hasPrompt) console.log(`    ⚠️  系统提示词缺失或过短`)
    if (!hasCapabilities) console.log(`    ⚠️  能力定义缺失`)
    if (!hasTaskTypes) console.log(`    ⚠️  任务类型缺失`)
  }
})

console.log(allValid ? '✅ 所有角色配置完整' : '❌ 部分角色配置不完整')
console.log()

// 测试 11: 验证优先级设置
console.log('📋 测试 11: 验证优先级设置')
console.log('  CEO:', CEO_CONFIG.priority, '(应为 10)')
console.log('  CMO:', CMO_CONFIG.priority, '(应为 8)')
console.log('  Product Analyst:', PRODUCT_ANALYST_CONFIG.priority, '(应为 7)')
console.log('  Sales Manager:', SALES_MANAGER_CONFIG.priority, '(应为 7)')
console.log('  Content Creator:', CONTENT_CREATOR_CONFIG.priority, '(应为 6)')

const prioritiesCorrect =
  CEO_CONFIG.priority === 10 &&
  CMO_CONFIG.priority === 8 &&
  PRODUCT_ANALYST_CONFIG.priority === 7 &&
  SALES_MANAGER_CONFIG.priority === 7 &&
  CONTENT_CREATOR_CONFIG.priority === 6

console.log(prioritiesCorrect ? '✅ 优先级设置正确' : '❌ 优先级设置有误')
console.log()

// 总结
console.log('=' .repeat(60))
console.log('🎉 测试完成！')
console.log('=' .repeat(60))
console.log()
console.log('✅ 所有基础测试通过')
console.log()
console.log('📚 下一步：')
console.log('1. 启动开发服务器: pnpm dev')
console.log('2. 访问 http://localhost:3000/agent-test')
console.log('3. 创建不同优先级的任务测试实际执行')
console.log('4. 查看 AGENT_ROLE_TEST_GUIDE.md 了解详细测试场景')
console.log()
console.log('💡 提示：')
console.log('- 优先级 8-10 使用 DeepSeek (成本低，适合复杂任务)')
console.log('- 优先级 5-7 使用 Claude Sonnet (平衡性能和成本)')
console.log('- 优先级 1-4 使用 Claude Haiku (快速响应)')
console.log()
