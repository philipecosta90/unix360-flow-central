
-- Remover políticas existentes da tabela crm_prospects
DROP POLICY IF EXISTS "Users can view company prospects" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can create company prospects" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can update company prospects" ON public.crm_prospects;
DROP POLICY IF EXISTS "Users can delete company prospects" ON public.crm_prospects;

-- Policy 1: SELECT - Permitir visualizar prospects da mesma empresa
CREATE POLICY "Users can view prospects from their company" 
ON public.crm_prospects 
FOR SELECT 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: INSERT - Permitir inserir prospects apenas para sua empresa
CREATE POLICY "Users can insert prospects for their company" 
ON public.crm_prospects 
FOR INSERT 
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: UPDATE - Permitir atualizar apenas prospects próprios da mesma empresa
CREATE POLICY "Users can update their own prospects from their company" 
ON public.crm_prospects 
FOR UPDATE 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  ) 
  AND created_by = auth.uid()
);

-- Policy 4: DELETE - Permitir deletar apenas prospects próprios da mesma empresa
CREATE POLICY "Users can delete their own prospects from their company" 
ON public.crm_prospects 
FOR DELETE 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  ) 
  AND created_by = auth.uid()
);
