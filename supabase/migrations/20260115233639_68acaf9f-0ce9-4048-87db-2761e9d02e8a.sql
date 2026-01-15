-- Corrigir registros órfãos: atualizar status para "enviado" onde já foi enviado mas ficou pendente
UPDATE public.checkin_envios
SET status = 'enviado'
WHERE status = 'pendente' 
  AND enviado_em IS NOT NULL
  AND created_at < NOW() - INTERVAL '1 hour';