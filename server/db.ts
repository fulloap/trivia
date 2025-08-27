import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  console.error("Please configure DATABASE_URL in your environment variables");
  process.exit(1);
}

// Use HTTP connection instead of WebSocket for better production stability
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Test database connection on startup  
async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    await sql`SELECT 1 as test`;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('DATABASE_URL format should be: postgres://user:password@host:port/database');
    console.error('Current URL starts with:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    console.error('Make sure the database URL is publicly accessible from Docker containers');
  }
}

// Call test connection and initialize email system
testConnection();

// Initialize email system
(async () => {
  try {
    const { initializeEmailSystem } = await import('./mailer.js');
    await initializeEmailSystem();
  } catch (error) {
    console.error('Email system initialization failed:', error);
  }
})();

// Run database migration in production
if (process.env.NODE_ENV === 'production') {
  (async () => {
    try {
      console.log('Checking database initialization...');
      // Only initialize if database is accessible
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('qcggssww444k4wc48kww8844')) {
        const { migrateData } = await import('../scripts/migrate-database.js');
        await migrateData();
      } else {
        console.log('Using fallback database configuration - skipping remote initialization');
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  })();
}