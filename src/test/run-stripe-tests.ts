#!/usr/bin/env node

// Script para executar testes Stripe manualmente no console
import('./stripe-integration.test.js').then(() => {
  console.log('✅ Testes Stripe executados com sucesso!');
}).catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});