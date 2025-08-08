import * as fs from 'fs';
import { db } from '../server/db';
import { questions, type InsertQuestion } from '../shared/schema';

interface CubanQuestionRaw {
  nivel: number;
  tipo: 'completar' | 'opcion_multiple';
  pregunta: string;
  respuesta: string;
  explicacion: string;
  opciones?: string[];
}

interface CubanQuestionProcessed {
  nivel: number;
  tipo: 'completar' | 'opcion_multiple';
  pregunta: string;
  respuesta: string;
  explicacion: string;
  opciones?: string[];
  key: string; // For deduplication
}

async function processCubanData() {
  console.log('📚 Procesando datos culturales cubanos...');
  
  // Read the Cuban data file
  const cubanDataText = fs.readFileSync('../attached_assets/cubano_game_data_FULL_1754665696619.txt', 'utf-8');
  const cubanDataRaw: CubanQuestionRaw[] = JSON.parse(cubanDataText);
  
  console.log(`📊 Total de preguntas en el archivo: ${cubanDataRaw.length}`);
  
  // Process and deduplicate questions
  const processedMap = new Map<string, CubanQuestionProcessed>();
  
  for (const item of cubanDataRaw) {
    // Create a unique key based on question content and answer
    const key = `${item.pregunta.trim().toLowerCase()}-${item.respuesta.trim().toLowerCase()}`;
    
    if (!processedMap.has(key)) {
      processedMap.set(key, {
        ...item,
        key
      });
    }
  }
  
  const uniqueQuestions = Array.from(processedMap.values());
  console.log(`✨ Preguntas únicas extraídas: ${uniqueQuestions.length}`);
  
  // Group by level for analysis
  const byLevel = uniqueQuestions.reduce((acc, q) => {
    acc[q.nivel] = (acc[q.nivel] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  console.log('📈 Distribución por nivel:', byLevel);
  
  // Convert to our database format
  const questionsForDB: InsertQuestion[] = uniqueQuestions.map(q => {
    const baseQuestion: InsertQuestion = {
      countryCode: 'cuba',
      level: q.nivel,
      type: q.tipo === 'opcion_multiple' ? 'multiple' : 'completar',
      question: q.pregunta,
      correctAnswer: q.respuesta,
      explanation: q.explicacion,
      points: getPointsByLevel(q.nivel),
      isActive: true
    };
    
    // Add options for multiple choice questions
    if (q.tipo === 'opcion_multiple' && q.opciones) {
      baseQuestion.options = q.opciones;
    }
    
    return baseQuestion;
  });
  
  console.log('💾 Insertando preguntas en la base de datos...');
  
  // Insert into database
  try {
    await db.insert(questions).values(questionsForDB);
    console.log(`✅ ${questionsForDB.length} preguntas cubanas insertadas exitosamente`);
    
    // Show sample of inserted questions
    console.log('\n📝 Muestra de preguntas insertadas:');
    questionsForDB.slice(0, 3).forEach((q, i) => {
      console.log(`${i + 1}. [Nivel ${q.level}] ${q.question}`);
      console.log(`   Respuesta: ${q.correctAnswer}`);
      console.log(`   Explicación: ${q.explanation}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error insertando preguntas:', error);
    throw error;
  }
}

function getPointsByLevel(level: number): number {
  const pointsMap = {
    1: 100,
    2: 150,
    3: 200,
    4: 300
  };
  return pointsMap[level as keyof typeof pointsMap] || 100;
}

// Run the script
processCubanData()
  .then(() => {
    console.log('🎉 Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en el proceso:', error);
    process.exit(1);
  });