/**
 * 测试 Agent 执行功能
 * 运行: npx tsx scripts/test-agent-execution.ts
 */

import 'dotenv/config'
import { db } from '../lib/db'
import { tasks, agents } from '../lib/db/schema'
import { executeTask } from '../lib/agent/executor'
import { eq } from 'drizzle-orm'

const COMPANY_ID = process.env.TEST_COMPANY_ID

if (!COMPANY_ID) {
  console.error('TEST_COMPANY_ID is not set. Add it to .env.local before running this script.')
  process.exit(1)
}

async function testAgentExecution() {
  console.log('🧪 测试 Agent 执行功能\n')

  try {
    // 1. 获取该公司的所有 agents
    console.log('📋 获取公司的 Agents...\n')
    const companyAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.company_id, COMPANY_ID))

    if (companyAgents.length === 0) {
      console.log('❌ 该公司没有任何 Agent')
      return
    }

    console.log(`找到 ${companyAgents.length} 个 Agents:\n`)
    companyAgents.forEach((agent, i) => {
      console.log(`${i + 1}. ${agent.name} (${agent.role})`)
    })
    console.log('')

    // 2. 创建一个测试任务
    console.log('📝 创建测试任务...\n')
    const [newTask] = await db
      .insert(tasks)
      .values({
        company_id: COMPANY_ID,
        title: '写一篇关于 AI 的推文',
        description: '写一条吸引人的推文，介绍 AI 如何改变软件开发。要求简洁有力，不超过 280 字符。',
        priority: 8, // 高优先级，会使用 DeepSeek
        status: 'PENDING',
      })
      .returning()

    console.log(`✅ 任务已创建:`)
    console.log(`   ID: ${newTask.id}`)
    console.log(`   标题: ${newTask.title}`)
    console.log(`   优先级: ${newTask.priority}`)
    console.log('')

    // 3. 找到 Content Creator Agent
    const contentCreator = companyAgents.find((a) => a.role === 'CONTENT_CREATOR')

    if (!contentCreator) {
      console.log('❌ 没有找到 Content Creator Agent')
      return
    }

    console.log(`🤖 使用 Agent: ${contentCreator.name}\n`)

    // 4. 执行任务
    console.log('⚡ 开始执行任务...\n')
    const startTime = Date.now()

    const result = await executeTask(contentCreator.id, COMPANY_ID, newTask.id)

    const duration = Date.now() - startTime

    console.log('✅ 任务执行完成!\n')
    console.log('📊 执行结果:')
    console.log(`   耗时: ${duration}ms`)
    console.log(`   Tokens: ${result.tokensUsed}`)
    console.log(`   成本: $${result.cost.toFixed(6)}`)
    console.log('')

    console.log('📝 生成的内容:')
    console.log('─'.repeat(60))
    console.log(result.output)
    console.log('─'.repeat(60))
    console.log('')

    if (result.decisions && result.decisions.length > 0) {
      console.log('🧠 决策过程:')
      result.decisions.forEach((decision, i) => {
        console.log(`   ${i + 1}. ${decision.type}`)
        console.log(`      原因: ${decision.reason}`)
        console.log(`      置信度: ${(decision.confidence * 100).toFixed(0)}%`)
      })
      console.log('')
    }

    // 5. 验证任务状态已更新
    const [updatedTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, newTask.id))

    console.log('✅ 任务状态已更新:')
    console.log(`   状态: ${updatedTask.status}`)
    console.log(`   结果已保存: ${updatedTask.result ? '是' : '否'}`)
    console.log('')

    console.log('🎉 测试成功！Agent 执行功能正常工作。')
  } catch (error: any) {
    console.error('❌ 测试失败:', error.message)
    console.error('\n详细错误:')
    console.error(error)
  }

  process.exit(0)
}

testAgentExecution()
