-- Criar tabela para documentos de contratos
CREATE TABLE public.contratos_documentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL,
  contrato_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_arquivo text,
  tamanho integer DEFAULT 0,
  url_arquivo text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contratos_documentos ENABLE ROW LEVEL SECURITY;

-- Create policies for contratos_documentos
CREATE POLICY "contratos_documentos_select" 
ON public.contratos_documentos 
FOR SELECT 
USING ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

CREATE POLICY "contratos_documentos_insert" 
ON public.contratos_documentos 
FOR INSERT 
WITH CHECK ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

CREATE POLICY "contratos_documentos_update" 
ON public.contratos_documentos 
FOR UPDATE 
USING ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

CREATE POLICY "contratos_documentos_delete" 
ON public.contratos_documentos 
FOR DELETE 
USING ((empresa_id = get_active_user_empresa_id()) AND is_active_user());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_contratos_documentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contratos_documentos_updated_at
BEFORE UPDATE ON public.contratos_documentos
FOR EACH ROW
EXECUTE FUNCTION public.handle_contratos_documentos_updated_at();

-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', false);

-- Create policies for contract documents storage
CREATE POLICY "Contract documents are viewable by users of same company" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload contract documents for their company" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update contract documents for their company" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete contract documents for their company" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'contract-documents' AND auth.uid()::text = (storage.foldername(name))[1]);