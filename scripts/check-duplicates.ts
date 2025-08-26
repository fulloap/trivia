#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

interface Question {
  countryCode: string;
  level: number;
  type: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  options: string[];
  points: number;
}

function loadQuestions(countryCode: string): Question[] {
  const filePath = path.join('data', 'questions', `${countryCode}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return [];
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(data) ? data : [];
}

function checkDuplicates(questions: Question[], countryName: string): void {
  console.log(`\n=== Checking duplicates for ${countryName} ===`);
  console.log(`Total questions: ${questions.length}`);
  
  // Since questions don't have IDs, we'll use the index
  const duplicateIds: any[] = [];
  
  // Check for duplicate descriptions (exact match)
  const descriptionMap = new Map<string, number[]>();
  
  questions.forEach((q, index) => {
    const desc = q.question.trim().toLowerCase();
    if (descriptionMap.has(desc)) {
      descriptionMap.get(desc)!.push(index);
    } else {
      descriptionMap.set(desc, [index]);
    }
  });
  
  const duplicateDescriptions = Array.from(descriptionMap.entries())
    .filter(([_, indices]) => indices.length > 1);
  
  if (duplicateDescriptions.length > 0) {
    console.log(`\nDUPLICATE DESCRIPTIONS found:`);
    duplicateDescriptions.forEach(([desc, indices]) => {
      console.log(`"${desc.substring(0, 80)}..."`);
      console.log(`  Found at indices: ${indices.join(', ')}`);
      indices.forEach(idx => {
        console.log(`    [${idx}] Level: ${questions[idx].level}, Points: ${questions[idx].points}`);
      });
      console.log('');
    });
  }
  
  // Check for similar descriptions (fuzzy match)
  const similarDescriptions: Array<[number, number, string, string]> = [];
  
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const desc1 = questions[i].question.trim().toLowerCase();
      const desc2 = questions[j].question.trim().toLowerCase();
      
      // Simple similarity check: if one description contains the other (minus common words)
      const cleanDesc1 = desc1.replace(/\b(qué|cómo|cuál|dónde|significa|se|dice|la|el|una|un|de|en|para|por)\b/g, '').trim();
      const cleanDesc2 = desc2.replace(/\b(qué|cómo|cuál|dónde|significa|se|dice|la|el|una|un|de|en|para|por)\b/g, '').trim();
      
      if (cleanDesc1.length > 20 && cleanDesc2.length > 20) {
        if (cleanDesc1.includes(cleanDesc2) || cleanDesc2.includes(cleanDesc1)) {
          if (desc1 !== desc2) { // Not exact duplicates
            similarDescriptions.push([i, j, desc1, desc2]);
          }
        }
      }
    }
  }
  
  if (similarDescriptions.length > 0) {
    console.log(`\nSIMILAR DESCRIPTIONS found (potential duplicates):`);
    similarDescriptions.slice(0, 10).forEach(([i, j, desc1, desc2]) => {
      console.log(`[${i}] "${desc1.substring(0, 60)}..."`);
      console.log(`[${j}] "${desc2.substring(0, 60)}..."`);
      console.log('');
    });
    if (similarDescriptions.length > 10) {
      console.log(`... and ${similarDescriptions.length - 10} more similar pairs`);
    }
  }
  
  // Summary by level
  const levelCounts = questions.reduce((acc, q) => {
    acc[q.level] = (acc[q.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  console.log(`\nQuestions by level:`);
  Object.entries(levelCounts).forEach(([level, count]) => {
    console.log(`  Level ${level}: ${count} questions`);
  });
  
  console.log(`\nSUMMARY for ${countryName}:`);
  console.log(`- Total questions: ${questions.length}`);
  console.log(`- Duplicate IDs: ${duplicateIds.length}`);
  console.log(`- Duplicate descriptions: ${duplicateDescriptions.length}`);
  console.log(`- Similar descriptions: ${similarDescriptions.length}`);
}

function main() {
  console.log('🔍 CHECKING FOR DUPLICATE QUESTIONS');
  console.log('=====================================');
  
  const countries = ['cuba', 'honduras'];
  
  countries.forEach(countryCode => {
    const questions = loadQuestions(countryCode);
    const countryName = countryCode.charAt(0).toUpperCase() + countryCode.slice(1);
    checkDuplicates(questions, countryName);
  });
  
  console.log('\n✅ Duplicate check completed!');
}

main();