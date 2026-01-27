

# Plano: Gerenciamento de Dados Financeiros ao Inativar Cliente

## Resumo do Problema

Quando um cliente e marcado como "inativo", as transacoes financeiras pendentes (a_receber=true) e vencidas continuam aparecendo no sistema:
- No dashboard em "A Receber" 
- Na lista de "Transacoes Vencidas"
- Na tabela de transacoes do modulo financeiro

Isso gera alertas e valores incorretos, ja que o cliente nao vai mais efetuar pagamentos.

## Dados Atuais Afetados

Atualmente existem **9 transacoes** de clientes inativos somando valores significativos que nao deveriam aparecer como pendentes:
- Andriel: R$ 2.814,67 (3 parcelas)
- Jucineide Abreu: R$ 1.332,33
- Juliana Jardim: R$ 1.198,50
- E outros...

---

## Solucao Proposta

### 1. Modificar o Dialogo de Inativacao

Transformar o dialogo simples em um dialogo com opcoes:

```
+--------------------------------------------------+
| ⚠️ Inativar Cliente                              |
+--------------------------------------------------+
| Tem certeza que deseja marcar "Jucineide Abreu"  |
| como inativo?                                     |
|                                                   |
| Este cliente possui:                              |
|  • 2 transacao(oes) pendentes (A Receber)         |
|  • R$ 2.664,66 em valores a receber               |
|                                                   |
| O que fazer com os dados financeiros?             |
|                                                   |
| ○ Manter transacoes (ficam no historico)          |
|   - Marcar como "nao a receber" para sair dos     |
|     alertas                                       |
|                                                   |
| ○ Excluir transacoes pendentes                    |
|   - Remove completamente os lancamentos futuros   |
+--------------------------------------------------+
|                    [Cancelar] [Confirmar]         |
+--------------------------------------------------+
```

### 2. Logica de Negocio

**Opcao A: Manter Transacoes**
- Atualiza `a_receber = false` nas transacoes do cliente
- Adiciona flag opcional `cancelado_motivo = 'cliente_inativo'` para auditoria
- Transacoes ficam no historico mas nao geram alertas

**Opcao B: Excluir Transacoes**
- Deleta todas as transacoes com `a_receber = true` do cliente
- Somente transacoes futuras/pendentes sao removidas
- Transacoes ja recebidas (a_receber=false) sao mantidas

---

## Implementacao Tecnica

### Arquivos a Modificar

#### 1. `src/components/clients/SetInactiveButton.tsx`

Expandir o componente para:
- Buscar transacoes pendentes do cliente antes de mostrar dialogo
- Exibir resumo financeiro (quantidade e valor total)
- Adicionar RadioGroup para escolha da acao
- Executar acao escolhida antes de inativar

```tsx
// Estrutura proposta
interface PendingTransactions {
  count: number;
  total: number;
  transactions: Array<{ id: string; descricao: string; valor: number }>;
}

const [pendingData, setPendingData] = useState<PendingTransactions | null>(null);
const [financialAction, setFinancialAction] = useState<'keep' | 'delete'>('keep');

// Buscar ao abrir dialogo
useEffect(() => {
  if (open) {
    fetchPendingTransactions(clientId);
  }
}, [open]);
```

#### 2. Funcoes de Banco de Dados

**Manter transacoes (marcar como nao a receber):**
```sql
UPDATE financeiro_lancamentos 
SET a_receber = false, 
    observacoes = COALESCE(observacoes, '') || ' [Cancelado: cliente inativo]'
WHERE cliente_id = $clientId 
AND a_receber = true;
```

**Excluir transacoes pendentes:**
```sql
DELETE FROM financeiro_lancamentos 
WHERE cliente_id = $clientId 
AND a_receber = true;
```

### 3. Fluxo de Execucao

```text
Clique "Inativar"
       |
       v
Buscar transacoes pendentes do cliente
       |
       v
[Tem transacoes pendentes?]
       |
  Sim  |  Nao
       |   |
       v   v
Mostrar opcoes  Inativar direto
       |
       v
Usuario escolhe acao
       |
       v
Executar acao financeira (keep/delete)
       |
       v
Marcar cliente como inativo
       |
       v
Invalidar queries (financial-transactions, dashboard-data)
```

---

## Impacto nas Queries Existentes

Apos implementacao, as transacoes de clientes inativos:

1. **Se "Manter"**: Ficam com `a_receber=false`, nao aparecem mais em alertas
2. **Se "Excluir"**: Sao removidas completamente do banco

Nenhuma modificacao necessaria em:
- `useFinancialTransactions.ts` 
- `useDashboardData.ts`
- `OverdueTransactionsDialog.tsx`

A logica atual ja funciona corretamente filtrando por `a_receber = true`.

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/clients/SetInactiveButton.tsx` | Modificar | Adicionar busca de transacoes, opcoes de acao, logica de processamento |

---

## Consideracoes Adicionais

### UI/UX
- O dialogo so mostra opcoes se houver transacoes pendentes
- Se nao houver transacoes, mantem o comportamento atual (simples confirmacao)
- Adicionar loading state durante processamento
- Toast de sucesso informando acao tomada

### Seguranca
- Usar RLS existente para garantir que so transacoes da empresa sejam afetadas
- Transacoes ja recebidas (a_receber=false) nunca sao excluidas

### Auditoria (opcional para futuro)
- Adicionar coluna `cancelado_em` e `cancelado_motivo` na tabela financeiro_lancamentos
- Permite rastrear quando transacoes foram canceladas por inativacao

---

## Resultado Esperado

1. Usuario clica "Inativar" no card do cliente
2. Sistema busca transacoes pendentes
3. Dialogo mostra resumo: "2 transacoes pendentes - R$ 2.664,66"
4. Usuario escolhe: "Manter" ou "Excluir"
5. Sistema executa acao financeira + inativa cliente
6. Dashboard e alertas refletem imediatamente a mudanca
7. Toast confirma: "Cliente inativado. 2 transacoes pendentes foram marcadas como nao a receber."

