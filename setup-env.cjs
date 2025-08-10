#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Environment setup script
const environments = {
  local: '.env.local',
  production: '.env.production',
  example: '.env.example'
};

function setupEnvironment(env) {
  const envFile = environments[env];
  
  if (!envFile) {
    console.error('❌ Geçersiz environment:', env);
    console.log('✅ Kullanılabilir environmentlar:', Object.keys(environments).join(', '));
    process.exit(1);
  }
  
  const sourcePath = path.join(__dirname, envFile);
  const targetPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ ${envFile} dosyası bulunamadı!`);
    process.exit(1);
  }
  
  try {
    // Backup existing .env if it exists
    if (fs.existsSync(targetPath)) {
      const backupPath = path.join(__dirname, `.env.backup.${Date.now()}`);
      fs.copyFileSync(targetPath, backupPath);
      console.log(`📦 Mevcut .env dosyası yedeklendi: ${path.basename(backupPath)}`);
    }
    
    // Copy the environment file
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ Environment başarıyla ayarlandı: ${env}`);
    console.log(`📁 Kaynak: ${envFile}`);
    console.log(`🎯 Hedef: .env`);
    
    // Show current configuration
    const envContent = fs.readFileSync(targetPath, 'utf8');
    const apiUrl = envContent.match(/API_BASE_URL=(.+)/)?.[1] || 'Bulunamadı';
    const frontendUrl = envContent.match(/FRONTEND_URL=(.+)/)?.[1] || 'Bulunamadı';
    const nodeEnv = envContent.match(/NODE_ENV=(.+)/)?.[1] || 'Bulunamadı';
    
    console.log('\n📋 Mevcut Yapılandırma:');
    console.log(`   NODE_ENV: ${nodeEnv}`);
    console.log(`   API_BASE_URL: ${apiUrl}`);
    console.log(`   FRONTEND_URL: ${frontendUrl}`);
    
  } catch (error) {
    console.error('❌ Environment setup hatası:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('🔧 Environment Setup Tool');
  console.log('\nKullanım:');
  console.log('  node setup-env.js <environment>');
  console.log('\nÖrnekler:');
  console.log('  node setup-env.js local      # Local development için');
  console.log('  node setup-env.js production # Production için');
  console.log('\nMevcut environmentlar:');
  Object.entries(environments).forEach(([key, file]) => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`  ${key.padEnd(12)} -> ${file} ${exists ? '✅' : '❌'}`);
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

const environment = args[0].toLowerCase();
setupEnvironment(environment);