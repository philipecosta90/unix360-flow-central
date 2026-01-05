// Template padrão do sistema para check-ins semanais

export const DEFAULT_CHECKIN_TEMPLATE = {
  nome: "Check-in Semanal (Modelo)",
  descricao: "Template padrão do sistema para acompanhamento semanal. Você pode duplicar e personalizar conforme sua necessidade.",
  ativo: true,
};

export interface DefaultCheckinPergunta {
  secao: string;
  secao_icone: string;
  ordem: number;
  pergunta: string;
  tipo: string;
  pontos_maximo: number;
  obrigatoria: boolean;
  placeholder?: string;
  opcoes_pontuacao?: Record<string, number>;
}

export const DEFAULT_CHECKIN_PERGUNTAS: DefaultCheckinPergunta[] = [
  // DADOS GERAIS
  {
    secao: "DADOS GERAIS",
    secao_icone: "📋",
    ordem: 1,
    pergunta: "Como você está se sentindo essa semana?",
    tipo: "likert_5",
    pontos_maximo: 5,
    obrigatoria: true,
  },
  {
    secao: "DADOS GERAIS",
    secao_icone: "📋",
    ordem: 2,
    pergunta: "Qual foi sua maior conquista essa semana?",
    tipo: "texto",
    pontos_maximo: 0,
    obrigatoria: false,
    placeholder: "Conte sobre algo positivo que aconteceu...",
  },
  {
    secao: "DADOS GERAIS",
    secao_icone: "📋",
    ordem: 3,
    pergunta: "Teve alguma dificuldade ou desafio? Se sim, qual?",
    tipo: "texto",
    pontos_maximo: 0,
    obrigatoria: false,
    placeholder: "Descreva os obstáculos enfrentados...",
  },

  // NUTRIÇÃO
  {
    secao: "NUTRIÇÃO",
    secao_icone: "🍎",
    ordem: 4,
    pergunta: "Conseguiu seguir a dieta planejada?",
    tipo: "likert_5",
    pontos_maximo: 5,
    obrigatoria: true,
  },
  {
    secao: "NUTRIÇÃO",
    secao_icone: "🍎",
    ordem: 5,
    pergunta: "Como foi seu nível de fome durante a semana?",
    tipo: "likert_5",
    pontos_maximo: 5,
    obrigatoria: true,
  },

  // TREINO
  {
    secao: "TREINO",
    secao_icone: "💪",
    ordem: 6,
    pergunta: "Conseguiu completar os treinos planejados?",
    tipo: "likert_5",
    pontos_maximo: 5,
    obrigatoria: true,
  },
  {
    secao: "TREINO",
    secao_icone: "💪",
    ordem: 7,
    pergunta: "Como está sua energia durante os treinos?",
    tipo: "likert_5",
    pontos_maximo: 5,
    obrigatoria: true,
  },

  // SONO
  {
    secao: "SONO",
    secao_icone: "😴",
    ordem: 8,
    pergunta: "Como foi a qualidade do seu sono?",
    tipo: "likert_5",
    pontos_maximo: 5,
    obrigatoria: true,
  },
  {
    secao: "SONO",
    secao_icone: "😴",
    ordem: 9,
    pergunta: "Quantas horas dormiu em média por noite?",
    tipo: "numero",
    pontos_maximo: 0,
    obrigatoria: true,
    placeholder: "Ex: 7",
  },

  // MÉTRICAS
  {
    secao: "MÉTRICAS",
    secao_icone: "📊",
    ordem: 10,
    pergunta: "Qual seu peso atual em jejum? (kg)",
    tipo: "numero",
    pontos_maximo: 0,
    obrigatoria: true,
    placeholder: "Ex: 75.5",
  },
  {
    secao: "MÉTRICAS",
    secao_icone: "📊",
    ordem: 11,
    pergunta: "Envie sua foto de evolução da semana",
    tipo: "foto",
    pontos_maximo: 0,
    obrigatoria: false,
  },
];
