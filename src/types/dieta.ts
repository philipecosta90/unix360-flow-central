// Types para o módulo de Dieta

export interface DietaTemplate {
  id: string;
  empresa_id: string;
  nome: string;
  descricao?: string;
  objetivo?: string;
  calorias_total?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  refeicoes?: DietaTemplateRefeicao[];
}

export interface DietaTemplateRefeicao {
  id: string;
  template_id: string;
  nome: string;
  horario_sugerido?: string;
  ordem: number;
  observacoes?: string;
  created_at: string;
  alimentos?: DietaTemplateAlimento[];
}

export interface DietaTemplateAlimento {
  id: string;
  refeicao_id: string;
  nome: string;
  quantidade?: string;
  calorias?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  observacoes?: string;
  ordem: number;
  created_at: string;
}

export interface DietaCliente {
  id: string;
  empresa_id: string;
  cliente_id: string;
  template_id?: string;
  nome: string;
  descricao?: string;
  objetivo?: string;
  calorias_total?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  data_inicio?: string;
  data_fim?: string;
  status: 'ativa' | 'pausada' | 'finalizada';
  observacoes_profissional?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  cliente?: {
    id: string;
    nome: string;
    foto_url?: string;
  };
  refeicoes?: DietaClienteRefeicao[];
}

export interface DietaClienteRefeicao {
  id: string;
  dieta_id: string;
  nome: string;
  horario_sugerido?: string;
  ordem: number;
  observacoes?: string;
  created_at: string;
  alimentos?: DietaClienteAlimento[];
}

export interface DietaClienteAlimento {
  id: string;
  refeicao_id: string;
  nome: string;
  quantidade?: string;
  calorias?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  observacoes?: string;
  ordem: number;
  created_at: string;
}

export interface DietaHistorico {
  id: string;
  dieta_cliente_id: string;
  versao: number;
  dados_completos: DietaCliente;
  motivo_alteracao?: string;
  created_at: string;
  created_by?: string;
}

// Types para formulários
export interface DietaTemplateFormData {
  nome: string;
  descricao?: string;
  objetivo?: string;
  calorias_total?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
}

export interface DietaClienteFormData {
  cliente_id: string;
  template_id?: string;
  nome: string;
  descricao?: string;
  objetivo?: string;
  calorias_total?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  data_inicio?: string;
  data_fim?: string;
  observacoes_profissional?: string;
}

export interface RefeicaoFormData {
  nome: string;
  horario_sugerido?: string;
  observacoes?: string;
}

export interface AlimentoFormData {
  nome: string;
  quantidade?: string;
  calorias?: number;
  proteinas_g?: number;
  carboidratos_g?: number;
  gorduras_g?: number;
  observacoes?: string;
  alimento_base_id?: string;
  tabela_origem?: string;
}

// Types para Cálculos Energéticos (TMB/GET)
export interface CalculoEnergeticoData {
  id: string;
  empresa_id: string;
  cliente_id: string;
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'masculino' | 'feminino';
  massa_livre_gordura_kg?: number;
  protocolo_tmb: string;
  fator_atividade: number;
  fator_injuria: number;
  tmb_kcal: number;
  get_kcal: number;
  observacoes?: string;
  created_at: string;
  created_by?: string;
}

export interface DadosAntropometricosCliente {
  peso_kg?: number;
  altura_cm?: number;
  sexo?: 'masculino' | 'feminino';
  massa_livre_gordura_kg?: number;
  data_nascimento?: string;
}

// Types para Alimentos Base (TACO, TBCA, etc)
export type TabelaOrigem = 'taco' | 'tbca' | 'tbca72' | 'tucunduva' | 'fabricantes' | 'suplementos' | 'custom';

export interface AlimentoBase {
  id: string;
  empresa_id?: string;
  tabela_origem: TabelaOrigem;
  codigo_original?: string;
  nome: string;
  grupo?: string;
  porcao_padrao?: string;
  calorias_100g?: number;
  proteinas_100g?: number;
  carboidratos_100g?: number;
  gorduras_100g?: number;
  fibras_100g?: number;
  sodio_mg?: number;
  calcio_mg?: number;
  ferro_mg?: number;
  vitamina_a_mcg?: number;
  vitamina_c_mg?: number;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}
