import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use HTTP connection instead of WebSocket for better production stability
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Test database connection on startup  
async function testConnection() {
  try {
    console.log('Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('DATABASE_URL format should be: postgres://user:password@host:port/database');
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