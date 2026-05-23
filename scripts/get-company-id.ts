/**
 * 获取用户的 Company ID
 * 运行: npx tsx scripts/get-company-id.ts
 */

import 'dotenv/config'
import { db } from '../lib/db'
import { companies } from '../lib/db/schema'

async function getCompanyIds() {
  console.log('🔍 查询所有 Companies...\n')

  try {
    const allCompanies = await db.select().from(companies)

    if (allCompanies.length === 0) {
      console.log('❌ 没有找到任何 Company')
      console.log('\n💡 请先创建一个 Company:')
      console.log('   访问: http://localhost:3000/company/create')
      return
    }

    console.log(`✅ 找到 ${allCompanies.length} 个 Company:\n`)

    allCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`)
      console.log(`   ID: ${company.id}`)
      console.log(`   类型: ${company.type}`)
      console.log(`   状态: ${company.status}`)
      console.log(`   创建时间: ${company.created_at}`)
      console.log('')
    })

    console.log('📋 使用方法:')
    console.log('   1. 复制上面的 Company ID')
    console.log('   2. 访问: http://localhost:3000/agent-test')
    console.log('   3. 粘贴 Company ID 到输入框')
    console.log('')
  } catch (error: any) {
    console.error('❌ 查询失败:', error.message)
  }

  process.exit(0)
}

getCompanyIds()
