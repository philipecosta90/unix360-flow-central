-- Criar função para updated_at se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela centralizada de alimentos de referência (TACO, TBCA, etc)
CREATE TABLE public.alimentos_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id), -- NULL = dados globais (TACO/TBCA), preenchido = alimento customizado da empresa
  tabela_origem TEXT NOT NULL, -- 'taco', 'tbca', 'tbca72', 'tucunduva', 'fabricantes', 'suplementos', 'custom'
  codigo_original TEXT, -- Código na tabela original
  nome TEXT NOT NULL,
  grupo TEXT, -- Ex: Cereais, Carnes, Laticínios
  porcao_padrao TEXT DEFAULT '100g', -- Ex: 100g
  calorias_100g DECIMAL(8,2),
  proteinas_100g DECIMAL(8,3),
  carboidratos_100g DECIMAL(8,3),
  gorduras_100g DECIMAL(8,3),
  fibras_100g DECIMAL(8,3),
  sodio_mg DECIMAL(8,2),
  calcio_mg DECIMAL(8,2),
  ferro_mg DECIMAL(8,2),
  vitamina_a_mcg DECIMAL(8,2),
  vitamina_c_mg DECIMAL(8,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida
CREATE INDEX idx_alimentos_nome ON public.alimentos_base USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_alimentos_tabela ON public.alimentos_base(tabela_origem);
CREATE INDEX idx_alimentos_grupo ON public.alimentos_base(grupo);
CREATE INDEX idx_alimentos_empresa ON public.alimentos_base(empresa_id);

-- Enable RLS
ALTER TABLE public.alimentos_base ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: todos podem ler alimentos globais (empresa_id IS NULL) ou da sua empresa
CREATE POLICY "alimentos_base_select" ON public.alimentos_base
  FOR SELECT USING (
    empresa_id IS NULL OR empresa_id = get_user_empresa_id()
  );

-- Apenas a empresa pode inserir seus próprios alimentos customizados
CREATE POLICY "alimentos_base_insert" ON public.alimentos_base
  FOR INSERT WITH CHECK (
    empresa_id = get_user_empresa_id() AND is_active_user()
  );

-- Apenas a empresa pode atualizar seus próprios alimentos
CREATE POLICY "alimentos_base_update" ON public.alimentos_base
  FOR UPDATE USING (
    empresa_id = get_user_empresa_id() AND is_active_user()
  );

-- Apenas a empresa pode deletar seus próprios alimentos
CREATE POLICY "alimentos_base_delete" ON public.alimentos_base
  FOR DELETE USING (
    empresa_id = get_user_empresa_id() AND can_edit_empresa()
  );

-- Adicionar colunas de referência nas tabelas de alimentos existentes
ALTER TABLE public.dieta_cliente_alimentos 
  ADD COLUMN IF NOT EXISTS alimento_base_id UUID REFERENCES public.alimentos_base(id),
  ADD COLUMN IF NOT EXISTS tabela_origem TEXT;

ALTER TABLE public.dieta_template_alimentos 
  ADD COLUMN IF NOT EXISTS alimento_base_id UUID REFERENCES public.alimentos_base(id),
  ADD COLUMN IF NOT EXISTS tabela_origem TEXT;

-- Trigger para updated_at
CREATE TRIGGER update_alimentos_base_updated_at
  BEFORE UPDATE ON public.alimentos_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();