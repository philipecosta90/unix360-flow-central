

# Analise Completa: Modulo Dieta - PRD vs Implementacao Atual

## Resumo Executivo

Analisando seu roadmap detalhado contra a implementacao atual, identifico que **aproximadamente 70% da estrutura basica ja esta pronta**, mas existem **gaps criticos** que precisam ser resolvidos para o modulo funcionar completamente.

---

## Status Detalhado por Fase

### 1. ESTRUTURA DE DADOS E BACKEND

| Item | Status | Detalhes |
|------|--------|----------|
| Tabela `planos_alimentares` (dieta_clientes) | PRONTO | Estrutura completa com 17 colunas |
| Tabela `refeicoes` (dieta_cliente_refeicoes) | PRONTO | 7 colunas incluindo ordem e horario |
| Tabela `alimentos_prescritos` (dieta_cliente_alimentos) | PRONTO | 13 colunas com link para alimento_base |
| Tabela `observacoes` por refeicao | PRONTO | Campo `observacoes` em refeicoes |
| Tabela `alimentos_base` | PRONTO (estrutura) | Tabela existe mas **SEM DADOS** |
| Importacao TACO/TBCA/etc | **PENDENTE** | Tabela vazia - 0 registros |

**Gap Critico**: A busca inteligente de alimentos nao funciona porque `alimentos_base` esta vazia!

---

### 2. INTEGRACAO COM BASE DE PACIENTES

| Item | Status | Detalhes |
|------|--------|----------|
| Conectar plano ao paciente | PRONTO | FK `cliente_id` + join com `clientes` |
| RLS por empresa | PRONTO | Politicas configuradas corretamente |
| Apenas profissional responsavel ve/edita | PRONTO | `empresa_id = get_user_empresa_id()` |

---

### 3. UI: MONTAGEM DO PLANO

| Item | Status | Detalhes |
|------|--------|----------|
| Selecionar paciente + criar plano | PRONTO | `DietaClienteDialog.tsx` |
| Escolher modelo (template) | PRONTO | `duplicateFromTemplate()` |
| Blocos de refeicoes colapsaveis | PRONTO | `Collapsible` implementado |
| Adicionar alimento via busca | PRONTO (UI) | `AlimentoSearchInput.tsx` existe |
| Filtros por tabela/macros | PRONTO (UI) | Filtros TACO/TBCA/etc na UI |
| Macros somados automaticamente | PRONTO | `calcularTotaisRefeicao()` + `calcularTotaisDieta()` |

**Gap**: A busca nao retorna resultados porque a base esta vazia.

---

### 4. OBSERVACOES INTELIGENTES (IA)

| Item | Status | Detalhes |
|------|--------|----------|
| Gerar dieta com IA | PRONTO | `DietaAIDialog.tsx` + `DietGeneratorAgent.tsx` |
| Botao por refeicao | **PENDENTE** | Nao ha botao "gerar sugestao" dentro de cada refeicao |
| Campo editavel com sugestao | **PENDENTE** | Falta implementar |

---

### 5. AGENDAMENTO DO PLANO

| Item | Status | Detalhes |
|------|--------|----------|
| Data inicio/fim | PRONTO | Campos `data_inicio` e `data_fim` existem |
| Dias da semana ativos | **PENDENTE** | Campo `dias_semana` nao existe no banco |
| Validacao de sobreposicao | **PENDENTE** | Nao ha validacao |

---

### 6. VISUALIZACAO E EXPORTACAO

| Item | Status | Detalhes |
|------|--------|----------|
| Tela de resumo do plano | PRONTO | `DietaClienteDetailDialog.tsx` |
| Exportacao PDF | **PENDENTE** | Botao existe mas marcado como TODO |

---

### 7. SEGURANCA E TESTES

| Item | Status | Detalhes |
|------|--------|----------|
| Permissoes de acesso (RLS) | PRONTO | Politicas robustas em todas as tabelas |
| Validacao de entrada | PARCIAL | Validacao basica, pode melhorar |
| Historico/versionamento | PRONTO | `dieta_historico` + `fetchHistorico()` |

---

## Prioridades de Implementacao

### PRIORIDADE 1: Popular a Base de Alimentos (CRITICO)

```
+---------------------------------------------------------+
| SEM ISSO, O MODULO NAO FUNCIONA!                        |
| A busca inteligente esta pronta mas retorna 0 resultados|
+---------------------------------------------------------+
```

**Acao**: Importar dados das tabelas TACO, TBCA, etc.

**Fontes disponiveis publicamente**:
- TACO: ~600 alimentos (UNICAMP)
- TBCA: ~2.000 alimentos (USP)
- Suplementos: Lista customizada

**Estrutura do import**:
```sql
INSERT INTO alimentos_base (
  tabela_origem, nome, grupo,
  calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fibras_100g
) VALUES 
('taco', 'Arroz, integral, cozido', 'Cereais e derivados', 124, 2.6, 25.8, 1.0, 2.7),
('taco', 'Feijao, carioca, cozido', 'Leguminosas', 76, 4.8, 13.6, 0.5, 8.5),
...
```

---

### PRIORIDADE 2: Exportacao PDF Funcional

**Arquivos a criar/modificar**:
- `src/utils/dietaPdfExport.ts` (NOVO)
- `DietaClienteDetailDialog.tsx` (conectar botao)

**Layout sugerido**:
```
+------------------------------------------+
| [LOGO EMPRESA]                           |
| PLANO ALIMENTAR                          |
+------------------------------------------+
| Paciente: Joao Silva                     |
| Objetivo: Emagrecimento                  |
| Periodo: 01/02/2026 a 01/03/2026         |
+------------------------------------------+
| RESUMO NUTRICIONAL                       |
| 1800 kcal | P: 120g | C: 180g | G: 60g   |
+------------------------------------------+
| CAFE DA MANHA (07:00)                    |
| - Ovo cozido (2 un) .......... 156 kcal  |
| - Pao integral (2 fatias) .... 140 kcal  |
| Subtotal: 296 kcal                       |
+------------------------------------------+
| ALMOCO (12:00)                           |
| ...                                      |
+------------------------------------------+
| Observacoes do Profissional:             |
| Beber 2L de agua por dia. Evitar...      |
+------------------------------------------+
```

---

### PRIORIDADE 3: Dias da Semana no Agendamento

**Migracao SQL necessaria**:
```sql
ALTER TABLE dieta_clientes ADD COLUMN dias_semana TEXT[] DEFAULT NULL;
-- Ex: ['seg', 'ter', 'qua', 'qui', 'sex']

ALTER TABLE dieta_cliente_refeicoes ADD COLUMN dias_especificos TEXT[] DEFAULT NULL;
-- Permite refeicoes diferentes por dia
```

---

### PRIORIDADE 4: Sugestoes IA por Refeicao

**Componente**: Adicionar botao em cada `CollapsibleContent`:
```tsx
<Button variant="ghost" size="sm" onClick={() => gerarSugestaoIA(refeicao)}>
  <Bot className="h-4 w-4 mr-1" />
  Sugestao IA
</Button>
```

---

## Roadmap Simplificado

| Semana | Entrega |
|--------|---------|
| 1 | Popular `alimentos_base` com TACO + TBCA (500-1000 itens iniciais) |
| 2 | Exportacao PDF funcional |
| 3 | Agendamento por dias da semana |
| 4 | Sugestoes IA por refeicao + testes |
| 5 | Polimento UX + beta com usuarios |

---

## Proximos Passos Recomendados

1. **Imediato**: Voce tem acesso aos arquivos CSV/Excel das tabelas TACO ou TBCA? Se sim, posso criar um script de importacao. Se nao, posso orientar onde obter.

2. **Apos importacao**: Testar a busca inteligente que ja esta pronta.

3. **Em paralelo**: Implementar exportacao PDF (jsPDF ja esta instalado no projeto).

---

## O que NAO Fazer (Escopo V2+)

| Item | Motivo |
|------|--------|
| Widget para app do paciente | Requer desenvolvimento mobile separado |
| Comparar dois planos | Feature avanada, nao essencial para MVP |
| Prescricao automatizada por meta calorica | Ja temos Calculadora GET + IA que faz algo similar |
| Tutorial interativo | Nice-to-have, nao bloqueante |

