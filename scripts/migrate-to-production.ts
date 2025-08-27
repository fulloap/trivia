import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';

/**
 * Production Migration Script
 * Migrates all tables and data to production PostgreSQL database
 */

const PRODUCTION_DATABASE_URL = process.env.PRODUCTION_DATABASE_URL || 
  'postgres://postgres:hIJWL0kFomqH24jZ17CmV1OfacXyHhnd4idNwY7tyEhi2yWr4eXDtvGAnZlq2N9A@qcggssww444k4wc48kww8844:5432/postgres';

async function migrateToProduction() {
  console.log('🚀 Starting migration to production database...');
  
  try {
    // Connect to production database using Neon
    const sql = neon(PRODUCTION_DATABASE_URL);
    const db = drizzle(sql, { schema });
    
    console.log('✅ Connected to production database');
    
    // Create tables manually since we're using HTTP connection
    console.log('📦 Creating database tables...');
    
    // Create tables using raw SQL
    await sql(`
      CREATE TABLE IF NOT EXISTS countries (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        flag VARCHAR(10) NOT NULL,
        description TEXT
      );
    `);
    
    await sql(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        country_code VARCHAR(50) NOT NULL REFERENCES countries(code),
        level INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'multiple',
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        options JSONB,
        points INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        total_score INTEGER DEFAULT 0,
        referral_code VARCHAR(20) UNIQUE,
        referred_by INTEGER REFERENCES users(id),
        bonus_helps INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await sql(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        country_code VARCHAR(50) NOT NULL REFERENCES countries(code),
        level INTEGER NOT NULL,
        highest_score INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        UNIQUE(user_id, country_code, level)
      );
    `);
    
    await sql(`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        country_code VARCHAR(50) NOT NULL REFERENCES countries(code),
        level INTEGER NOT NULL,
        score INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        helps_used INTEGER DEFAULT 0,
        accuracy DECIMAL(5,2) DEFAULT 0,
        is_completed BOOLEAN DEFAULT false,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `);
    
    await sql(`
      CREATE TABLE IF NOT EXISTS rankings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        country_code VARCHAR(50) NOT NULL REFERENCES countries(code),
        level INTEGER NOT NULL,
        score INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        accuracy DECIMAL(5,2) NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        username VARCHAR(50) NOT NULL
      );
    `);
    
    await sql(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSONB NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
      CREATE INDEX IF NOT EXISTS sessions_expire_index ON sessions(expire);
    `);
    
    console.log('✅ Database schema created successfully');
    
    // Import and insert all data
    console.log('📊 Importing questions data...');
    
    // Clear existing data first
    await db.delete(schema.questions);
    await db.delete(schema.countries);
    console.log('🗑️ Cleared existing data');
    
    // Insert countries
    const countries = [
      {
        code: 'cuba',
        name: 'Cuba',
        flag: '🇨🇺',
        description: 'Preguntas sobre cultura, slang y tradiciones cubanas'
      },
      {
        code: 'honduras', 
        name: 'Honduras',
        flag: '🇭🇳',
        description: 'Preguntas sobre cultura catracha y tradiciones hondureñas'
      }
    ];
    
    await db.insert(schema.countries).values(countries);
    console.log('✅ Countries inserted');
    
    // Load and insert all 3,000 questions
    const { readFile } = await import('fs/promises');
    
    const cubaQuestions = JSON.parse(await readFile('./data/questions/cuba.json', 'utf-8'));
    const hondurasQuestions = JSON.parse(await readFile('./data/questions/honduras.json', 'utf-8'));
    
    console.log(`📝 Inserting ${cubaQuestions.length} Cuban questions...`);
    
    // Insert in batches to avoid memory issues
    const batchSize = 100;
    let totalInserted = 0;
    
    // Insert Cuban questions
    for (let i = 0; i < cubaQuestions.length; i += batchSize) {
      const batch = cubaQuestions.slice(i, i + batchSize);
      
      const formattedBatch = batch.map((q: any) => ({
        countryCode: 'cuba',
        level: q.level,
        type: 'multiple' as const,
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        options: q.options,
        points: 1,
        isActive: true
      }));
      
      await db.insert(schema.questions).values(formattedBatch);
      totalInserted += batch.length;
      
      if (i % (batchSize * 10) === 0) {
        console.log(`📊 Cuba progress: ${totalInserted} questions inserted...`);
      }
    }
    
    console.log(`📝 Inserting ${hondurasQuestions.length} Honduran questions...`);
    
    // Insert Honduran questions
    for (let i = 0; i < hondurasQuestions.length; i += batchSize) {
      const batch = hondurasQuestions.slice(i, i + batchSize);
      
      const formattedBatch = batch.map((q: any) => ({
        countryCode: 'honduras',
        level: q.level,
        type: 'multiple' as const,
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        options: q.options,
        points: 1,
        isActive: true
      }));
      
      await db.insert(schema.questions).values(formattedBatch);
      totalInserted += batch.length;
      
      if (i % (batchSize * 10) === 0) {
        console.log(`📊 Honduras progress: ${totalInserted} questions inserted...`);
      }
    }
    
    // Verify data
    const questionCount = await db.select({ count: schema.questions.id }).from(schema.questions);
    const countryCount = await db.select({ count: schema.countries.id }).from(schema.countries);
    
    console.log('\n🎉 PRODUCTION MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Total questions in production: ${totalInserted}`);
    console.log(`🏳️ Countries in production: ${countryCount.length}`);
    console.log('='.repeat(50));
    
    // Test a sample query
    const sampleQuestions = await db
      .select()
      .from(schema.questions)
      .limit(5);
    
    console.log('\n🔍 Sample questions verification:');
    sampleQuestions.forEach((q, i) => {
      console.log(`${i + 1}. [${q.countryCode.toUpperCase()}] ${q.question.substring(0, 50)}...`);
    });
    
    // Neon HTTP connection doesn't need explicit closing
    console.log('\n✅ Production database migration successful!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

migrateToProduction()
  .then(() => {
    console.log('\n🚀 Ready for production deployment!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });