#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncQuestions() {
  try {
    console.log('🔄 Sincronizando preguntas con la base de datos...');
    
    // Cargar preguntas de Cuba
    const cubaQuestions = JSON.parse(fs.readFileSync('./data/questions/cuba.json', 'utf8'));
    console.log(`📝 Cargando ${cubaQuestions.length} preguntas de Cuba`);
    
    // Cargar preguntas de Honduras
    const hondurasQuestions = JSON.parse(fs.readFileSync('./data/questions/honduras.json', 'utf8'));
    console.log(`📝 Cargando ${hondurasQuestions.length} preguntas de Honduras`);
    
    const allQuestions = [...cubaQuestions, ...hondurasQuestions];
    
    // Insertar todas las preguntas
    for (const question of allQuestions) {
      await pool.query(`
        INSERT INTO questions (
          country_code, level, type, question, correct_answer, 
          explanation, description, options, points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        question.countryCode,
        question.level,
        question.type,
        question.question,
        question.correctAnswer,
        question.explanation,
        question.description || null,
        JSON.stringify(question.options),
        question.points || 1
      ]);
    }
    
    console.log(`✅ Se sincronizaron ${allQuestions.length} preguntas exitosamente`);
    
    // Mostrar estadísticas por país y nivel
    const stats = await pool.query(`
      SELECT country_code, level, COUNT(*) as count 
      FROM questions 
      GROUP BY country_code, level 
      ORDER BY country_code, level
    `);
    
    console.log('\n📊 Preguntas por país y nivel:');
    stats.rows.forEach(stat => {
      console.log(`${stat.country_code} Nivel ${stat.level}: ${stat.count} preguntas`);
    });
    
  } catch (error) {
    console.error('❌ Error sincronizando preguntas:', error);
  } finally {
    await pool.end();
  }
}

syncQuestions();