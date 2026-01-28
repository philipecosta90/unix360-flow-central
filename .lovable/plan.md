
# Plano: Campo Editável "Últ. Contato" + Alerta de Clientes em Risco no Planner

## Resumo do Problema

1. A coluna "Últ. Contato" no Planner de Clientes está apenas exibindo a data, sem permitir edição manual
2. Não há indicação visual de clientes que estão há mais de 10 dias sem contato
3. O usuário precisa registrar manualmente quando fez o último contato com cada cliente

---

## Solução Proposta

### 1. Criar Componente de Célula Editável para Data de Último Contato

Adicionar um novo componente `UltimoContatoCell` no arquivo `CSPlannerCell.tsx` que:
- Exibe a data formatada ou "-" se não houver data
- Ao clicar, abre um DatePicker para seleção da data
- Calcula e exibe visualmente quantos dias se passaram desde o último contato
- Mostra alerta visual (badge vermelho) quando > 10 dias sem contato

```text
+----------------------------------+
| Últ. Contato                     |
+----------------------------------+
| 15/01/2026                       |  (Normal - verde/neutro)
| 13 dias ⚠️                       |  (Em risco - vermelho)
| -                                |  (Sem registro - amarelo)
+----------------------------------+
```

### 2. Adicionar Filtro/Seção de Clientes em Risco

Adicionar na interface do Planner:
- Toggle ou badge para filtrar apenas clientes em risco (10+ dias sem contato)
- Contador visual de quantos clientes estão em risco
- Ordenação opcional por "dias sem contato"

```text
+--------------------------------------------------+
| Planner de Clientes     ⚠️ 5 em risco    [🔍]   |
+--------------------------------------------------+
| [Mostrar apenas em risco] ☑                      |
+--------------------------------------------------+
| Nome     | Contrato | ... | Últ. Contato | ...  |
| Andriel  | Voucher  | ... | ⚠️ 15 dias   | ...  |
| Brenno   | Semest.  | ... | ⚠️ 12 dias   | ...  |
+--------------------------------------------------+
```

---

## Implementação Técnica

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/cs/CSPlannerCell.tsx` | Adicionar | Novo componente `UltimoContatoCell` com DatePicker e cálculo de dias |
| `src/components/cs/CSPlanner.tsx` | Modificar | Integrar o novo componente + filtro de clientes em risco |
| `src/hooks/useCSPlanner.ts` | Verificar | Já possui mutation para atualizar `ultimo_contato` |

---

### Componente UltimoContatoCell

```tsx
interface UltimoContatoCellProps {
  value: string | null;
  onChange: (value: string) => void;
}

// Funcionalidades:
// - Exibe data formatada DD/MM/AAAA
// - Calcula dias desde o último contato
// - Badge verde: < 7 dias (OK)
// - Badge amarelo: 7-10 dias (Atenção)
// - Badge vermelho: > 10 dias (Em risco)
// - Clique abre Popover com Calendar (DatePicker)
// - Usa toLocalISODate() para salvar no formato correto
```

---

### Lógica de Cálculo de Dias

```typescript
const calcularDiasSemContato = (ultimoContato: string | null): number => {
  if (!ultimoContato) return -1; // Sem registro
  const hoje = new Date();
  const ultimo = parseLocalDate(ultimoContato);
  const diffMs = hoje.getTime() - ultimo.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

// Cores por status:
// dias < 0 (sem data): amarelo/warning
// dias <= 7: verde
// dias 8-10: amarelo
// dias > 10: vermelho com ícone ⚠️
```

---

### Filtro de Clientes em Risco

No CSPlanner, adicionar estado e lógica:

```typescript
const [showOnlyRisk, setShowOnlyRisk] = useState(false);

const clientesFiltrados = useMemo(() => {
  let filtered = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (showOnlyRisk) {
    filtered = filtered.filter(cliente => {
      const dias = calcularDiasSemContato(cliente.ultimo_contato);
      return dias > 10 || dias < 0; // Em risco ou sem registro
    });
  }
  
  return filtered;
}, [clientes, searchTerm, showOnlyRisk]);

// Contador de clientes em risco
const clientesEmRisco = clientes.filter(c => 
  calcularDiasSemContato(c.ultimo_contato) > 10 || 
  !c.ultimo_contato
).length;
```

---

## Fluxo de Uso

```text
1. Usuário entra na aba "Planner"
2. Vê a tabela com coluna "Últ. Contato"
   - Clientes sem contato há 10+ dias aparecem com badge vermelho
   - Badge mostra "12 dias" ou "Sem registro"
3. Clica na célula de um cliente
4. Abre DatePicker com calendário
5. Seleciona a data do último contato
6. Sistema salva no campo `ultimo_contato` da tabela `clientes`
7. A UI atualiza automaticamente (React Query invalidation)
8. Badge muda de cor conforme os dias
```

---

## Alinhamento com Lógica Existente

A lógica atual em `useCustomerSuccess.ts` usa interações (tabela `cs_interacoes`) para calcular clientes em risco baseado em 7 dias. 

**Para o Planner, usaremos:**
- Campo `ultimo_contato` da tabela `clientes` (entrada manual)
- Critério de 10 dias (conforme solicitado pelo usuário)
- Independente das interações formais cadastradas

Isso permite que o profissional registre contatos rápidos (WhatsApp, ligação) sem precisar criar uma interação formal no sistema.

---

## Resultado Esperado

1. Coluna "Últ. Contato" clicável com DatePicker
2. Badge visual mostrando dias desde último contato
3. Cores: verde (OK), amarelo (atenção), vermelho (risco)
4. Filtro "Mostrar apenas em risco" no topo
5. Contador "X clientes em risco" visível
6. Data salva corretamente no banco sem problemas de timezone

---

## Dependências

- Componente Calendar/DatePicker já existente no projeto
- Utilitários `toLocalISODate` e `parseLocalDate` de `@/utils/dateUtils`
- Mutation `updateClientePlanner` já suporta atualizar `ultimo_contato`
