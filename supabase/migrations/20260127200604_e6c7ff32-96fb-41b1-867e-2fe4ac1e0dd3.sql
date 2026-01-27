-- Criar índice único para evitar duplicatas de alimentos
-- Permite NULL em codigo_original usando COALESCE

-- Primeiro, remover duplicatas existentes se houver
DELETE FROM alimentos_base a
USING alimentos_base b
WHERE a.id > b.id
  AND a.tabela_origem = b.tabela_origem
  AND COALESCE(a.codigo_original, '') = COALESCE(b.codigo_original, '')
  AND a.nome = b.nome;

-- Criar índice único parcial para controlar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_alimentos_base_unique_entry 
ON alimentos_base (tabela_origem, COALESCE(codigo_original, ''), nome)
WHERE empresa_id IS NULL;

-- Criar índice para empresa_id + nome (alimentos customizados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_alimentos_base_empresa_unique 
ON alimentos_base (empresa_id, tabela_origem, nome)
WHERE empresa_id IS NOT NULL;

-- Índice GIN para busca full-text em português
CREATE INDEX IF NOT EXISTS idx_alimentos_base_nome_gin 
ON alimentos_base USING gin (to_tsvector('portuguese', nome));

-- Índice para filtro por tabela_origem
CREATE INDEX IF NOT EXISTS idx_alimentos_base_tabela_origem 
ON alimentos_base (tabela_origem) WHERE ativo = true;

-- Índice para filtro por grupo
CREATE INDEX IF NOT EXISTS idx_alimentos_base_grupo 
ON alimentos_base (grupo) WHERE ativo = true AND grupo IS NOT NULL;