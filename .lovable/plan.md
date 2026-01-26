
# Plano: Alinhar Modulo Dieta ao PRD Completo

## Resumo Executivo

Sua implementacao atual cobre cerca de **60% do PRD**. Os principais gaps sao: tabelas alimentares oficiais (TACO/TBCA), busca inteligente, exportacao PDF funcional, agendamento por dias da semana, e recalculo automatico de totais.

---

## Analise de Gaps Detalhada

### O que JA FUNCIONA

| Feature | Status |
|---------|--------|
| Templates reutilizaveis | Completo |
| Dietas vinculadas a clientes | Completo |
| Estrutura refeicoes + alimentos | Completo |
| Macros (P/C/G/kcal) por alimento | Completo |
| Integracao IA para gerar dietas | Completo |
| Historico de versoes (snapshots) | Completo |
| Calculadora TMB/GET com protocolos | Completo |

### O que PRECISA ser implementado

| Feature | Prioridade | Fase |
|---------|------------|------|
| Tabelas alimentares (TACO, TBCA) | CRITICA | MVP |
| Busca inteligente de alimentos | CRITICA | MVP |
| Exportacao PDF funcional | ALTA | V1 |
| Recalculo automatico de totais | ALTA | MVP |
| Agendamento dias da semana | MEDIA | V1 |
| Edicao/remocao alimentos e refeicoes | ALTA | MVP |
| UI colapsavel para refeicoes | MEDIA | V1 |

---

## Roadmap Proposto

### FASE 1: MVP Dieta (Prioridade Critica)

#### 1.1 Banco de Alimentos com Tabelas Oficiais

**Banco de dados:**

```sql
-- Tabela centralizada de alimentos de referencia
CREATE TABLE alimentos_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela_origem TEXT NOT NULL, -- 'taco', 'tbca', 'tbca72', 'tucunduva', 'fabricantes', 'suplementos', 'custom'
  codigo_original TEXT, -- Codigo na tabela original
  nome TEXT NOT NULL,
  grupo TEXT, -- Ex: Cereais, Carnes, Laticinios
  porcao_padrao TEXT, -- Ex: 100g
  calorias_100g DECIMAL(8,2),
  proteinas_100g DECIMAL(8,3),
  carboidratos_100g DECIMAL(8,3),
  gorduras_100g DECIMAL(8,3),
  fibras_100g DECIMAL(8,3),
  sodio_mg DECIMAL(8,2),
  -- Micronutrientes opcionais
  calcio_mg DECIMAL(8,2),
  ferro_mg DECIMAL(8,2),
  vitamina_a_mcg DECIMAL(8,2),
  vitamina_c_mg DECIMAL(8,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para busca rapida
CREATE INDEX idx_alimentos_nome ON alimentos_base USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_alimentos_tabela ON alimentos_base(tabela_origem);
CREATE INDEX idx_alimentos_grupo ON alimentos_base(grupo);
```

**Arquivos:**
- `src/hooks/useAlimentosBase.ts` - Hook para busca/filtro
- `src/components/dieta/AlimentoSearchInput.tsx` - Input com autocomplete

#### 1.2 Busca Inteligente de Alimentos

Substituir input de texto livre por busca com autocomplete:

```
+-----------------------------------------------+
| Buscar alimento...                      [Q]   |
+-----------------------------------------------+
| Filtros: [TACO] [TBCA] [Suplementos] [Todos]  |
|                                               |
| Resultados:                                   |
| +-------------------------------------------+ |
| | Peito de Frango Grelhado (TACO)           | |
| | 100g | 159 kcal | P: 32g | C: 0g | G: 3g  | |
| +-------------------------------------------+ |
| | Frango, peito, sem pele, grelhado (TBCA)  | |
| | 100g | 165 kcal | P: 31g | C: 0g | G: 4g  | |
| +-------------------------------------------+ |
+-----------------------------------------------+
```

**Arquivos:**
- Modificar `DietaAlimentoDialog.tsx` para usar busca
- Criar `AlimentoSearchResults.tsx` para lista de resultados

#### 1.3 Recalculo Automatico de Totais

Quando alimentos sao adicionados/removidos, recalcular automaticamente:
- Total de calorias da dieta
- Total de proteinas, carboidratos, gorduras
- Totais por refeicao

**Arquivos:**
- `src/utils/dietaCalculations.ts` - Funcoes de calculo
- Modificar `useDietas.ts` para recalcular apos mudancas

#### 1.4 CRUD Completo de Alimentos e Refeicoes

Adicionar funcoes faltantes:
- `updateRefeicaoTemplate()` / `updateRefeicaoCliente()`
- `deleteRefeicaoTemplate()` / `deleteRefeicaoCliente()`
- `updateAlimentoTemplate()` / `updateAlimentoCliente()`
- `deleteAlimentoTemplate()` / `deleteAlimentoCliente()`

**Arquivos:**
- Modificar `useDietas.ts`
- Adicionar botoes de editar/remover na UI

---

### FASE 2: V1 Dieta (Apos MVP)

#### 2.1 Exportacao PDF Funcional

Layout profissional:
- Logo da empresa
- Dados do cliente
- Macros totais
- Lista de refeicoes formatada
- Observacoes do profissional

**Arquivos:**
- `src/utils/dietaPdfExport.ts` usando jsPDF
- Modificar botao existente em `DietaClienteDetailDialog.tsx`

#### 2.2 UI Colapsavel para Refeicoes

Usar componente `Collapsible` para melhor escaneabilidade:

```
+-- Cafe da Manha (07:00) ----- [+] Alimento -----+
|   > Peito de frango 150g                        |
|   > Arroz integral 100g                         |
|   > Salada verde                                |
|   Subtotal: 450 kcal | P: 35g | C: 40g | G: 12g |
+-------------------------------------------------+
```

**Arquivos:**
- Modificar `DietaClienteDetailDialog.tsx`
- Modificar `DietaTemplateDetailDialog.tsx`

#### 2.3 Agendamento por Dias da Semana

**Banco de dados:**

```sql
ALTER TABLE dieta_clientes ADD COLUMN dias_semana TEXT[]; 
-- Ex: ['seg', 'ter', 'qua', 'qui', 'sex']

ALTER TABLE dieta_cliente_refeicoes ADD COLUMN dias_especificos TEXT[];
-- Permite refeicoes diferentes por dia
```

**UI:**
- Adicionar seletor de dias no formulario de dieta
- Opcao de variar cardapio por dia

#### 2.4 Observacoes com IA por Refeicao

Botao em cada refeicao para gerar:
- Sugestoes de substituicao
- Dicas de preparo
- Alertas nutricionais

---

### FASE 3: V2 Dieta (Expansao Futura)

| Feature | Descricao |
|---------|-----------|
| Visualizacao para paciente | Portal ou app para cliente ver sua dieta |
| Refeicoes favoritas | Salvar e reutilizar refeicoes frequentes |
| Biblioteca compartilhada | Templates entre profissionais |
| Lembretes WhatsApp | Integrar com modulo de mensagens |
| Dashboard de adesao | Metricas de seguimento da dieta |

---

## O que REMOVER ou IGNORAR do PRD

| Item do PRD | Motivo |
|-------------|--------|
| NestJS backend | Projeto usa Supabase/Edge Functions |
| Tutorial interativo | Pode ser feito depois, nao e MVP |
| Criacao automatica via meta calorica | Ja temos Calculadora GET + IA |

---

## Estrutura de Arquivos Proposta

```
src/
  components/
    dieta/
      DietaModule.tsx (existente)
      DietaCalculadoraGET.tsx (existente)
      DietaClienteDetailDialog.tsx (modificar)
      DietaTemplateDetailDialog.tsx (modificar)
      DietaAlimentoDialog.tsx (modificar para busca)
      AlimentoSearchInput.tsx (NOVO)
      AlimentoSearchResults.tsx (NOVO)
      DietaPdfExport.tsx (NOVO)
      DietaDiasSemanaSelector.tsx (NOVO - V1)
  hooks/
    useDietas.ts (expandir CRUD)
    useAlimentosBase.ts (NOVO)
  utils/
    dietaCalculations.ts (NOVO)
    dietaPdfExport.ts (NOVO)
    tmbCalculations.ts (existente)
```

---

## Proximos Passos Recomendados

1. **Primeiro**: Popular banco de alimentos com dados TACO/TBCA
2. **Segundo**: Implementar busca inteligente
3. **Terceiro**: CRUD completo + recalculo automatico
4. **Quarto**: Exportacao PDF funcional
5. **Quinto**: UI colapsavel + agendamento dias

---

## Decisao Necessaria

O maior investimento e a **integracao das tabelas alimentares oficiais** (TACO, TBCA, etc). Isso requer:

1. Obter dados oficiais das tabelas (disponiveis publicamente)
2. Normalizar e importar para o banco
3. Manter atualizacoes

**Pergunta**: Voce ja tem acesso aos arquivos das tabelas TACO/TBCA ou precisa que eu oriente como obte-los e importa-los?
