import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema.js';
import fs from 'fs';
import path from 'path';

// Use the same database for source and target - your PostgreSQL database
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres';

const db = drizzle(neon(DATABASE_URL), { schema });

async function checkTableExists(db: any, tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

async function createTables(db: any) {
  console.log('Creating database tables...');
  
  // Create tables in order (respecting foreign keys)
  const createQueries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      session_id VARCHAR(255),
      referral_code VARCHAR(20) UNIQUE NOT NULL,
      referred_by INTEGER REFERENCES users(id),
      total_score INTEGER DEFAULT 0,
      bonus_helps INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Countries table
    `CREATE TABLE IF NOT EXISTS countries (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      flag VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Questions table
    `CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      country_code VARCHAR(10) NOT NULL,
      level INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT[] NOT NULL,
      correct_answer VARCHAR(255) NOT NULL,
      explanation TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // User progress table
    `CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      country_code VARCHAR(10) NOT NULL,
      level INTEGER NOT NULL,
      questions_answered INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      is_completed BOOLEAN DEFAULT false,
      last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, country_code, level)
    )`,
    
    // Quiz sessions table
    `CREATE TABLE IF NOT EXISTS quiz_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      country_code VARCHAR(10) NOT NULL,
      level INTEGER NOT NULL,
      current_question_index INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      hints_used INTEGER DEFAULT 0,
      hints_remaining INTEGER DEFAULT 3,
      session_data JSONB,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )`,
    
    // Rankings table
    `CREATE TABLE IF NOT EXISTS rankings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      country_code VARCHAR(10) NOT NULL,
      level INTEGER NOT NULL,
      score INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      accuracy DECIMAL(5,2) NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Sessions table (for authentication)
    `CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )`,
  ];
  
  for (const query of createQueries) {
    try {
      await db.execute(query);
      console.log('✓ Table created successfully');
    } catch (error) {
      console.error('Error creating table:', error);
    }
  }
}

async function migrateData() {
  console.log('Starting database initialization...');
  
  try {
    // Check if database is accessible
    await db.execute('SELECT 1');
    console.log('✓ Database connection successful');
    
    // Check if tables exist, if not create them
    const tablesExist = await checkTableExists(db, 'users');
    if (!tablesExist) {
      console.log('Creating database tables...');
      await createTables(db);
    }
    
    // Check if we have data already
    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length === 0) {
      console.log('Database is empty, populating with default data...');
      await populateDefaultData();
    } else {
      console.log('✓ Database already has data, skipping initialization');
    }
    
    console.log('✓ Database initialization completed successfully');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Still try to populate with default data
    try {
      await populateDefaultData();
    } catch (fallbackError) {
      console.error('Failed to populate default data:', fallbackError);
    }
  }
}

// Simplified data population functions since we're using the same database

async function populateDefaultData() {
  console.log('Populating default data...');
  await populateDefaultCountries();
  await populateDefaultQuestions();
}

async function populateDefaultCountries() {
  const defaultCountries = [
    {
      code: 'cuba',
      name: 'Cuba',
      flag: '🇨🇺',
      primaryColor: '#d42c29',
      secondaryColor: '#0033a0'
    },
    {
      code: 'honduras',
      name: 'Honduras', 
      flag: '🇭🇳',
      primaryColor: '#0073e6',
      secondaryColor: '#ffffff'
    }
  ];
  
  try {
    await db.insert(schema.countries).values(defaultCountries).onConflictDoNothing();
    console.log('✓ Default countries populated');
  } catch (error: any) {
    console.warn('Could not populate default countries:', error.message);
  }
}

async function populateDefaultQuestions() {
  console.log('Loading questions from files...');
  
  const questionFiles = [
    { file: 'data/questions/cuba.json', countryCode: 'cuba' },
    { file: 'data/questions/honduras.json', countryCode: 'honduras' }
  ];
  
  for (const { file, countryCode } of questionFiles) {
    try {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const questionsData = JSON.parse(fileContent);
        
        const questions = questionsData.map((q: any) => ({
          countryCode,
          level: q.level,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          isActive: true
        }));
        
        await db.insert(schema.questions).values(questions).onConflictDoNothing();
        console.log(`✓ Loaded ${questions.length} questions for ${countryCode}`);
      }
    } catch (error: any) {
      console.warn(`Could not load questions for ${countryCode}:`, error.message);
    }
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().catch(console.error);
}

export { migrateData };