#!/usr/bin/env node

// Production initialization script that runs database migration
// This script ensures the database is populated only once during deployment

import { migrateData } from './migrate-database.js';

async function initializeProduction() {
  console.log('🚀 Starting production initialization...');
  
  try {
    // Run database migration - this will populate all questions once
    await migrateData();
    console.log('✅ Production database initialized successfully');
    
    // Start the main application
    const { exec } = await import('child_process');
    console.log('🌟 Starting main application...');
    
    exec('node dist/server/index.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Application error:', error);
        process.exit(1);
      }
      if (stderr) {
        console.error('⚠️ Application stderr:', stderr);
      }
      console.log(stdout);
    });
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error);
    console.log('🔄 Attempting to start application anyway...');
    
    // Try to start the app even if migration fails
    const { exec } = await import('child_process');
    exec('node dist/server/index.js', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Application startup failed:', error);
        process.exit(1);
      }
      if (stderr) {
        console.error('⚠️ Application stderr:', stderr);
      }
      console.log(stdout);
    });
  }
}

// Only run if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeProduction();
}