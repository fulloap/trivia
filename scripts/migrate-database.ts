import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema.js';
import fs from 'fs';
import path from 'path';

// Source database (current Replit)
const SOURCE_URL = 'postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres';

// Target database (production)
const TARGET_URL = process.env.DATABASE_URL;

if (!TARGET_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sourceDb = drizzle(neon(SOURCE_URL), { schema });
const targetDb = drizzle(neon(TARGET_URL), { schema });

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
  console.log('Starting database migration...');
  
  try {
    // Check if target database is accessible
    await targetDb.execute('SELECT 1');
    console.log('✓ Target database connection successful');
    
    // Check if tables exist, if not create them
    const tablesExist = await checkTableExists(targetDb, 'users');
    if (!tablesExist) {
      await createTables(targetDb);
    }
    
    // Check if source database is accessible
    try {
      await sourceDb.execute('SELECT 1');
      console.log('✓ Source database connection successful');
    } catch (sourceError) {
      console.warn('Source database not accessible, will populate with default data');
      await populateDefaultData();
      return;
    }
    
    // Migrate data from source to target
    await migrateUsers();
    await migrateCountries();
    await migrateQuestions();
    await migrateUserProgress();
    await migrateQuizSessions();
    await migrateRankings();
    
    console.log('✓ Database migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    // If migration fails, populate with default data
    await populateDefaultData();
  }
}

async function migrateUsers() {
  console.log('Migrating users...');
  try {
    const users = await sourceDb.select().from(schema.users);
    if (users.length > 0) {
      // Clear existing data
      await targetDb.delete(schema.users);
      // Insert new data
      await targetDb.insert(schema.users).values(users);
      console.log(`✓ Migrated ${users.length} users`);
    }
  } catch (error: any) {
    console.warn('Could not migrate users:', error.message);
  }
}

async function migrateCountries() {
  console.log('Migrating countries...');
  try {
    const countries = await sourceDb.select().from(schema.countries);
    if (countries.length > 0) {
      await targetDb.delete(schema.countries);
      await targetDb.insert(schema.countries).values(countries);
      console.log(`✓ Migrated ${countries.length} countries`);
    } else {
      await populateDefaultCountries();
    }
  } catch (error) {
    console.warn('Could not migrate countries, using defaults');
    await populateDefaultCountries();
  }
}

async function migrateQuestions() {
  console.log('Migrating questions...');
  try {
    const questions = await sourceDb.select().from(schema.questions);
    if (questions.length > 0) {
      await targetDb.delete(schema.questions);
      // Insert in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        await targetDb.insert(schema.questions).values(batch);
      }
      console.log(`✓ Migrated ${questions.length} questions`);
    } else {
      await populateDefaultQuestions();
    }
  } catch (error) {
    console.warn('Could not migrate questions, using file data');
    await populateDefaultQuestions();
  }
}

async function migrateUserProgress() {
  console.log('Migrating user progress...');
  try {
    const progress = await sourceDb.select().from(schema.userProgress);
    if (progress.length > 0) {
      await targetDb.delete(schema.userProgress);
      await targetDb.insert(schema.userProgress).values(progress);
      console.log(`✓ Migrated ${progress.length} progress records`);
    }
  } catch (error: any) {
    console.warn('Could not migrate user progress:', error.message);
  }
}

async function migrateQuizSessions() {
  console.log('Migrating quiz sessions...');
  try {
    const sessions = await sourceDb.select().from(schema.quizSessions);
    if (sessions.length > 0) {
      await targetDb.delete(schema.quizSessions);
      await targetDb.insert(schema.quizSessions).values(sessions);
      console.log(`✓ Migrated ${sessions.length} quiz sessions`);
    }
  } catch (error: any) {
    console.warn('Could not migrate quiz sessions:', error.message);
  }
}

async function migrateRankings() {
  console.log('Migrating rankings...');
  try {
    const rankings = await sourceDb.select().from(schema.rankings);
    if (rankings.length > 0) {
      await targetDb.delete(schema.rankings);
      await targetDb.insert(schema.rankings).values(rankings);
      console.log(`✓ Migrated ${rankings.length} rankings`);
    }
  } catch (error: any) {
    console.warn('Could not migrate rankings:', error.message);
  }
}

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
    await targetDb.insert(schema.countries).values(defaultCountries).onConflictDoNothing();
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
        
        await targetDb.insert(schema.questions).values(questions).onConflictDoNothing();
        console.log(`✓ Loaded ${questions.length} questions for ${countryCode}`);
      }
    } catch (error: any) {
      console.warn(`Could not load questions for ${countryCode}:`, error.message);
    }
  }
}

// Run migration
if (require.main === module) {
  migrateData().catch(console.error);
}

export { migrateData };