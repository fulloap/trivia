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

function removeDuplicates(countryCode: string): void {
  const filePath = path.join('data', 'questions', `${countryCode}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`\n🧹 Cleaning duplicates for ${countryCode.toUpperCase()}`);
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions: Question[] = Array.isArray(data) ? data : [];
  
  console.log(`Original questions: ${questions.length}`);
  
  // Track unique questions by normalized question text
  const uniqueQuestions = new Map<string, Question>();
  const duplicatesRemoved: number[] = [];
  
  questions.forEach((question, index) => {
    // Normalize the question text for comparison
    const normalizedQuestion = question.question
      .toLowerCase()
      .trim()
      .replace(/[¿¡]/g, '') // Remove Spanish question marks
      .replace(/[.,:;]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace
    
    if (uniqueQuestions.has(normalizedQuestion)) {
      duplicatesRemoved.push(index);
      console.log(`DUPLICATE [${index}]: "${question.question.substring(0, 60)}..."`);
    } else {
      uniqueQuestions.set(normalizedQuestion, question);
    }
  });
  
  // Convert map back to array
  const cleanedQuestions = Array.from(uniqueQuestions.values());
  
  console.log(`Duplicates removed: ${duplicatesRemoved.length}`);
  console.log(`Clean questions: ${cleanedQuestions.length}`);
  
  // Sort by level and maintain consistent structure
  cleanedQuestions.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.question.localeCompare(b.question);
  });
  
  // Create backup
  const backupPath = filePath.replace('.json', '.backup.json');
  fs.writeFileSync(backupPath, fs.readFileSync(filePath));
  console.log(`Backup created: ${backupPath}`);
  
  // Write cleaned data
  fs.writeFileSync(filePath, JSON.stringify(cleanedQuestions, null, 2));
  console.log(`✅ File cleaned: ${filePath}`);
  
  // Show level distribution
  const levelCounts = cleanedQuestions.reduce((acc, q) => {
    acc[q.level] = (acc[q.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  console.log(`\nLevel distribution:`);
  Object.entries(levelCounts).forEach(([level, count]) => {
    console.log(`  Level ${level}: ${count} questions`);
  });
}

function main() {
  console.log('🔧 REMOVING DUPLICATE QUESTIONS');
  console.log('================================');
  
  const countries = ['cuba', 'honduras'];
  
  countries.forEach(countryCode => {
    removeDuplicates(countryCode);
  });
  
  console.log('\n✨ Cleanup completed!');
  console.log('\nTo verify the results, run: tsx scripts/check-duplicates.ts');
}

main();