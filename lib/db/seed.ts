import { db } from './index';
import { profiles, companies, agents, tasks, platformConnections } from './schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // 1. Create a test profile (using a test user ID)
    const testUserId = '00000000-0000-0000-0000-000000000001';

    console.log('Creating test profile...');
    await db.insert(profiles).values({
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
      avatar_url: null,
    }).onConflictDoNothing();

    // 2. Create a marketing company
    console.log('Creating marketing company...');
    const [company] = await db.insert(companies).values({
      user_id: testUserId,
      name: 'My Marketing Company',
      type: 'MARKETING',
      status: 'ACTIVE',
      description: 'AI-powered marketing automation company',
      config: {
        budget: 1000,
        automation_level: 'high',
        exploration_period: 30,
      },
      platform_connections: {},
      heartbeat_interval: 21600, // 6 hours
    }).returning();

    console.log(`✅ Company created: ${company.id}`);

    // 3. Create 4 agents for the marketing company
    console.log('Creating agents...');

    const agentConfigs = [
      {
        role: 'CEO',
        name: 'CEO Bot',
        system_prompt: 'You are the CEO of this marketing company. Your role is to oversee strategy, coordinate agents, monitor progress, and make high-level decisions.',
        config: { tools: ['web_search', 'data_analysis'] },
      },
      {
        role: 'CMO',
        name: 'CMO Bot',
        system_prompt: 'You are the Chief Marketing Officer. Your role is to develop marketing strategies, analyze market trends, and coordinate marketing campaigns.',
        config: { tools: ['web_search', 'social_media', 'analytics'] },
      },
      {
        role: 'CONTENT_CREATOR',
        name: 'Content Creator Bot',
        system_prompt: 'You are a content creator. Your role is to create engaging marketing content, write posts, and optimize content for different platforms.',
        config: { tools: ['content_generation', 'image_generation'] },
      },
      {
        role: 'SALES_MANAGER',
        name: 'Sales Manager Bot',
        system_prompt: 'You are the Sales Manager. Your role is to track leads, manage customer relationships, and optimize conversion funnels.',
        config: { tools: ['crm', 'analytics', 'email'] },
      },
    ];

    for (const agentConfig of agentConfigs) {
      await db.insert(agents).values({
        company_id: company.id,
        ...agentConfig,
        status: 'IDLE',
        model: 'claude-3-haiku',
        temperature: 70,
        max_tokens: 4000,
      });
    }

    console.log('✅ 4 agents created');

    // 4. Create sample tasks
    console.log('Creating sample tasks...');

    const taskData = [
      {
        title: 'Analyze target market',
        description: 'Research and analyze the target market for our product',
        status: 'COMPLETED',
        priority: 8,
        completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        title: 'Create Twitter content calendar',
        description: 'Plan and schedule Twitter posts for the next week',
        status: 'COMPLETED',
        priority: 7,
        completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      {
        title: 'Launch Product Hunt campaign',
        description: 'Prepare and launch product on Product Hunt',
        status: 'IN_PROGRESS',
        priority: 9,
        started_at: new Date(),
      },
      {
        title: 'Optimize landing page copy',
        description: 'Review and improve landing page conversion copy',
        status: 'PENDING',
        priority: 6,
        scheduled_at: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      },
      {
        title: 'Weekly performance report',
        description: 'Generate weekly marketing performance report',
        status: 'PENDING',
        priority: 5,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    ];

    for (const task of taskData) {
      await db.insert(tasks).values({
        company_id: company.id,
        agent_id: null, // Will be assigned by CEO
        ...task,
      });
    }

    console.log('✅ 5 sample tasks created');

    // 5. Create platform connections
    console.log('Creating platform connections...');

    const platforms = [
      { platform: 'twitter', connected: true },
      { platform: 'product_hunt', connected: true },
      { platform: 'stripe', connected: false },
    ];

    for (const platform of platforms) {
      await db.insert(platformConnections).values({
        company_id: company.id,
        ...platform,
        credentials: platform.connected ? { api_key: 'mock_key' } : null,
      });
    }

    console.log('✅ 3 platform connections created');

    console.log('\n🎉 Seed completed successfully!');
    console.log(`\nTest credentials:`);
    console.log(`  User ID: ${testUserId}`);
    console.log(`  Company ID: ${company.id}`);
    console.log(`  Company Name: ${company.name}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
