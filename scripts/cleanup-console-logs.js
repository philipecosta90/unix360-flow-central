#!/usr/bin/env node

/**
 * Script para limpar console.logs do projeto
 * Execução: node scripts/cleanup-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Diretorios a serem processados
const targetDirs = [
  'src/components/admin',
  'src/components/auth', 
  'src/components/clients',
  'src/components/crm',
  'src/hooks',
  'supabase/functions'
];

// Padrões de console.log para remover/substituir
const patterns = [
  // Console.logs simples de debug
  { 
    pattern: /console\.log\('🔍.*?\);?\s*$/gm,
    replacement: '// Debug log removed'
  },
  {
    pattern: /console\.log\('📋.*?\);?\s*$/gm, 
    replacement: '// Form log removed'
  },
  {
    pattern: /console\.log\('✅.*?\);?\s*$/gm,
    replacement: '// Success log removed' 
  },
  {
    pattern: /console\.log\('👤.*?\);?\s*$/gm,
    replacement: '// User log removed'
  },
  {
    pattern: /console\.log\('🏢.*?\);?\s*$/gm,
    replacement: '// Company log removed'
  },
  // Manter console.error mas remover logs verbosos
  {
    pattern: /console\.error\('❌.*?\);?\s*$/gm,
    replacement: (match) => {
      // Manter apenas se contém informação de erro útil
      if (match.includes('Erro') || match.includes('Error')) {
        return match.replace('❌ ', '');
      }
      return '// Error log removed';
    }
  }
];

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    patterns.forEach(({ pattern, replacement }) => {
      const originalContent = content;
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      if (content !== originalContent) {
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Limpo: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Diretório não encontrado: ${dirPath}`);
    return 0;
  }
  
  let filesProcessed = 0;
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      filesProcessed += processDirectory(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      if (cleanFile(fullPath)) {
        filesProcessed++;
      }
    }
  });
  
  return filesProcessed;
}

// Executar limpeza
console.log('🧹 Iniciando limpeza de console.logs...\n');

let totalFilesProcessed = 0;
targetDirs.forEach(dir => {
  console.log(`📁 Processando: ${dir}`);
  const processed = processDirectory(dir);
  totalFilesProcessed += processed;
  console.log(`   ${processed} arquivos modificados\n`);
});

console.log(`🎉 Limpeza concluída! ${totalFilesProcessed} arquivos modificados.`);