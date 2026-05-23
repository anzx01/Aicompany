require('dotenv').config({ path: '.env.local' })
const postgres = require('postgres')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Add it to .env.local or your shell environment.')
  process.exit(1)
}

const sql = postgres(databaseUrl)

async function checkDatabase() {
  try {
    console.log('Database connection successful.\n')

    console.log('Distinct agent roles:\n')
    const roles = await sql`SELECT DISTINCT role FROM agents ORDER BY role`

    if (roles.length === 0) {
      console.log('No agents found.\n')
    } else {
      console.log(`Found ${roles.length} distinct roles:\n`)
      roles.forEach((row, i) => {
        console.log(`${i + 1}. ${row.role}`)
      })
      console.log('')
    }

    console.log('Latest agents:\n')
    const agents = await sql`
      SELECT id, name, role, company_id, status
      FROM agents
      ORDER BY created_at DESC
      LIMIT 10
    `

    agents.forEach((agent, i) => {
      console.log(`${i + 1}. ${agent.name}`)
      console.log(`   Role: ${agent.role}`)
      console.log(`   Company ID: ${agent.company_id}`)
      console.log(`   Status: ${agent.status}`)
      console.log(`   ID: ${agent.id}`)
      console.log('')
    })

    console.log('Companies:\n')
    const companies = await sql`
      SELECT id, name, type, status
      FROM companies
      ORDER BY created_at DESC
    `

    if (companies.length === 0) {
      console.log('No companies found.\n')
      console.log('Create a company at http://localhost:3000/company/create\n')
    } else {
      companies.forEach((company, i) => {
        console.log(`${i + 1}. ${company.name}`)
        console.log(`   Type: ${company.type}`)
        console.log(`   Status: ${company.status}`)
        console.log(`   ID: ${company.id}`)
        console.log('')
      })
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await sql.end()
  }
}

checkDatabase()
