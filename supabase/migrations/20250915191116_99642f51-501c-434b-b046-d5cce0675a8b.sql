-- Adicionar campos de datas do plano na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN data_inicio_plano date,
ADD COLUMN data_fim_plano date;