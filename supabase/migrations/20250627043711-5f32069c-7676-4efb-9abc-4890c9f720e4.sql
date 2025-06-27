
-- Habilitar RLS na tabela cliente_documentos
ALTER TABLE public.cliente_documentos ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Permitir visualizar documentos da mesma empresa
CREATE POLICY "Users can view documents from their company" 
ON public.cliente_documentos 
FOR SELECT 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: INSERT - Permitir inserir documentos apenas para sua empresa
CREATE POLICY "Users can insert documents for their company" 
ON public.cliente_documentos 
FOR INSERT 
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: UPDATE - Permitir atualizar apenas documentos próprios da mesma empresa
CREATE POLICY "Users can update their own documents from their company" 
ON public.cliente_documentos 
FOR UPDATE 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  ) 
  AND created_by = auth.uid()
);

-- Policy 4: DELETE - Permitir deletar apenas documentos próprios da mesma empresa
CREATE POLICY "Users can delete their own documents from their company" 
ON public.cliente_documentos 
FOR DELETE 
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM perfis 
    WHERE user_id = auth.uid()
  ) 
  AND created_by = auth.uid()
);
