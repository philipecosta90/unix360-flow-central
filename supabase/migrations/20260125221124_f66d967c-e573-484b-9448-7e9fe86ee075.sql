-- =====================================================
-- MIGRAÇÃO: Calculadora TMB/GET - Dados Antropométricos
-- =====================================================

-- 1. Adicionar campos antropométricos na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS peso_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS altura_cm INTEGER,
ADD COLUMN IF NOT EXISTS sexo TEXT CHECK (sexo IN ('masculino', 'feminino')),
ADD COLUMN IF NOT EXISTS massa_livre_gordura_kg DECIMAL(5,2);

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.peso_kg IS 'Peso do cliente em quilogramas';
COMMENT ON COLUMN public.clientes.altura_cm IS 'Altura do cliente em centímetros';
COMMENT ON COLUMN public.clientes.sexo IS 'Sexo biológico para cálculos metabólicos';
COMMENT ON COLUMN public.clientes.massa_livre_gordura_kg IS 'Massa livre de gordura em kg (para fórmulas Katch-McArdle e Cunningham)';

-- 2. Criar tabela de histórico de cálculos energéticos
CREATE TABLE public.cliente_calculos_energeticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Dados utilizados no cálculo
  peso_kg DECIMAL(5,2) NOT NULL,
  altura_cm INTEGER NOT NULL,
  idade INTEGER NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('masculino', 'feminino')),
  massa_livre_gordura_kg DECIMAL(5,2),
  
  -- Parâmetros do cálculo
  protocolo_tmb TEXT NOT NULL,
  fator_atividade DECIMAL(4,3) NOT NULL DEFAULT 1.0,
  fator_injuria DECIMAL(4,3) NOT NULL DEFAULT 1.0,
  
  -- Resultados
  tmb_kcal DECIMAL(8,2) NOT NULL,
  get_kcal DECIMAL(8,2) NOT NULL,
  
  -- Metadados
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Índices para performance
CREATE INDEX idx_calculos_energeticos_empresa ON public.cliente_calculos_energeticos(empresa_id);
CREATE INDEX idx_calculos_energeticos_cliente ON public.cliente_calculos_energeticos(cliente_id);
CREATE INDEX idx_calculos_energeticos_created ON public.cliente_calculos_energeticos(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.cliente_calculos_energeticos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- SELECT: usuários ativos podem visualizar cálculos da empresa
CREATE POLICY "cliente_calculos_energeticos_select"
  ON public.cliente_calculos_energeticos
  FOR SELECT
  USING (empresa_id = get_user_empresa_id() AND is_active_user());

-- INSERT: usuários ativos podem inserir cálculos
CREATE POLICY "cliente_calculos_energeticos_insert"
  ON public.cliente_calculos_energeticos
  FOR INSERT
  WITH CHECK (empresa_id = get_user_empresa_id() AND is_active_user());

-- UPDATE: usuários ativos podem atualizar cálculos
CREATE POLICY "cliente_calculos_energeticos_update"
  ON public.cliente_calculos_energeticos
  FOR UPDATE
  USING (empresa_id = get_user_empresa_id() AND is_active_user());

-- DELETE: apenas editores podem excluir
CREATE POLICY "cliente_calculos_energeticos_delete"
  ON public.cliente_calculos_energeticos
  FOR DELETE
  USING (empresa_id = get_user_empresa_id() AND can_edit_empresa());

-- 5. Trigger para atualizar updated_at (reutilizando função existente)
-- Nota: Se necessário criar uma coluna updated_at futuramente