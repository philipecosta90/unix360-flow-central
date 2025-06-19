
export interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_cliente: string;
  cargo: string;
  stage: string;
  valor_estimado: number;
  origem: string;
  tags: string[];
  responsavel_id: string;
  proximo_followup: string;
  observacoes: string;
  created_at: string;
}

export interface CRMCardProps {
  prospect: CRMProspect;
  isDragging?: boolean;
  onProspectClick?: (prospectId: string) => void;
}
