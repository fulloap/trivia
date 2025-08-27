#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

console.log('🚀 Building for production...');

// Step 1: Build client with vite
console.log('📦 Building client...');
execSync('npx vite build', { stdio: 'inherit' });

// Step 2: Build server with esbuild, excluding vite modules
console.log('⚙️ Building server...');
execSync('npx esbuild server/index.ts scripts/migrate-database.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:@vitejs/* --external:"./vite.js"', { stdio: 'inherit' });

// Step 3: Copy production.js to dist
console.log('📄 Copying production modules...');
execSync('cp server/production.ts dist/production.js', { stdio: 'inherit' });

// Step 4: Fix import in the built file to use production.js
console.log('🔧 Patching imports...');
let serverCode = readFileSync('dist/index.js', 'utf8');

// Replace vite.js imports with production.js in the built file
serverCode = serverCode.replace(
  /await import\("\.\/vite\.js"\)/g, 
  'await import("./production.js")'
);

writeFileSync('dist/index.js', serverCode);

console.log('✅ Production build complete!');
console.log('📊 Build outputs:');
execSync('ls -la dist/', { stdio: 'inherit' });
execSync('ls -la dist/public/', { stdio: 'inherit' });