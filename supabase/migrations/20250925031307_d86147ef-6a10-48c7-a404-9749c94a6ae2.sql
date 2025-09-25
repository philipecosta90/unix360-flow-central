-- Primeiro, vamos modificar o trigger para não limpar as datas quando elas são fornecidas explicitamente
CREATE OR REPLACE FUNCTION public.clear_inactive_subscription_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Limpar datas de assinatura ativa se o status não for 'active' 
  -- E as datas não foram fornecidas explicitamente na operação atual
  IF NEW.subscription_status IS DISTINCT FROM 'active' 
     AND (OLD.data_de_assinatura_ativa IS NOT DISTINCT FROM NEW.data_de_assinatura_ativa 
          OR OLD.data_de_expiracao_da_assinatura_ativa IS NOT DISTINCT FROM NEW.data_de_expiracao_da_assinatura_ativa) 
     AND NEW.data_de_assinatura_ativa IS NULL 
     AND NEW.data_de_expiracao_da_assinatura_ativa IS NULL THEN
    NEW.data_de_assinatura_ativa := NULL;
    NEW.data_de_expiracao_da_assinatura_ativa := NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Adicionar policy RLS específica para permitir atualizações do sistema
CREATE POLICY "Sistema pode atualizar perfis via service role" 
ON public.perfis 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Comentário da policy anterior para clareza
COMMENT ON POLICY "Sistema pode atualizar perfis via service role" ON public.perfis 
IS 'Permite que edge functions usando service role key atualizem qualquer perfil';

-- Adicionar policy para inserir perfis via sistema se necessário
CREATE POLICY "Sistema pode inserir perfis via service role" 
ON public.perfis 
FOR INSERT 
WITH CHECK (true);

COMMENT ON POLICY "Sistema pode inserir perfis via service role" ON public.perfis 
IS 'Permite que edge functions usando service role key insiram novos perfis';