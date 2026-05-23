import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function testGoalsTable() {
  try {
    console.log('Testing goals table...');

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'goals'
      );
    `;
    console.log('Table exists:', tableExists[0].exists);

    // Check table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'goals'
      ORDER BY ordinal_position;
    `;
    console.log('\nTable columns:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check RLS policies
    const policies = await sql`
      SELECT policyname, cmd, qual
      FROM pg_policies
      WHERE tablename = 'goals';
    `;
    console.log('\nRLS Policies:');
    policies.forEach(p => {
      console.log(`  ${p.policyname} (${p.cmd})`);
    });

    console.log('\n✅ Goals table test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sql.end();
  }
}

testGoalsTable();
