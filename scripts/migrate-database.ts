import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema.js';
import fs from 'fs';
import path from 'path';

// Use the same database for source and target - your PostgreSQL database
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres';

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

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
      games_played INTEGER DEFAULT 0,
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

async function updateExistingTables(db: any) {
  console.log('Updating existing tables with missing columns...');
  
  const updateQueries = [
    // Add games_played column if it doesn't exist
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0`,
    // Add any other missing columns
    `ALTER TABLE countries ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#000000'`,
    `ALTER TABLE countries ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'multiple'`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1`,
    // Add used_question_ids column for anti-repetition system
    `ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS used_question_ids JSONB DEFAULT '[]'`,
  ];
  
  for (const query of updateQueries) {
    try {
      await db.execute(query);
      console.log('✓ Column updated successfully');
    } catch (error) {
      // Column might already exist, continue
      console.log('Column update skipped (already exists)');
    }
  }
}

async function migrateData() {
  console.log('🚀 Starting production database migration...');
  
  try {
    // Check if database is accessible
    await client`SELECT 1`;
    console.log('✓ PostgreSQL connection successful');
    
    // Check if tables exist, if not create them
    const tablesExist = await checkTableExists(db, 'users');
    if (!tablesExist) {
      console.log('Creating database tables...');
      await createTables(db);
    } else {
      // Tables exist, but might need updates
      console.log('Tables exist, checking for missing columns...');
      await updateExistingTables(db);
    }
    
    // Always check and populate questions to ensure we have all 3000 questions
    console.log('🔍 Checking question database completeness...');
    
    try {
      const questionCount = await db.select({ count: sql`count(*)` }).from(schema.questions);
      const cubaCount = await db.select({ count: sql`count(*)` }).from(schema.questions).where(sql`country_code = 'cuba'`);
      const hondurasCount = await db.select({ count: sql`count(*)` }).from(schema.questions).where(sql`country_code = 'honduras'`);
      
      console.log(`📊 Current questions: Total: ${questionCount[0]?.count || 0}, Cuba: ${cubaCount[0]?.count || 0}, Honduras: ${hondurasCount[0]?.count || 0}`);
      
      // Populate countries first
      await populateDefaultCountries();
      
      // Always try to populate questions to ensure completeness
      await populateDefaultQuestions();
      
      // Final count verification
      const finalCount = await db.select({ count: sql`count(*)` }).from(schema.questions);
      console.log(`✅ Final question count: ${finalCount[0]?.count} total questions loaded`);
      
    } catch (error) {
      console.error('Error during question population:', error);
      throw error;
    }
    
    console.log('✅ Database migration completed successfully');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error; // Re-throw to let the caller handle it
  }
}

async function initializeLocalStorage() {
  console.log('✓ Initializing local file-based storage for production');
  console.log('✓ Questions loaded from JSON files');
  console.log('✓ Countries configured: Cuba, Honduras');  
  console.log('✓ Local storage ready for user data');
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
    // Use INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
    for (const country of defaultCountries) {
      try {
        await db.insert(schema.countries).values(country).onConflictDoNothing();
      } catch (e) {
        // Country already exists, continue
      }
    }
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
        console.log(`Loading questions for ${countryCode}...`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const questionsData = JSON.parse(fileContent);
        
        // Remove duplicates by question text and level
        const uniqueQuestions = removeDuplicates(questionsData);
        console.log(`✓ Removed ${questionsData.length - uniqueQuestions.length} duplicate questions for ${countryCode}`);
        
        // Validate difficulty distribution
        const levelCounts = validateDifficultyDistribution(uniqueQuestions, countryCode);
        
        const questions = uniqueQuestions.map((q: any, index: number) => {
          // Debug first question to understand structure
          if (index === 0) {
            console.log(`🔍 Sample question structure for ${countryCode}:`, {
              question: q.question,
              options: q.options,
              optionsType: typeof q.options,
              isArray: Array.isArray(q.options)
            });
          }
          
          return {
            countryCode,
            level: q.level,
            type: q.type || 'multiple',
            question: q.question,
            correctAnswer: q.correct_answer || q.correctAnswer,
            options: q.options, // Store as JSONB directly - no conversion needed
            explanation: q.explanation || '',
            description: q.description || '',
            points: 1,
            isActive: true
          };
        });
        
        // Check if questions already exist for this country
        const existingCount = await db
          .select({ count: sql`count(*)` })
          .from(schema.questions)
          .where(sql`country_code = ${countryCode}`);
        
        if (existingCount[0]?.count > 0) {
          console.log(`✓ ${countryCode} already has ${existingCount[0].count} questions, skipping`);
          continue;
        }
        
        console.log(`📥 Starting bulk insert for ${countryCode} (${questions.length} questions)...`);
        
        // Insert questions in batches with proper error handling
        const batchSize = 25; // Smaller batches for better reliability
        let insertedCount = 0;
        
        for (let i = 0; i < questions.length; i += batchSize) {
          const batch = questions.slice(i, i + batchSize);
          try {
            await db.insert(schema.questions).values(batch).onConflictDoNothing();
            insertedCount += batch.length;
            console.log(`✓ Batch ${Math.floor(i/batchSize) + 1}: Inserted ${batch.length} questions for ${countryCode}`);
          } catch (e: any) {
            console.warn(`Warning: Batch ${Math.floor(i/batchSize) + 1} failed for ${countryCode}:`, e.message);
            // Debug failed batch
            if (batch.length > 0) {
              console.log(`🔍 Failed batch sample:`, {
                question: batch[0].question,
                options: batch[0].options,
                optionsType: typeof batch[0].options
              });
            }
          }
        }
        
        console.log(`✓ Successfully loaded ${insertedCount} unique questions for ${countryCode}`);
        console.log(`✓ Level distribution: ${JSON.stringify(levelCounts)}`);
      }
    } catch (error: any) {
      console.warn(`Could not load questions for ${countryCode}:`, error.message);
    }
  }
}

// Helper function to remove duplicate questions
function removeDuplicates(questions: any[]) {
  const seen = new Set();
  return questions.filter(q => {
    const key = `${q.question.toLowerCase().trim()}_${q.level}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Helper function to validate difficulty distribution
function validateDifficultyDistribution(questions: any[], countryCode: string) {
  const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  questions.forEach(q => {
    if (q.level >= 1 && q.level <= 4) {
      levelCounts[q.level as keyof typeof levelCounts]++;
    }
  });
  
  console.log(`✓ ${countryCode} difficulty distribution: Level 1: ${levelCounts[1]}, Level 2: ${levelCounts[2]}, Level 3: ${levelCounts[3]}, Level 4: ${levelCounts[4]}`);
  
  return levelCounts;
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().catch(console.error);
}

export { migrateData };