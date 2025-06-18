
-- Adicionar campo recorrente à tabela financeiro_lancamentos
ALTER TABLE public.financeiro_lancamentos 
ADD COLUMN recorrente BOOLEAN DEFAULT false;
