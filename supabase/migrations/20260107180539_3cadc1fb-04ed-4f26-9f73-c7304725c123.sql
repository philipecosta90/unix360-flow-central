-- Adicionar campo de CPF/CNPJ à tabela clientes
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS cpf_cnpj text;