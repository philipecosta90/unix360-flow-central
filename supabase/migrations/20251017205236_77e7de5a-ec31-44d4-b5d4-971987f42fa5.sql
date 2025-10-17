-- ===================================================================
-- CRITICAL SECURITY FIX: Proper Role Architecture + Public Access Prevention
-- ===================================================================

-- Step 1: Create app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'operacional', 'visualizacao');

-- Step 2: Create user_roles table (proper authorization architecture)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Step 4: Create helper function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 4
      WHEN 'editor' THEN 3
      WHEN 'operacional' THEN 2
      WHEN 'visualizacao' THEN 1
    END DESC
  LIMIT 1;
$$;

-- Step 5: Migrate existing data from perfis.nivel_permissao to user_roles
-- Convert nivel_permissao enum to text first, then to app_role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id,
  (nivel_permissao::text)::app_role
FROM public.perfis
WHERE nivel_permissao IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view roles in their company"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis p1
    WHERE p1.user_id = auth.uid()
    AND p1.nivel_permissao = 'admin'
    AND p1.ativo = true
    AND p1.empresa_id IN (
      SELECT p2.empresa_id 
      FROM public.perfis p2
      WHERE p2.user_id = user_roles.user_id
    )
  )
);

CREATE POLICY "Super admin can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Admins can insert roles for their company"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  AND user_id IN (
    SELECT p.user_id 
    FROM public.perfis p
    WHERE p.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Admins can update roles for their company"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND user_id IN (
    SELECT p.user_id 
    FROM public.perfis p
    WHERE p.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Admins can delete roles for their company"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND user_id IN (
    SELECT p.user_id 
    FROM public.perfis p
    WHERE p.empresa_id = public.get_user_empresa_id()
  )
);

-- Step 7: Create trigger to keep user_roles updated
CREATE OR REPLACE FUNCTION public.handle_user_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_roles_updated_at();

-- Step 8: Drop the public exposure SELECT policies and recreate properly
-- These policies were allowing public/anonymous access

-- perfis table
DROP POLICY IF EXISTS "perfis_select_company" ON public.perfis;
DROP POLICY IF EXISTS "perfis_select" ON public.perfis;
CREATE POLICY "perfis_select_authenticated_only"
ON public.perfis
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_user_empresa_id()
);

-- clientes table  
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select_authenticated_only"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- crm_prospects table
DROP POLICY IF EXISTS "crm_prospects_select_empresa_users" ON public.crm_prospects;
CREATE POLICY "crm_prospects_select_authenticated_only"
ON public.crm_prospects
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- empresas table
DROP POLICY IF EXISTS "empresa_select" ON public.empresas;
DROP POLICY IF EXISTS "empresa_select_own" ON public.empresas;
CREATE POLICY "empresa_select_authenticated_only"
ON public.empresas
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id = get_user_empresa_id()
);

-- assinaturas_cakto table
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON public.assinaturas_cakto;
CREATE POLICY "assinaturas_select_authenticated_only"
ON public.assinaturas_cakto
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND perfil_id IN (
    SELECT p.id FROM public.perfis p
    WHERE p.user_id = auth.uid() AND p.ativo = true
  )
);

-- financeiro_lancamentos table
DROP POLICY IF EXISTS "financeiro_lancamentos_select" ON public.financeiro_lancamentos;
CREATE POLICY "financeiro_lancamentos_select_authenticated_only"
ON public.financeiro_lancamentos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- contratos table
DROP POLICY IF EXISTS "contratos_select" ON public.contratos;
CREATE POLICY "contratos_select_authenticated_only"
ON public.contratos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- cliente_documentos table
DROP POLICY IF EXISTS "cliente_documentos_select" ON public.cliente_documentos;
CREATE POLICY "cliente_documentos_select_authenticated_only"
ON public.cliente_documentos
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_user_empresa_id()
);

-- cs_nps table
DROP POLICY IF EXISTS "cs_nps_select" ON public.cs_nps;
CREATE POLICY "cs_nps_select_authenticated_only"
ON public.cs_nps
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_user_empresa_id()
);

-- vendas_fechadas table
DROP POLICY IF EXISTS "vendas_fechadas_select" ON public.vendas_fechadas;
CREATE POLICY "vendas_fechadas_select_authenticated_only"
ON public.vendas_fechadas
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND empresa_id = get_active_user_empresa_id() 
  AND is_active_user()
);

-- Step 9: Add comment to nivel_permissao for future deprecation
COMMENT ON COLUMN public.perfis.nivel_permissao IS 'DEPRECATED: Use user_roles table instead. Kept for backward compatibility during migration.';