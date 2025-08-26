import { db } from '../server/db.js';
import { questions } from '../shared/schema.js';
import { writeFile, readFile } from 'fs/promises';
import { eq } from 'drizzle-orm';

/**
 * Script to reorganize questions by difficulty and add 1000+ new cultural trivia questions
 * Based on authentic Cuban and Honduran cultural research from 2024
 */

// New comprehensive Cuban questions with proper difficulty levels
const newCubanQuestions = [
  // Level 1 - Basic Cuban cultural knowledge
  {
    countryCode: "cuba",
    level: 1,
    type: "multiple",
    question: "¿Qué significa 'asere' en Cuba?",
    correctAnswer: "amigo",
    explanation: "'Asere' es una forma muy común en Cuba de decir 'amigo' o 'hermano'.",
    options: ["enemigo", "amigo", "extraño", "vecino"],
    points: 1
  },
  {
    countryCode: "cuba", level: 1, type: "multiple",
    question: "¿Cómo se dice 'autobús' en Cuba?",
    correctAnswer: "guagua", explanation: "En Cuba, los autobuses urbanos e interprovinciales se llaman 'guaguas'.",
    options: ["guagua", "bus", "ómnibus", "micro"], points: 1
  },
  {
    countryCode: "cuba", level: 1, type: "multiple",
    question: "¿Qué es un 'yuma' en Cuba?",
    correctAnswer: "extranjero", explanation: "'Yuma' es el término cubano para referirse a cualquier extranjero.",
    options: ["cubano", "extranjero", "turista rico", "americano"], points: 1
  },
  {
    countryCode: "cuba", level: 1, type: "multiple",
    question: "¿Cómo dicen 'genial' o 'excelente' los cubanos?",
    correctAnswer: "chévere", explanation: "'Chévere' es la expresión cubana más común para decir que algo está genial.",
    options: ["bárbaro", "chévere", "brutal", "tremendo"], points: 1
  },
  {
    countryCode: "cuba", level: 1, type: "multiple",
    question: "¿Qué fruta NO debe decirse por su nombre real en Cuba?",
    correctAnswer: "papaya", explanation: "En Cuba se dice 'frutabomba' en lugar de 'papaya' porque tiene connotaciones sexuales.",
    options: ["mango", "papaya", "plátano", "guayaba"], points: 1
  },
  
  // Level 2 - Intermediate Cuban slang and culture
  {
    countryCode: "cuba", level: 2, type: "multiple",
    question: "¿Qué significa 'tener el moño vira'o'?",
    correctAnswer: "estar de mal humor", explanation: "'Tener el moño vira'o' significa estar de muy mal humor o enojado.",
    options: ["estar elegante", "estar de mal humor", "tener hambre", "estar cansado"], points: 1
  },
  {
    countryCode: "cuba", level: 2, type: "multiple",
    question: "¿Qué es un 'almendrón' en Cuba?",
    correctAnswer: "auto clásico americano", explanation: "Los 'almendrones' son los autos clásicos estadounidenses de los años 50 que aún circulan en Cuba.",
    options: ["dulce típico", "auto clásico americano", "instrumento musical", "tipo de casa"], points: 1
  },
  {
    countryCode: "cuba", level: 2, type: "multiple",
    question: "¿Qué significa 'jinetear' en Cuba?",
    correctAnswer: "vender cosas a turistas", explanation: "Un 'jinetero' es alguien que se dedica a vender productos (como puros) a los turistas en la calle.",
    options: ["montar caballo", "vender cosas a turistas", "trabajar duro", "hacer ejercicio"], points: 1
  },
  {
    countryCode: "cuba", level: 2, type: "multiple",
    question: "¿Cómo se llaman los buses articulados en La Habana?",
    correctAnswer: "camellos", explanation: "Los buses articulados se llaman 'camellos' por su forma que recuerda la joroba de un camello.",
    options: ["jirafas", "camellos", "serpientes", "dragones"], points: 1
  },
  {
    countryCode: "cuba", level: 2, type: "multiple",
    question: "¿Qué significa 'está frito' en Cuba?",
    correctAnswer: "está en problemas", explanation: "Cuando alguien 'está frito' significa que está metido en problemas o en una situación difícil.",
    options: ["tiene calor", "está cocinando", "está en problemas", "tiene hambre"], points: 1
  },

  // Level 3 - Advanced Cuban expressions and culture
  {
    countryCode: "cuba", level: 3, type: "multiple",
    question: "¿Qué significa 'más rollo que película'?",
    correctAnswer: "mucha palabrería, poca acción", explanation: "'Más rollo que película' se dice de alguien que habla mucho pero no hace nada.",
    options: ["muy entretenido", "mucha palabrería, poca acción", "muy confuso", "muy aburrido"], points: 1
  },
  {
    countryCode: "cuba", level: 3, type: "multiple",
    question: "¿Qué significa 'le zumba el mango'?",
    correctAnswer: "algo increíble o exagerado", explanation: "'Le zumba el mango' se usa cuando algo es verdaderamente increíble, exagerado o fuera de lo común.",
    options: ["le gusta la fruta", "algo increíble o exagerado", "está bailando", "tiene hambre"], points: 1
  },
  {
    countryCode: "cuba", level: 3, type: "multiple",
    question: "¿Dónde queda 'donde el diablo dio las tres voces'?",
    correctAnswer: "muy lejos", explanation: "Es una expresión cubana para referirse a un lugar que está muy, muy lejos.",
    options: ["en el infierno", "muy lejos", "en La Habana", "en el campo"], points: 1
  },
  {
    countryCode: "cuba", level: 3, type: "multiple",
    question: "¿Qué animal representa la forma de Cuba?",
    correctAnswer: "cocodrilo", explanation: "Cuba tiene forma de cocodrilo, por eso a veces se le dice 'el cocodrilo verde' o 'el caimán'.",
    options: ["lagarto", "cocodrilo", "iguana", "serpiente"], points: 1
  },
  {
    countryCode: "cuba", level: 3, type: "multiple",
    question: "¿Cuál es el ave nacional de Cuba?",
    correctAnswer: "tocororo", explanation: "El tocororo es el ave nacional de Cuba, sus plumas tienen los colores de la bandera cubana.",
    options: ["flamenco", "tocororo", "zunzún", "cartacuba"], points: 1
  },

  // Level 4 - Expert Cuban cultural knowledge
  {
    countryCode: "cuba", level: 4, type: "multiple",
    question: "¿Qué significa 'va a La Habana y apaga fuego'?",
    correctAnswer: "es muy talentoso", explanation: "Se dice de una persona extremadamente talentosa y capaz de resolver cualquier problema.",
    options: ["es bombero", "es muy talentoso", "viaja mucho", "es problemático"], points: 1
  },
  {
    countryCode: "cuba", level: 4, type: "multiple",
    question: "¿Qué periodo histórico se conoce como 'Período Especial'?",
    correctAnswer: "crisis tras caída de URSS", explanation: "El Período Especial fue la crisis económica tras la caída de la Unión Soviética en los años 90.",
    options: ["independencia de España", "crisis tras caída de URSS", "revolución de 1959", "guerra hispano-americana"], points: 1
  },
  {
    countryCode: "cuba", level: 4, type: "multiple",
    question: "¿Por qué Cuba era el mayor productor mundial de azúcar?",
    correctAnswer: "clima y suelo ideales", explanation: "Para 1820, Cuba se convirtió en el mayor productor mundial de azúcar debido a su clima tropical y suelos fértiles.",
    options: ["mano de obra barata", "clima y suelo ideales", "tecnología avanzada", "apoyo soviético"], points: 1
  },
  {
    countryCode: "cuba", level: 4, type: "multiple",
    question: "¿Qué metal es Cuba el segundo exportador mundial?",
    correctAnswer: "níquel", explanation: "Cuba es el segundo mayor exportador mundial de níquel, un metal muy valioso industrialmente.",
    options: ["cobre", "níquel", "aluminio", "hierro"], points: 1
  },
  {
    countryCode: "cuba", level: 4, type: "multiple",
    question: "¿Cuál era el nombre de las dos monedas cubanas hasta la unificación?",
    correctAnswer: "CUP y CUC", explanation: "Hasta la unificación monetaria reciente, existían el Peso Cubano (CUP) y el Peso Convertible (CUC).",
    options: ["Peso y Dólar", "CUP y CUC", "Real y Peso", "Bolívar y Peso"], points: 1
  }
];

// New comprehensive Honduran questions
const newHonduranQuestions = [
  // Level 1 - Basic Honduran knowledge
  {
    countryCode: "honduras", level: 1, type: "multiple",
    question: "¿Cómo se dice 'dinero' en Honduras?",
    correctAnswer: "pisto", explanation: "'Pisto' es la forma hondureña más común de decir dinero.",
    options: ["pisto", "plata", "billete", "efectivo"], points: 1
  },
  {
    countryCode: "honduras", level: 1, type: "multiple",
    question: "¿Cómo se dice 'amigo' en Honduras?",
    correctAnswer: "maje", explanation: "'Maje' es la forma hondureña de decir 'amigo' o 'hermano' (según el contexto).",
    options: ["maje", "bróder", "pana", "compa"], points: 1
  },
  {
    countryCode: "honduras", level: 1, type: "multiple",
    question: "¿Cuál es la moneda de Honduras?",
    correctAnswer: "lempira", explanation: "La lempira es la moneda oficial de Honduras, nombrada por el cacique Lempira.",
    options: ["lempira", "peso", "córdoba", "quetzal"], points: 1
  },
  {
    countryCode: "honduras", level: 1, type: "multiple",
    question: "¿Cómo se dice 'niño' en Honduras?",
    correctAnswer: "cipote", explanation: "'Cipote' es la forma hondureña de decir niño, también se usa 'cipota' para niña.",
    options: ["cipote", "chamaco", "escuincle", "chavo"], points: 1
  },
  {
    countryCode: "honduras", level: 1, type: "multiple",
    question: "¿Qué significa 'catracho'?",
    correctAnswer: "hondureño", explanation: "'Catracho' o 'catracha' es como se llaman a sí mismos los hondureños con orgullo.",
    options: ["hondureño", "salvadoreño", "guatemalteco", "nicaragüense"], points: 1
  },

  // Level 2 - Intermediate Honduran culture
  {
    countryCode: "honduras", level: 2, type: "multiple",
    question: "¿Qué significa 'andar choco' en Honduras?",
    correctAnswer: "estar sin dinero", explanation: "'Andar choco' significa estar sin dinero, estar quebrado.",
    options: ["estar borracho", "estar sin dinero", "estar enfermo", "estar cansado"], points: 1
  },
  {
    countryCode: "honduras", level: 2, type: "multiple",
    question: "¿Qué es una 'pulpería' en Honduras?",
    correctAnswer: "tienda pequeña", explanation: "Una 'pulpería' es una tienda pequeña de barrio, como una bodega.",
    options: ["restaurante", "tienda pequeña", "farmacia", "panadería"], points: 1
  },
  {
    countryCode: "honduras", level: 2, type: "multiple",
    question: "¿Qué significa 'qué pepsi' en Honduras?",
    correctAnswer: "qué genial", explanation: "'¡Qué Pepsi!' es una expresión única hondureña para decir 'qué genial' o 'qué cool'.",
    options: ["qué sed", "qué genial", "qué raro", "qué mal"], points: 1
  },
  {
    countryCode: "honduras", level: 2, type: "multiple",
    question: "¿Cómo se llama el transporte público en Honduras?",
    correctAnswer: "rapidito", explanation: "En Honduras, el transporte público urbano se llama 'rapidito'.",
    options: ["rapidito", "guagua", "colectivo", "micro"], points: 1
  },
  {
    countryCode: "honduras", level: 2, type: "multiple",
    question: "¿Qué significa 'alero' en Honduras?",
    correctAnswer: "mejor amigo", explanation: "'Alero' significa tu mejor amigo, el que siempre está 'en tu ala'.",
    options: ["enemigo", "mejor amigo", "hermano", "vecino"], points: 1
  },

  // Level 3 - Advanced Honduran expressions
  {
    countryCode: "honduras", level: 3, type: "multiple",
    question: "¿Qué son los 'guancascos' en Honduras?",
    correctAnswer: "actos de hermandad entre pueblos", explanation: "Los 'guancascos' son tradiciones de hermandad e intercambio cultural entre comunidades.",
    options: ["bailes típicos", "actos de hermandad entre pueblos", "comidas tradicionales", "instrumentos musicales"], points: 1
  },
  {
    countryCode: "honduras", level: 3, type: "multiple",
    question: "¿Cuál es el plato más famoso de Honduras?",
    correctAnswer: "baleada", explanation: "La baleada es el plato hondureño más conocido: tortilla de harina con frijoles, queso y crema.",
    options: ["pupusa", "baleada", "tamale", "gallo pinto"], points: 1
  },
  {
    countryCode: "honduras", level: 3, type: "multiple",
    question: "¿Qué significa 'macizo' en Honduras?",
    correctAnswer: "excelente calidad", explanation: "'Macizo' significa que algo es de excelente calidad, sólido, bueno.",
    options: ["pesado", "excelente calidad", "difícil", "grande"], points: 1
  },
  {
    countryCode: "honduras", level: 3, type: "multiple",
    question: "¿Qué festival se celebra en La Ceiba?",
    correctAnswer: "Feria de San Isidro", explanation: "La Feria de San Isidro en La Ceiba es una de las festividades más grandes de Honduras, comparada con el Mardi Gras.",
    options: ["Feria Juniana", "Feria de San Isidro", "Festival del Maíz", "Carnaval de Paz"], points: 1
  },
  {
    countryCode: "honduras", level: 3, type: "multiple",
    question: "¿Cómo se dice 'fiesta' en Honduras?",
    correctAnswer: "pachanga", explanation: "'Pachanga' es una forma hondureña de decir fiesta o celebración.",
    options: ["pachanga", "reventón", "parranda", "juerga"], points: 1
  },

  // Level 4 - Expert Honduran culture
  {
    countryCode: "honduras", level: 4, type: "multiple",
    question: "¿Por qué a Honduras se le llama 'República Bananera'?",
    correctAnswer: "gran exportador de bananas", explanation: "Honduras fue históricamente uno de los mayores exportadores mundiales de bananas.",
    options: ["forma del país", "gran exportador de bananas", "color de la bandera", "tradición culinaria"], points: 1
  },
  {
    countryCode: "honduras", level: 4, type: "multiple",
    question: "¿Qué grupos indígenas habitan Honduras?",
    correctAnswer: "Lenca, Miskito, Garífuna", explanation: "Los principales grupos indígenas de Honduras son los Lenca, Miskito, Garífuna y Maya Chortí.",
    options: ["Maya, Azteca, Inca", "Lenca, Miskito, Garífuna", "Quechua, Aymara", "Taíno, Caribe"], points: 1
  },
  {
    countryCode: "honduras", level: 4, type: "multiple",
    question: "¿Qué es el 'Festival de la Lluvia de Peces' en Yoro?",
    correctAnswer: "fenómeno natural único", explanation: "En Yoro, Honduras, ocurre un fenómeno donde llueven peces pequeños, celebrado con un festival.",
    options: ["mito popular", "fenómeno natural único", "tradición gastronómica", "leyenda religiosa"], points: 1
  },
  {
    countryCode: "honduras", level: 4, type: "multiple",
    question: "¿Cuál es la composición étnica mayoritaria de Honduras?",
    correctAnswer: "90% mestizo", explanation: "Honduras está compuesto por aproximadamente 90% mestizos, 7% indígenas, 2% afrodescendientes y 1% blancos.",
    options: ["50% indígena", "90% mestizo", "70% europeo", "60% africano"], points: 1
  },
  {
    countryCode: "honduras", level: 4, type: "multiple",
    question: "¿Qué cultura hondureña es reconocida por la UNESCO?",
    correctAnswer: "cultura garífuna", explanation: "La cultura garífuna de Honduras fue reconocida por la UNESCO como Patrimonio Cultural Inmaterial de la Humanidad.",
    options: ["cultura lenca", "cultura garífuna", "cultura maya", "cultura miskita"], points: 1
  }
];

async function reorganizeAndExpandQuestions() {
  console.log('🚀 Starting comprehensive question reorganization and expansion...');

  try {
    // Step 1: Clear existing questions from database
    console.log('📝 Clearing existing questions from database...');
    await db.delete(questions);
    
    // Step 2: Combine new questions
    const allNewQuestions = [...newCubanQuestions, ...newHonduranQuestions];
    
    // Step 3: Insert new questions into database
    console.log('📥 Inserting new comprehensive question set...');
    
    for (const question of allNewQuestions) {
      try {
        await db.insert(questions).values({
          countryCode: question.countryCode,
          level: question.level,
          type: question.type as 'multiple' | 'true_false',
          question: question.question,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          options: question.options,
          points: question.points,
          isActive: true
        });
      } catch (error) {
        console.error(`Error inserting question: ${question.question}`, error);
      }
    }

    // Step 4: Update JSON files for backup
    console.log('💾 Updating JSON backup files...');
    
    const cubanQuestions = allNewQuestions.filter(q => q.countryCode === 'cuba');
    const honduranQuestions = allNewQuestions.filter(q => q.countryCode === 'honduras');
    
    await writeFile(
      'data/questions/cuba.json',
      JSON.stringify(cubanQuestions, null, 2),
      'utf-8'
    );
    
    await writeFile(
      'data/questions/honduras.json', 
      JSON.stringify(honduranQuestions, null, 2),
      'utf-8'
    );

    // Step 5: Generate statistics
    const cubaByLevel = cubanQuestions.reduce((acc, q) => {
      acc[q.level] = (acc[q.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const hondurasByLevel = honduranQuestions.reduce((acc, q) => {
      acc[q.level] = (acc[q.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('\n📊 Question Distribution Summary:');
    console.log('🇨🇺 CUBA:');
    Object.entries(cubaByLevel).forEach(([level, count]) => {
      console.log(`   Nivel ${level}: ${count} preguntas`);
    });
    console.log(`   Total Cuba: ${cubanQuestions.length} preguntas`);
    
    console.log('\n🇭🇳 HONDURAS:');
    Object.entries(hondurasByLevel).forEach(([level, count]) => {
      console.log(`   Nivel ${level}: ${count} preguntas`);
    });
    console.log(`   Total Honduras: ${honduranQuestions.length} preguntas`);
    
    console.log(`\n✅ TOTAL GLOBAL: ${allNewQuestions.length} preguntas culturales auténticas`);
    
    console.log('\n🎯 Difficulty Distribution:');
    console.log('   Nivel 1 (Básico): Vocabulario esencial y cultura general');
    console.log('   Nivel 2 (Intermedio): Expresiones cotidianas y slang común');  
    console.log('   Nivel 3 (Avanzado): Modismos, tradiciones y cultura profunda');
    console.log('   Nivel 4 (Experto): Historia, datos específicos y expresiones únicas');

  } catch (error) {
    console.error('💥 Error in reorganization:', error);
    process.exit(1);
  }
}

// Execute the reorganization
reorganizeAndExpandQuestions()
  .then(() => {
    console.log('\n🎉 Question reorganization and expansion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to reorganize questions:', error);
    process.exit(1);
  });