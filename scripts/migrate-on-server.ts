import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { readFile } from 'fs/promises';

/**
 * Server-side migration script that runs after deployment
 * This should be executed ONCE after the first deployment
 */

async function migrateOnServer() {
  console.log('🚀 Starting server-side migration...');
  
  try {
    console.log('✅ Using existing database connection');
    
    // Insert countries if they don't exist
    console.log('📍 Setting up countries...');
    
    const existingCountries = await db.select().from(schema.countries);
    
    if (existingCountries.length === 0) {
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
    } else {
      console.log('✅ Countries already exist');
    }
    
    // Check if questions already exist
    const existingQuestions = await db.select().from(schema.questions).limit(1);
    
    if (existingQuestions.length === 0) {
      console.log('📝 Loading questions from JSON files...');
      
      // Load questions from JSON files
      const cubaQuestions = JSON.parse(await readFile('./data/questions/cuba.json', 'utf-8'));
      const hondurasQuestions = JSON.parse(await readFile('./data/questions/honduras.json', 'utf-8'));
      
      console.log(`📊 Inserting ${cubaQuestions.length} Cuban questions...`);
      
      // Insert in batches
      const batchSize = 50;
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
      
      console.log(`✅ ${totalInserted} questions inserted successfully`);
    } else {
      console.log('✅ Questions already exist in database');
    }
    
    // Verify final state
    const questionCount = await db.select().from(schema.questions);
    const countryCount = await db.select().from(schema.countries);
    
    console.log('\n🎉 SERVER MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📊 Total questions: ${questionCount.length}`);
    console.log(`🏳️ Countries: ${countryCount.length}`);
    console.log('='.repeat(50));
    
    // Test a sample query
    const sampleQuestions = await db
      .select()
      .from(schema.questions)
      .limit(3);
    
    console.log('\n🔍 Sample questions verification:');
    sampleQuestions.forEach((q, i) => {
      console.log(`${i + 1}. [${q.countryCode.toUpperCase()}] ${q.question.substring(0, 50)}...`);
    });
    
    console.log('\n✅ Database migration successful!');
    
  } catch (error) {
    console.error('💥 Server migration failed:', error);
    process.exit(1);
  }
}

migrateOnServer()
  .then(() => {
    console.log('\n🚀 Server is ready for production!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });