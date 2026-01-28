

# Plano: Corrigir Importação de Alimentos

## Problema Identificado

O erro "there is no unique or exclusion constraint matching the ON CONFLICT specification" ocorre porque:

1. **O Edge Function usa**: `onConflict: 'tabela_origem,codigo_original'` (2 colunas)
2. **O índice existente usa**: `(tabela_origem, COALESCE(codigo_original, ''), nome)` (3 colunas com função)

A sintaxe `onConflict` do Supabase não suporta índices parciais (com WHERE) nem funções como COALESCE.

---

## Solução

### Opção Escolhida: Usar INSERT simples com fallback

Como o objetivo é popular a base pela primeira vez e evitar duplicatas, a solução mais robusta é:

1. **Remover upsert** - usar INSERT simples
2. **Verificar duplicatas manualmente** antes de inserir
3. **Ignorar conflitos** usando `onConflict: { ignoreDuplicates: true }` em colunas simples

---

## Alterações Necessárias

### 1. Migração SQL - Criar índice único simples

Criar um novo índice único que o Supabase client possa usar:

```sql
-- Criar índice único simples para upsert funcionar
CREATE UNIQUE INDEX IF NOT EXISTS idx_alimentos_base_upsert 
ON alimentos_base (tabela_origem, nome) 
WHERE empresa_id IS NULL;
```

**Problema**: Índices parciais (com WHERE) também não funcionam com onConflict do JS client.

### 2. Alternativa Final - Usar INSERT com ignoreDuplicates

Modificar o Edge Function para:

```typescript
// Ao invés de upsert com onConflict complexo
const { data, error } = await supabase
  .from('alimentos_base')
  .insert(batch)
  .select();
```

E tratar duplicatas via constraint existente (o banco rejeitará e a função continua).

---

## Implementação Detalhada

### Modificar Edge Function `import-alimentos/index.ts`

Trocar a estratégia de **upsert** para **insert com tratamento de erro de duplicata**:

```typescript
// Inserir em lotes de 100
for (let i = 0; i < alimentos.length; i += batchSize) {
  const batch = alimentos.slice(i, i + batchSize);
  
  // Inserir um por um para não falhar o batch todo
  for (const alimento of batch) {
    const { error } = await supabase
      .from('alimentos_base')
      .insert({
        tabela_origem: alimento.tabela_origem,
        codigo_original: alimento.codigo_original || null,
        nome: alimento.nome,
        // ... demais campos
        empresa_id: null,
      });
    
    if (error) {
      // Se for duplicata, ignorar e continuar
      if (error.code === '23505') { // unique_violation
        continue;
      }
      erros.push(`${alimento.nome}: ${error.message}`);
    } else {
      totalInserido++;
    }
  }
}
```

**Nota**: Inserir um por um é mais lento, mas garante que duplicatas sejam ignoradas sem parar o processo.

### Alternativa mais rápida - Batch com tratamento

Manter batch, mas usar `insert` sem upsert e ignorar erros de constraint:

```typescript
const { data, error, count } = await supabase
  .from('alimentos_base')
  .insert(batchData);

if (error) {
  // Se for erro de constraint, tentar inserir um por um
  if (error.code === '23505') {
    // Fallback para inserção individual
    for (const item of batchData) {
      const { error: singleError } = await supabase
        .from('alimentos_base')
        .insert(item);
      if (!singleError) totalInserido++;
    }
  }
}
```

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| 0 alimentos inseridos | 2000+ alimentos inseridos |
| Erro de constraint em todos os batches | Inserção bem-sucedida com duplicatas ignoradas |

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/import-alimentos/index.ts` | Trocar upsert por insert + tratamento de duplicatas |

---

## Fluxo de Importação Corrigido

```text
1. Usuário faz upload de CSV/Excel
2. Frontend envia dados para Edge Function
3. Edge Function processa em batches de 100
4. Para cada batch:
   - Tenta INSERT batch completo
   - Se falhar com duplicata (23505):
     - Faz INSERT individual ignorando duplicatas
   - Conta sucessos e erros
5. Retorna total inserido e erros (se houver)
```

---

## Vantagem desta abordagem

- Não requer alteração no banco de dados
- Funciona com os índices parciais existentes
- Ignora duplicatas automaticamente
- Mantém integridade dos dados

