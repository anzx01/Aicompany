/**
 * 检查数据库中的 Agent 角色名
 * 运行: npx tsx scripts/check-agent-roles.ts
 */

import 'dotenv/config'
import { db } from '../lib/db'
import { agents } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function checkAgentRoles() {
  console.log('🔍 检查数据库中的 Agent 角色名...\n')

  try {
    // 查询所有不同的角色名
    const distinctRoles = await db
      .selectDistinct({ role: agents.role })
      .from(agents)

    if (distinctRoles.length === 0) {
      console.log('❌ 数据库中没有任何 Agent')
      console.log('\n💡 请先创建一个 Company 来生成 Agents')
      return
    }

    console.log(`✅ 找到 ${distinctRoles.length} 种不同的角色:\n`)

    const correctRoles = [
      'CEO',
      'CONTENT_CREATOR',
      'SALES_MANAGER',
      'PRODUCT_ANALYST',
      'CMO',
      'CONTENT_STRATEGIST',
      'WRITER',
      'EDITOR',
      'SUPPORT_LEAD',
      'TICKET_HANDLER',
      'QA_ENGINEER',
      'TECH_LEAD',
      'ENGINEER',
      'DEVOPS',
    ]

    let hasIncorrectRoles = false

    distinctRoles.forEach((r) => {
      const isCorrect = correctRoles.includes(r.role)
      const icon = isCorrect ? '✅' : '❌'
      console.log(`${icon} ${r.role}`)

      if (!isCorrect) {
        hasIncorrectRoles = true
      }
    })

    console.log('')

    if (hasIncorrectRoles) {
      console.log('⚠️  发现不正确的角色名格式！')
      console.log('\n📝 需要执行以下操作:')
      console.log('   1. 访问 Supabase Dashboard SQL Editor')
      console.log('   2. 执行 drizzle/fix_all_agent_roles.sql 中的 SQL')
      console.log('\n或者:')
      console.log('   创建一个新的 Company（会自动使用正确的角色名）')
      console.log('   访问: http://localhost:3000/company/create')
    } else {
      console.log('✅ 所有角色名格式正确！')
    }

    // 显示所有 agents 的详细信息
    console.log('\n📋 所有 Agents 详情:\n')
    const allAgents = await db.select().from(agents)

    allAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`)
      console.log(`   角色: ${agent.role}`)
      console.log(`   Company ID: ${agent.company_id}`)
      console.log(`   状态: ${agent.status}`)
      console.log('')
    })
  } catch (error: any) {
    console.error('❌ 查询失败:', error.message)
  }

  process.exit(0)
}

checkAgentRoles()
