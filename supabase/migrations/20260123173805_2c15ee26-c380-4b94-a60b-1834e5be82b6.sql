-- =============================================
-- Fix CS Kanban Permissions for Admin and Operacional
-- =============================================

-- 1. Update is_company_admin() to use user_roles table
CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.perfis p
    INNER JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND p.ativo = TRUE
  );
$$;

-- 2. Update can_edit_empresa() to use user_roles table
CREATE OR REPLACE FUNCTION public.can_edit_empresa()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.perfis p
    INNER JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = auth.uid() 
    AND ur.role IN ('admin', 'operacional')
    AND p.ativo = TRUE
  );
$$;

-- 3. Create can_edit_cs_stages() for CS-specific permissions
CREATE OR REPLACE FUNCTION public.can_edit_cs_stages()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.perfis p
    INNER JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = auth.uid() 
    AND ur.role IN ('admin', 'operacional')
    AND p.ativo = TRUE
  );
$$;

-- 4. Drop old cs_stages policies
DROP POLICY IF EXISTS "Admins can insert cs_stages for their company" ON public.cs_stages;
DROP POLICY IF EXISTS "Admins can update cs_stages from their company" ON public.cs_stages;
DROP POLICY IF EXISTS "Admins can delete cs_stages from their company" ON public.cs_stages;

-- 5. Create new cs_stages policies for admin AND operacional
CREATE POLICY "cs_stages_insert_admin_operacional"
ON public.cs_stages
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id = get_active_user_empresa_id()
  AND can_edit_cs_stages()
);

CREATE POLICY "cs_stages_update_admin_operacional"
ON public.cs_stages
FOR UPDATE
TO authenticated
USING (
  empresa_id = get_active_user_empresa_id()
  AND can_edit_cs_stages()
);

CREATE POLICY "cs_stages_delete_admin_operacional"
ON public.cs_stages
FOR DELETE
TO authenticated
USING (
  empresa_id = get_active_user_empresa_id()
  AND can_edit_cs_stages()
);