import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('[DB] Connecting to database...');

// Create postgres client
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for Supabase compatibility
  max: 1, // Use single connection to avoid connection pool issues
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 30, // Longer connection timeout (30 seconds)
  ssl: 'require', // Require SSL for Supabase
  connection: {
    application_name: 'aicompany_app', // Help identify connections in Supabase
  },
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in other files
export * from './schema';
