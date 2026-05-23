// API 诊断脚本
// 在浏览器控制台运行此脚本来诊断问题

console.log('🔍 开始 API 诊断...')

// 测试 1: 检查认证状态
async function testAuth() {
  try {
    const response = await fetch('/api/trpc/company.list')
    console.log('✅ 认证测试:', response.status)
    if (response.status === 401) {
      console.log('❌ 未登录，请先登录')
      return false
    }
    return true
  } catch (error) {
    console.error('❌ 认证测试失败:', error)
    return false
  }
}

// 测试 2: 获取公司列表
async function testCompanyList() {
  try {
    const response = await fetch('/api/trpc/company.list')
    const data = await response.json()
    console.log('✅ 公司列表:', data)
    return data
  } catch (error) {
    console.error('❌ 获取公司列表失败:', error)
    return null
  }
}

// 测试 3: 测试 Agent API
async function testAgentAPI(companyId) {
  try {
    const response = await fetch(`/api/trpc/agent.getByCompany?input=${encodeURIComponent(JSON.stringify({ companyId }))}`)
    const data = await response.json()
    console.log('✅ Agent 列表:', data)
    return data
  } catch (error) {
    console.error('❌ 获取 Agent 列表失败:', error)
    return null
  }
}

// 运行所有测试
async function runDiagnostics() {
  console.log('\n=== 开始诊断 ===\n')

  const isAuthenticated = await testAuth()
  if (!isAuthenticated) {
    console.log('\n❌ 请先登录: http://localhost:3000/auth/login')
    return
  }

  const companies = await testCompanyList()
  if (!companies || companies.length === 0) {
    console.log('\n❌ 没有公司，请先创建: http://localhost:3000/company/create')
    return
  }

  console.log(`\n✅ 找到 ${companies.length} 个公司`)
  const firstCompany = companies[0]
  console.log('📋 第一个公司:', firstCompany.name, '(ID:', firstCompany.id, ')')

  const agents = await testAgentAPI(firstCompany.id)
  if (agents && agents.length > 0) {
    console.log(`\n✅ 找到 ${agents.length} 个 Agent`)
    console.log('📋 第一个 Agent:', agents[0].name, '(ID:', agents[0].id, ')')
  }

  console.log('\n=== 诊断完成 ===')
  console.log('\n📝 使用这些 ID 进行测试:')
  console.log('Company ID:', firstCompany.id)
  if (agents && agents.length > 0) {
    console.log('Agent ID:', agents[0].id)
  }
}

// 自动运行
runDiagnostics()
