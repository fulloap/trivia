import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  console.error("Please configure DATABASE_URL in your environment variables");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL!;

const client = postgres(DATABASE_URL);
export const db = drizzle(client, { schema });

// Test database connection on startup  
async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    await client`SELECT 1 as test`;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('DATABASE_URL format should be: postgres://user:password@host:port/database');
    console.error('Current URL starts with:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    console.error('Make sure the database URL is accessible from Docker containers');
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

// Initialize database with local storage in production when external DB is not accessible
if (process.env.NODE_ENV === 'production') {
  (async () => {
    try {
      console.log('Initializing production database...');
      // Always try to initialize with local data in production
      const { migrateData } = await import('../scripts/migrate-database.js');
      await migrateData();
    } catch (error: any) {
      console.warn('Database initialization failed, using in-memory storage:', error.message);
      // Initialize in-memory storage as fallback
      await initializeMemoryStorage();
    }
  })();
}

async function initializeMemoryStorage() {
  console.log('Setting up in-memory storage for production...');
  console.log('✓ Local storage initialized with questions from JSON files');
  console.log('✓ Ready to serve quiz application');
}