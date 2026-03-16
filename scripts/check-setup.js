#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Masukkan Nama Media Downloader API - Setup Check ===\n');

let allGood = true;

// 1. Check Node.js version
const nodeVersion = process.version;
const major = parseInt(nodeVersion.split('.')[0].replace('v', ''), 10);
if (major >= 18) {
  console.log(`✅ Node.js ${nodeVersion} (>= 18 required)`);
} else {
  console.log(`❌ Node.js ${nodeVersion} - Version 18+ required`);
  allGood = false;
}

// 2. Check yt-dlp
try {
  const ytdlpVersion = execFileSync('yt-dlp', ['--version'], { timeout: 10000 }).toString().trim();
  console.log(`✅ yt-dlp ${ytdlpVersion}`);
} catch {
  console.log('❌ yt-dlp not found - Install: pip install yt-dlp');
  allGood = false;
}

// 3. Check package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(pkgPath)) {
  console.log('✅ package.json found');
} else {
  console.log('❌ package.json not found');
  allGood = false;
}

// 4. Check node_modules
const modulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(modulesPath)) {
  console.log('✅ node_modules installed');
} else {
  console.log('❌ node_modules not found - Run: npm install');
  allGood = false;
}

// 5. Check .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
} else {
  console.log('⚠️  .env file not found - Copy: cp .env.example .env');
}

// 6. Check directories
const dirs = ['cookies', 'downloads'];
for (const dir of dirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/ directory exists`);
  } else {
    console.log(`⚠️  ${dir}/ directory not found (will be created on start)`);
  }
}

// 7. Check cookie files
const cookiesDir = path.join(__dirname, '..', 'cookies');
if (fs.existsSync(cookiesDir)) {
  const cookies = fs.readdirSync(cookiesDir).filter(f => f.endsWith('.txt'));
  if (cookies.length > 0) {
    console.log(`✅ ${cookies.length} cookie file(s) found: ${cookies.join(', ')}`);
  } else {
    console.log('⚠️  No cookie files found (optional)');
  }
}

console.log('\n' + (allGood ? '✅ Setup OK - Ready to start!' : '❌ Some issues need to be fixed'));
process.exit(allGood ? 0 : 1);
