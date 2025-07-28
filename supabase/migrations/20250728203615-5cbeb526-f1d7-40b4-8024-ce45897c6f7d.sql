-- 1. Atualizar função is_super_admin para verificar usuário específico
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.uid() = 'b0896210-8487-4456-a5f1-056a0685ee7f'::uuid;
$$;

-- 2. Criar função para verificar se é admin da empresa (não global)
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis 
    WHERE user_id = auth.uid() 
    AND nivel_permissao = 'admin'
  );
$$;

-- 3. Política para feedback - só super admin pode ver todos os feedbacks
DROP POLICY IF EXISTS "feedback_select_admins_only" ON public.feedback;
CREATE POLICY "feedback_select_super_admin_only"
ON public.feedback
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- 4. Políticas para subscriptions - super admin vê todas
DROP POLICY IF EXISTS "subscriptions_select_all_admins" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_super_admin" ON public.subscriptions;

CREATE POLICY "subscriptions_select_super_admin_global"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- 5. Políticas para empresas - super admin vê todas
DROP POLICY IF EXISTS "empresa_select_super_admin" ON public.empresas;
CREATE POLICY "empresa_select_super_admin_global"
ON public.empresas
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- 6. Políticas para invoices - super admin vê todas
DROP POLICY IF EXISTS "invoices_select_all_admins" ON public.invoices;
DROP POLICY IF EXISTS "invoices_select_super_admin" ON public.invoices;

CREATE POLICY "invoices_select_super_admin_global"
ON public.invoices
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- 7. Atualizar função para impedir auto-promoção para admin
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não é super admin e está tentando alterar nível de permissão para admin
  IF OLD.nivel_permissao != NEW.nivel_permissao 
     AND NEW.nivel_permissao = 'admin' 
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas o super administrador pode criar administradores';
  END IF;
  
  -- Se não é admin da empresa ou super admin, não pode alterar permissões
  IF OLD.nivel_permissao != NEW.nivel_permissao 
     AND NOT (public.is_company_admin() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar níveis de permissão';
  END IF;
  
  -- Log da alteração sensível
  PERFORM public.log_sensitive_access(
    'UPDATE_PERMISSION',
    'perfis',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- 8. Criar trigger para prevenir escalação de privilégios
DROP TRIGGER IF EXISTS prevent_privilege_escalation_trigger ON public.perfis;
CREATE TRIGGER prevent_privilege_escalation_trigger
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_privilege_escalation();