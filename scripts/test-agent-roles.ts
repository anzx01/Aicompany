/**
 * Agent 角色系统快速测试脚本
 *
 * 使用方法：
 * npx tsx scripts/test-agent-roles.ts
 */

import { AgentRoleExecutor } from '../lib/agent/roles'

console.log('🧪 Agent 角色系统测试\n')

// 测试 1: 获取所有营销公司支持的角色
console.log('📋 测试 1: 获取营销公司支持的角色')
const marketingRoles = AgentRoleExecutor.getRolesForCompanyType('MARKETING')
console.log('支持的角色:', marketingRoles)
console.log('✅ 通过\n')

// 测试 2: 获取 CEO 配置
console.log('📋 测试 2: 获取 CEO 配置')
const ceoConfig = AgentRoleExecutor.getRoleConfig('CEO')
console.log('角色:', ceoConfig.role)
console.log('名称:', ceoConfig.name)
console.log('描述:', ceoConfig.description)
console.log('能力数量:', ceoConfig.capabilities.length)
console.log('任务类型:', ceoConfig.taskTypes)
console.log('优先级:', ceoConfig.priority)
console.log('✅ 通过\n')

// 测试 3: 获取 CMO 配置
console.log('📋 测试 3: 获取 CMO 配置')
const cmoConfig = AgentRoleExecutor.getRoleConfig('CMO')
console.log('角色:', cmoConfig.role)
console.log('名称:', cmoConfig.name)
console.log('能力:', cmoConfig.capabilities.map(c => c.name))
console.log('优先级:', cmoConfig.priority)
console.log('✅ 通过\n')

// 测试 4: CEO 任务协调 - 市场分析
console.log('📋 测试 4: CEO 任务协调 - 市场分析')
const task1 = AgentRoleExecutor.coordinateTask('分析竞品定价策略', 'MARKETING')
console.log('任务: 分析竞品定价策略')
console.log('分配给:', task1.assignTo)
console.log('原因:', task1.reason)
console.log('预期: PRODUCT_ANALYST')
console.log(task1.assignTo === 'PRODUCT_ANALYST' ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 5: CEO 任务协调 - 营销策略
console.log('📋 测试 5: CEO 任务协调 - 营销策略')
const task2 = AgentRoleExecutor.coordinateTask('制定本月营销推广计划', 'MARKETING')
console.log('任务: 制定本月营销推广计划')
console.log('分配给:', task2.assignTo)
console.log('原因:', task2.reason)
console.log('预期: CMO')
console.log(task2.assignTo === 'CMO' ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 6: CEO 任务协调 - 内容创作
console.log('📋 测试 6: CEO 任务协调 - 内容创作')
const task3 = AgentRoleExecutor.coordinateTask('写一篇关于 AI 的推文', 'MARKETING')
console.log('任务: 写一篇关于 AI 的推文')
console.log('分配给:', task3.assignTo)
console.log('原因:', task3.reason)
console.log('预期: CONTENT_CREATOR')
console.log(task3.assignTo === 'CONTENT_CREATOR' ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 7: 检查角色是否支持公司类型
console.log('📋 测试 7: 检查角色是否支持公司类型')
const ceosupportsMarketing = AgentRoleExecutor.isRoleSupportedForCompany('CEO', 'MARKETING')
const cmoSupportsMarketing = AgentRoleExecutor.isRoleSupportedForCompany('CMO', 'MARKETING')
const cmoSupportsContent = AgentRoleExecutor.isRoleSupportedForCompany('CMO', 'CONTENT')
console.log('CEO 支持 MARKETING:', ceosupportsMarketing)
console.log('CMO 支持 MARKETING:', cmoSupportsMarketing)
console.log('CMO 支持 CONTENT:', cmoSupportsContent)
console.log(ceosupportsMarketing && cmoSupportsMarketing && !cmoSupportsContent ? '✅ 通过' : '❌ 失败')
console.log()

// 测试 8: 测试所有营销角色配置
console.log('📋 测试 8: 验证所有营销角色配置完整性')
const roles = ['CEO', 'PRODUCT_ANALYST', 'CMO', 'CONTENT_CREATOR', 'SALES_MANAGER']
let allValid = true

roles.forEach(role => {
  try {
    const config = AgentRoleExecutor.getRoleConfig(role as any)
    const hasSystemPrompt = config.systemPrompt && config.systemPrompt.length > 0
    const hasCapabilities = config.capabilities && config.capabilities.length > 0
    const hasTaskTypes = config.taskTypes && config.taskTypes.length > 0

    console.log(`  ${role}:`, hasSystemPrompt && hasCapabilities && hasTaskTypes ? '✅' : '❌')

    if (!hasSystemPrompt || !hasCapabilities || !hasTaskTypes) {
      allValid = false
    }
  } catch (e) {
    console.log(`  ${role}: ❌ (配置缺失)`)
    allValid = false
  }
})

console.log(allValid ? '✅ 所有角色配置完整' : '❌ 部分角色配置不完整')
console.log()

// 总结
console.log('=' .repeat(50))
console.log('🎉 测试完成！')
console.log('=' .repeat(50))
console.log()
console.log('下一步：')
console.log('1. 访问 http://localhost:3000/agent-test')
console.log('2. 创建不同优先级的任务测试实际执行')
console.log('3. 查看 AGENT_ROLE_TEST_GUIDE.md 了解详细测试场景')
console.log()
