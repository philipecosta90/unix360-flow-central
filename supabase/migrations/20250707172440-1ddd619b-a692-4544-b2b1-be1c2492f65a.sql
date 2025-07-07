-- =========================================
-- SISTEMA DE FEEDBACK UNIX360
-- =========================================

-- Criar tabela de feedback
CREATE TABLE public.feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT,
    email TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('Sugestão', 'Bug', 'Dúvida', 'Outro')),
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção para qualquer usuário autenticado
CREATE POLICY "feedback_insert_authenticated" 
ON public.feedback 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para admins visualizarem todos os feedbacks
CREATE POLICY "feedback_select_admins_only" 
ON public.feedback 
FOR SELECT 
TO authenticated 
USING (is_admin());

-- Trigger para atualização automática do updated_at
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();