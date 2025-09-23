-- Add cliente_id column to financeiro_lancamentos to properly link transactions to clients
ALTER TABLE public.financeiro_lancamentos 
ADD COLUMN cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;