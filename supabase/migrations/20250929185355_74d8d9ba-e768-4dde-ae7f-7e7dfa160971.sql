-- Corrigir foreign key constraint da tabela financeiro_tarefas
-- Passo 1: Limpar dados órfãos (cliente_id que não existe em clientes)

-- Remover a constraint incorreta
ALTER TABLE public.financeiro_tarefas 
  DROP CONSTRAINT IF EXISTS financeiro_tarefas_cliente_id_fkey;

-- Limpar cliente_id órfãos (que não existem na tabela clientes)
UPDATE public.financeiro_tarefas
SET cliente_id = NULL
WHERE cliente_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clientes 
    WHERE clientes.id = financeiro_tarefas.cliente_id
  );

-- Criar a constraint correta apontando para clientes
ALTER TABLE public.financeiro_tarefas
  ADD CONSTRAINT financeiro_tarefas_cliente_id_fkey 
  FOREIGN KEY (cliente_id) 
  REFERENCES public.clientes(id) 
  ON DELETE SET NULL;