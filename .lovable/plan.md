
# Plano: Corrigir Atualização Imediata de Alimentos + Adicionar Medidas Caseiras

## Problemas Identificados

### 1. Bug de Atualização da UI
O fluxo atual tem uma falha de sincronização:

```text
DietaModule (tem dietasClientes via useDietas)
    └─> DietaClientesList (recebe dietas)
        └─> DietaClienteDetailDialog (recebe dieta como prop)
            └─> Adicionar alimento
                └─> addAlimentoCliente() 
                    └─> fetchDietasClientes() atualiza o hook
                    └─> MAS: o dialog ainda usa a prop antiga!
```

O dialog recebe `dieta` como prop do parent, mas quando `fetchDietasClientes()` atualiza a lista, o componente pai não re-renderiza o dialog com os novos dados porque a referência da prop não muda até a próxima interação.

### 2. Apenas 100g disponível
O componente `AlimentoSearchInput.tsx` só oferece input numérico em gramas. Falta:
- Medidas caseiras padronizadas (colher, xícara, fatia, etc.)
- Opção de selecionar a porção padrão do alimento

---

## Solução

### Parte 1: Corrigir sincronização de dados

**Opção escolhida**: Fazer o `DietaClienteDetailDialog` buscar a dieta atualizada da lista quando ela muda.

Modificar `DietaClienteDetailDialog.tsx`:
1. Receber `dietaId` ao invés de `dieta` completa
2. Buscar a dieta atualizada da lista `dietasClientes` do hook
3. Assim quando `fetchDietasClientes()` atualiza, o componente recebe a nova versão automaticamente

```typescript
// Antes
interface Props {
  dieta: DietaCliente | null;
}

// Depois  
interface Props {
  dietaId: string | null;
}

// Dentro do componente
const { dietasClientes } = useDietas();
const dieta = dietasClientes.find(d => d.id === dietaId) || null;
```

### Parte 2: Adicionar Medidas Caseiras

Criar um sistema de medidas caseiras no componente `AlimentoSearchInput.tsx`:

**Medidas padrão disponíveis:**
| Medida | Peso aproximado |
|--------|----------------|
| Porção padrão | (do alimento_base.porcao_padrao) |
| Colher de sopa | 15g |
| Colher de chá | 5g |
| Colher de arroz | 45g |
| Xícara | 200ml/200g |
| 1/2 Xícara | 100g |
| Unidade pequena | 50g |
| Unidade média | 100g |
| Unidade grande | 150g |
| Fatia pequena | 30g |
| Fatia média | 50g |
| Fatia grande | 70g |
| À vontade | 0g (opcional) |
| Gramas | (input manual) |

**UI Melhorada:**

Substituir o input simples por um Select + quantidade:

```text
┌────────────────────────────────────────────────────────┐
│ 🔍 Buscar alimento...                                  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Arroz (polido, parboilizado)           TACO           │
│ Cereais e derivados                                   │
│ ┌──────┐ ┌─────────────────────────┐  ┌───────────┐  │
│ │  1   │ │ Colher de sopa (45g)  ▼│  │ Adicionar │  │
│ └──────┘ └─────────────────────────┘  └───────────┘  │
│ 68 kcal | P: 1.1g | C: 12.5g | G: 0.5g               │
└────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/dieta/AlimentoSearchInput.tsx` | Modificar | Adicionar select de medidas caseiras + melhorar UI |
| `src/components/dieta/DietaClienteDetailDialog.tsx` | Modificar | Receber dietaId e buscar dieta atualizada do hook |
| `src/components/dieta/DietaClientesList.tsx` | Modificar | Passar dietaId ao invés de dieta |
| `src/constants/medidasCaseiras.ts` | Criar | Constantes de medidas caseiras padronizadas |

---

## Implementação Detalhada

### 1. Criar constantes de medidas caseiras

```typescript
// src/constants/medidasCaseiras.ts
export interface MedidaCaseira {
  id: string;
  nome: string;
  pesoGramas: number;
  categoria: 'padrao' | 'colher' | 'xicara' | 'unidade' | 'fatia' | 'outros';
}

export const MEDIDAS_CASEIRAS: MedidaCaseira[] = [
  { id: 'colher_sopa', nome: 'Colher de sopa', pesoGramas: 15, categoria: 'colher' },
  { id: 'colher_cha', nome: 'Colher de chá', pesoGramas: 5, categoria: 'colher' },
  { id: 'colher_arroz', nome: 'Colher de arroz', pesoGramas: 45, categoria: 'colher' },
  { id: 'colher_sobremesa', nome: 'Colher de sobremesa', pesoGramas: 10, categoria: 'colher' },
  { id: 'xicara', nome: 'Xícara', pesoGramas: 200, categoria: 'xicara' },
  { id: 'meia_xicara', nome: '1/2 Xícara', pesoGramas: 100, categoria: 'xicara' },
  { id: 'unidade_p', nome: 'Unidade pequena', pesoGramas: 50, categoria: 'unidade' },
  { id: 'unidade_m', nome: 'Unidade média', pesoGramas: 100, categoria: 'unidade' },
  { id: 'unidade_g', nome: 'Unidade grande', pesoGramas: 150, categoria: 'unidade' },
  { id: 'fatia_p', nome: 'Fatia pequena', pesoGramas: 30, categoria: 'fatia' },
  { id: 'fatia_m', nome: 'Fatia média', pesoGramas: 50, categoria: 'fatia' },
  { id: 'fatia_g', nome: 'Fatia grande', pesoGramas: 70, categoria: 'fatia' },
  { id: 'copo_200', nome: 'Copo (200ml)', pesoGramas: 200, categoria: 'outros' },
  { id: 'copo_300', nome: 'Copo (300ml)', pesoGramas: 300, categoria: 'outros' },
  { id: 'porcao', nome: 'Porção', pesoGramas: 100, categoria: 'padrao' },
  { id: 'gramas', nome: 'Gramas', pesoGramas: 1, categoria: 'outros' },
  { id: 'a_vontade', nome: 'À vontade', pesoGramas: 0, categoria: 'outros' },
];
```

### 2. Melhorar UI do AlimentoSearchInput

- Substituir input de gramas por:
  - Input de quantidade (1, 2, 3...)
  - Select de medida caseira
- Recalcular nutrientes baseado na quantidade × peso da medida
- Exibir peso total calculado
- Melhorar layout visual para ficar mais legível

### 3. Corrigir sincronização do DietaClienteDetailDialog

- Mudar de receber `dieta: DietaCliente` para `dietaId: string`
- Usar `useDietas()` internamente para buscar a dieta atualizada
- Quando `addAlimentoCliente` chama `fetchDietasClientes()`, o componente recebe os dados atualizados automaticamente

---

## Fluxo Corrigido

```text
1. Usuário abre dialog de dieta (passa dietaId)
2. Dialog busca dieta do hook useDietas
3. Usuário clica "Adicionar Alimento"
4. Busca alimento no AlimentoSearchInput
5. Seleciona medida caseira + quantidade
6. Vê preview dos nutrientes calculados
7. Clica em adicionar
8. addAlimentoCliente() insere + chama fetchDietasClientes()
9. Hook atualiza dietasClientes
10. Dialog automaticamente mostra a dieta atualizada
11. Alimento aparece na lista imediatamente
```

---

## Resultado Esperado

1. Alimentos adicionados aparecem imediatamente sem precisar recarregar a página
2. Interface com seletor de medidas caseiras intuitivo
3. Cálculo automático de nutrientes baseado em medida + quantidade
4. UX muito mais profissional e prática
