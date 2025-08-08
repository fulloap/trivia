#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Procesar preguntas de Honduras
function processHondurasQuestions() {
  const hondurasData = JSON.parse(fs.readFileSync('./attached_assets/honduras_1754693397535.json', 'utf8'));
  const processedQuestions = [];
  
  hondurasData.forEach(item => {
    const question = {
      countryCode: "honduras",
      level: item.nivel,
      type: "multiple",
      question: item.pregunta,
      correctAnswer: item.respuesta,
      explanation: item.explicacion,
      points: item.nivel * 10 + 1
    };
    
    // Si ya tiene opciones, usarlas
    if (item.opciones) {
      question.options = item.opciones;
    } else {
      // Convertir pregunta de completar a opción múltiple
      question.options = generateOptionsForHonduras(item.pregunta, item.respuesta);
    }
    
    processedQuestions.push(question);
  });
  
  return processedQuestions;
}

// Procesar preguntas de Cuba
function processCubaQuestions() {
  const cubaText = fs.readFileSync('./attached_assets/cubano_game_data_FULL_1754693397537.txt', 'utf8');
  const cubaData = JSON.parse(cubaText);
  const processedQuestions = [];
  const seenQuestions = new Set();
  
  cubaData.forEach(item => {
    // Evitar duplicados
    const questionKey = `${item.nivel}-${item.pregunta}`;
    if (seenQuestions.has(questionKey)) return;
    seenQuestions.add(questionKey);
    
    const question = {
      countryCode: "cuba",
      level: item.nivel,
      type: "multiple",
      question: item.pregunta,
      correctAnswer: item.respuesta,
      explanation: item.explicacion,
      points: item.nivel * 10 + 1
    };
    
    // Si ya tiene opciones, usarlas
    if (item.opciones) {
      question.options = item.opciones;
    } else {
      // Convertir pregunta de completar a opción múltiple
      question.options = generateOptionsForCuba(item.pregunta, item.respuesta);
    }
    
    processedQuestions.push(question);
  });
  
  return processedQuestions;
}

// Generar opciones para preguntas de Honduras
function generateOptionsForHonduras(pregunta, respuestaCorrecta) {
  const wrongOptions = [
    "comida", "bebida", "lugar", "persona", "animal", "objeto", "dinero", "trabajo", 
    "fiesta", "problema", "casa", "carro", "amigo", "familia", "escuela", "mercado",
    "feliz", "triste", "enojado", "cansado", "ocupado", "libre", "rico", "pobre",
    "grande", "pequeño", "nuevo", "viejo", "bueno", "malo", "bonito", "feo"
  ];
  
  // Filtrar opciones que no sean similares a la respuesta correcta
  const filtered = wrongOptions.filter(opt => 
    opt.toLowerCase() !== respuestaCorrecta.toLowerCase() &&
    !respuestaCorrecta.toLowerCase().includes(opt.toLowerCase()) &&
    !opt.toLowerCase().includes(respuestaCorrecta.toLowerCase())
  );
  
  // Tomar 3 opciones incorrectas aleatorias
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  const wrongAnswers = shuffled.slice(0, 3);
  
  // Combinar con la respuesta correcta y mezclar
  const allOptions = [respuestaCorrecta, ...wrongAnswers];
  return allOptions.sort(() => 0.5 - Math.random());
}

// Generar opciones para preguntas de Cuba
function generateOptionsForCuba(pregunta, respuestaCorrecta) {
  const wrongOptions = [
    "extranjero", "cubano", "turista", "dinero", "peso", "dólar", "guagua", "carro", 
    "bicicleta", "moto", "casa", "edificio", "solar", "finca", "comida", "bebida",
    "ron", "cerveza", "café", "agua", "arroz", "frijoles", "yuca", "plátano",
    "bueno", "malo", "grande", "pequeño", "rico", "pobre", "joven", "viejo",
    "feliz", "triste", "bravo", "contento", "cansado", "enfermo", "sano", "loco"
  ];
  
  // Filtrar opciones que no sean similares a la respuesta correcta
  const filtered = wrongOptions.filter(opt => 
    opt.toLowerCase() !== respuestaCorrecta.toLowerCase() &&
    !respuestaCorrecta.toLowerCase().includes(opt.toLowerCase()) &&
    !opt.toLowerCase().includes(respuestaCorrecta.toLowerCase())
  );
  
  // Tomar 3 opciones incorrectas aleatorias
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  const wrongAnswers = shuffled.slice(0, 3);
  
  // Combinar con la respuesta correcta y mezclar
  const allOptions = [respuestaCorrecta, ...wrongAnswers];
  return allOptions.sort(() => 0.5 - Math.random());
}

// Procesar ambos países
console.log('🔄 Procesando preguntas de Honduras...');
const hondurasQuestions = processHondurasQuestions();
console.log(`✅ Procesadas ${hondurasQuestions.length} preguntas de Honduras`);

console.log('🔄 Procesando preguntas de Cuba...');
const cubaQuestions = processCubaQuestions();
console.log(`✅ Procesadas ${cubaQuestions.length} preguntas de Cuba`);

// Cargar preguntas existentes
const existingCuba = JSON.parse(fs.readFileSync('./data/questions/cuba.json', 'utf8'));
const existingHonduras = JSON.parse(fs.readFileSync('./data/questions/honduras.json', 'utf8'));

// Combinar preguntas existentes con las nuevas
const allCubaQuestions = [...existingCuba, ...cubaQuestions];
const allHondurasQuestions = [...existingHonduras, ...hondurasQuestions];

// Escribir archivos actualizados
fs.writeFileSync('./data/questions/cuba.json', JSON.stringify(allCubaQuestions, null, 2));
fs.writeFileSync('./data/questions/honduras.json', JSON.stringify(allHondurasQuestions, null, 2));

console.log(`🎉 Cuba: ${allCubaQuestions.length} preguntas totales`);
console.log(`🎉 Honduras: ${allHondurasQuestions.length} preguntas totales`);

// Mostrar estadísticas por nivel
function showStats(questions, country) {
  const stats = questions.reduce((acc, q) => {
    acc[q.level] = (acc[q.level] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`\n📊 ${country}:`);
  Object.keys(stats).sort().forEach(level => {
    console.log(`  Nivel ${level}: ${stats[level]} preguntas`);
  });
}

showStats(allCubaQuestions, 'Cuba');
showStats(allHondurasQuestions, 'Honduras');