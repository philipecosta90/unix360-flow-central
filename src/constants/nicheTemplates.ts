
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  required: boolean;
}

export interface NicheConfig {
  name: string;
  leadStages: string[];
  customFields: CustomField[];
  metrics: string[];
}

export const NICHE_TEMPLATES = {
  fitness: {
    name: "Academia/Estúdio",
    leadStages: ["Interesse", "Avaliação", "Proposta", "Matrícula", "Ativo"],
    customFields: [
      { id: '1', name: 'Objetivo', type: 'select' as const, options: ['Emagrecimento', 'Hipertrofia', 'Condicionamento'], required: true },
      { id: '2', name: 'Experiência', type: 'select' as const, options: ['Iniciante', 'Intermediário', 'Avançado'], required: false },
      { id: '3', name: 'Frequência Semanal', type: 'number' as const, required: false }
    ],
    metrics: ['Frequência Semanal', 'IMC', 'Peso Atual', 'Meta de Peso']
  },
  consultoria: {
    name: "Consultoria",
    leadStages: ["Contato Inicial", "Diagnóstico", "Proposta", "Contrato", "Execução"],
    customFields: [
      { id: '1', name: 'Tipo de Consultoria', type: 'select' as const, options: ['Fitness', 'Nutricional', 'Performance'], required: true },
      { id: '2', name: 'Objetivo Principal', type: 'text' as const, required: true },
      { id: '3', name: 'IMC Inicial', type: 'number' as const, required: false },
      { id: '4', name: 'Área de Consultoria', type: 'text' as const, required: false }
    ],
    metrics: ['Sessões Realizadas', 'Resultados Alcançados', 'Satisfação', 'Renovações']
  },
  medical: {
    name: "Clínica Médica",
    leadStages: ["Agendamento", "Consulta", "Retorno", "Tratamento", "Alta"],
    customFields: [
      { id: '1', name: 'Especialidade', type: 'select' as const, options: ['Cardiologia', 'Dermatologia', 'Pediatria'], required: true },
      { id: '2', name: 'Plano de Saúde', type: 'text' as const, required: false }
    ],
    metrics: ['Consultas/Mês', 'Taxa de Retorno', 'Satisfação', 'Tempo Médio']
  },
  dental: {
    name: "Consultório Odontológico",
    leadStages: ["Triagem", "Orçamento", "Aprovação", "Tratamento", "Finalizado"],
    customFields: [
      { id: '1', name: 'Tratamento', type: 'select' as const, options: ['Limpeza', 'Restauração', 'Implante', 'Ortodontia'], required: true },
      { id: '2', name: 'Urgência', type: 'select' as const, options: ['Baixa', 'Média', 'Alta'], required: false }
    ],
    metrics: ['Procedimentos/Mês', 'Valor Médio', 'Tempo de Tratamento', 'Retorno']
  }
} as const;
