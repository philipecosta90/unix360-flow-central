// =====================================================
// CÁLCULOS DE TMB (Taxa Metabólica Basal) e GET (Gasto Energético Total)
// =====================================================

export interface DadosAntropometricos {
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'masculino' | 'feminino';
  massa_livre_gordura_kg?: number;
}

export interface ResultadoCalculo {
  tmb: number;
  get: number;
  protocolo: string;
  fatorAtividade: number;
  fatorInjuria: number;
}

// ============ PROTOCOLOS DE TMB ============

export const PROTOCOLOS_TMB = {
  harris_benedict_1919: {
    id: 'harris_benedict_1919',
    nome: 'Harris-Benedict (1919)',
    descricao: 'Fórmula clássica, amplamente utilizada. Pode superestimar em 5-15% para indivíduos obesos.',
    categoria: 'adultos',
    requiresMLG: false
  },
  harris_benedict_1984: {
    id: 'harris_benedict_1984',
    nome: 'Harris-Benedict Revisada (1984)',
    descricao: 'Versão revisada com maior precisão. Recomendada para adultos saudáveis.',
    categoria: 'adultos',
    requiresMLG: false
  },
  mifflin_st_jeor: {
    id: 'mifflin_st_jeor',
    nome: 'Mifflin-St Jeor (1990)',
    descricao: 'Considerada a mais precisa para adultos. Recomendada pela Academy of Nutrition and Dietetics.',
    categoria: 'adultos',
    requiresMLG: false
  },
  fao_who_2001: {
    id: 'fao_who_2001',
    nome: 'FAO/OMS (2001)',
    descricao: 'Desenvolvida pela Organização Mundial da Saúde. Usa tabelas por faixa etária.',
    categoria: 'adultos',
    requiresMLG: false
  },
  katch_mcardle: {
    id: 'katch_mcardle',
    nome: 'Katch-McArdle (1996)',
    descricao: 'Baseada na massa livre de gordura. Ideal para atletas e pessoas com composição corporal conhecida.',
    categoria: 'adultos',
    requiresMLG: true
  },
  cunningham: {
    id: 'cunningham',
    nome: 'Cunningham (1980)',
    descricao: 'Similar à Katch-McArdle, porém com valores mais altos. Boa para atletas.',
    categoria: 'adultos',
    requiresMLG: true
  },
  tinsley: {
    id: 'tinsley',
    nome: 'Tinsley (2018)',
    descricao: 'Fórmula recente baseada apenas no peso corporal. Boa precisão para praticantes de musculação.',
    categoria: 'adultos',
    requiresMLG: false
  }
} as const;

export type ProtocoloTMB = keyof typeof PROTOCOLOS_TMB;

// ============ FATORES DE ATIVIDADE ============

export const FATORES_ATIVIDADE = [
  { valor: 1.0, nome: 'Não utilizar', descricao: 'Usar apenas TMB' },
  { valor: 1.2, nome: 'Sedentário', descricao: 'Pouco ou nenhum exercício' },
  { valor: 1.375, nome: 'Leve', descricao: 'Exercício leve 1-3 dias/semana' },
  { valor: 1.55, nome: 'Moderado', descricao: 'Exercício moderado 3-5 dias/semana' },
  { valor: 1.725, nome: 'Intenso', descricao: 'Exercício intenso 6-7 dias/semana' },
  { valor: 1.9, nome: 'Muito Intenso', descricao: 'Exercício muito intenso, atleta profissional' }
] as const;

// ============ FATORES DE INJÚRIA/ESTRESSE METABÓLICO ============

export const FATORES_INJURIA = [
  { valor: 1.0, nome: 'Sem fator', descricao: 'Paciente saudável/não complicado' },
  { valor: 1.1, nome: 'Pós-operatório (câncer)', descricao: 'Cirurgia eletiva / Pós-operatório de câncer' },
  { valor: 1.2, nome: 'Fratura', descricao: 'Fratura / Pequena cirurgia' },
  { valor: 1.27, nome: 'Câncer', descricao: 'Paciente oncológico' },
  { valor: 1.3, nome: 'Sepse leve', descricao: 'Sepse / Insuficiência renal aguda' },
  { valor: 1.35, nome: 'Pós-op cardíaco', descricao: 'Pós-operatório de cirurgia cardíaca' },
  { valor: 1.4, nome: 'Peritonite', descricao: 'Peritonite / Insuficiência cardíaca' },
  { valor: 1.5, nome: 'Multitrauma', descricao: 'Multitrauma + Reabilitação / Desnutrição grave' },
  { valor: 1.6, nome: 'Multitrauma + Sepse', descricao: 'Trauma múltiplo com sepse' },
  { valor: 1.7, nome: 'Queimadura 30-50%', descricao: 'Queimaduras 30-50% superfície corporal' },
  { valor: 1.9, nome: 'Queimadura 50-70%', descricao: 'Queimaduras 50-70% superfície corporal' },
  { valor: 2.1, nome: 'Queimadura >70%', descricao: 'Queimaduras >70% superfície corporal' }
] as const;

// ============ FUNÇÕES DE CÁLCULO ============

/**
 * Calcula TMB usando Harris-Benedict Original (1919)
 */
function calcHarrisBenedict1919(dados: DadosAntropometricos): number {
  const { peso_kg, altura_cm, idade, sexo } = dados;
  
  if (sexo === 'masculino') {
    return 66.5 + (13.75 * peso_kg) + (5.003 * altura_cm) - (6.755 * idade);
  } else {
    return 655.1 + (9.563 * peso_kg) + (1.850 * altura_cm) - (4.676 * idade);
  }
}

/**
 * Calcula TMB usando Harris-Benedict Revisada (1984)
 */
function calcHarrisBenedict1984(dados: DadosAntropometricos): number {
  const { peso_kg, altura_cm, idade, sexo } = dados;
  
  if (sexo === 'masculino') {
    return 88.362 + (13.397 * peso_kg) + (4.799 * altura_cm) - (5.677 * idade);
  } else {
    return 447.593 + (9.247 * peso_kg) + (3.098 * altura_cm) - (4.330 * idade);
  }
}

/**
 * Calcula TMB usando Mifflin-St Jeor (1990)
 */
function calcMifflinStJeor(dados: DadosAntropometricos): number {
  const { peso_kg, altura_cm, idade, sexo } = dados;
  
  const base = (10 * peso_kg) + (6.25 * altura_cm) - (5 * idade);
  return sexo === 'masculino' ? base + 5 : base - 161;
}

/**
 * Calcula TMB usando FAO/OMS (2001)
 * Baseado em tabelas por faixa etária
 */
function calcFaoWho(dados: DadosAntropometricos): number {
  const { peso_kg, idade, sexo } = dados;
  
  if (sexo === 'masculino') {
    if (idade >= 18 && idade < 30) {
      return (15.057 * peso_kg) + 692.2;
    } else if (idade >= 30 && idade < 60) {
      return (11.472 * peso_kg) + 873.1;
    } else {
      return (11.711 * peso_kg) + 587.7;
    }
  } else {
    if (idade >= 18 && idade < 30) {
      return (14.818 * peso_kg) + 486.6;
    } else if (idade >= 30 && idade < 60) {
      return (8.126 * peso_kg) + 845.6;
    } else {
      return (9.082 * peso_kg) + 658.5;
    }
  }
}

/**
 * Calcula TMB usando Katch-McArdle (1996)
 * Requer massa livre de gordura
 */
function calcKatchMcArdle(dados: DadosAntropometricos): number {
  if (!dados.massa_livre_gordura_kg) {
    throw new Error('Massa livre de gordura é necessária para o protocolo Katch-McArdle');
  }
  return 370 + (21.6 * dados.massa_livre_gordura_kg);
}

/**
 * Calcula TMB usando Cunningham (1980)
 * Requer massa livre de gordura
 */
function calcCunningham(dados: DadosAntropometricos): number {
  if (!dados.massa_livre_gordura_kg) {
    throw new Error('Massa livre de gordura é necessária para o protocolo Cunningham');
  }
  return 500 + (22 * dados.massa_livre_gordura_kg);
}

/**
 * Calcula TMB usando Tinsley (2018)
 * Baseado apenas no peso corporal
 */
function calcTinsley(dados: DadosAntropometricos): number {
  const { peso_kg, sexo } = dados;
  
  if (sexo === 'masculino') {
    return 24.8 * peso_kg + 10;
  } else {
    return 22 * peso_kg + 10;
  }
}

/**
 * Calcula a TMB baseado no protocolo selecionado
 */
export function calcularTMB(protocolo: ProtocoloTMB, dados: DadosAntropometricos): number {
  switch (protocolo) {
    case 'harris_benedict_1919':
      return calcHarrisBenedict1919(dados);
    case 'harris_benedict_1984':
      return calcHarrisBenedict1984(dados);
    case 'mifflin_st_jeor':
      return calcMifflinStJeor(dados);
    case 'fao_who_2001':
      return calcFaoWho(dados);
    case 'katch_mcardle':
      return calcKatchMcArdle(dados);
    case 'cunningham':
      return calcCunningham(dados);
    case 'tinsley':
      return calcTinsley(dados);
    default:
      throw new Error(`Protocolo desconhecido: ${protocolo}`);
  }
}

/**
 * Calcula o GET (Gasto Energético Total)
 * GET = TMB × Fator de Atividade × Fator de Injúria
 */
export function calcularGET(
  protocolo: ProtocoloTMB,
  dados: DadosAntropometricos,
  fatorAtividade: number,
  fatorInjuria: number = 1.0
): ResultadoCalculo {
  const tmb = calcularTMB(protocolo, dados);
  const get = tmb * fatorAtividade * fatorInjuria;
  
  return {
    tmb: Math.round(tmb),
    get: Math.round(get),
    protocolo,
    fatorAtividade,
    fatorInjuria
  };
}

/**
 * Calcula idade a partir da data de nascimento
 */
export function calcularIdade(dataNascimento: string | Date): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  
  if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
}

/**
 * Valida se os dados antropométricos são válidos para cálculo
 */
export function validarDadosAntropometricos(dados: Partial<DadosAntropometricos>): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];
  
  if (!dados.peso_kg || dados.peso_kg <= 0) {
    erros.push('Peso é obrigatório e deve ser maior que zero');
  } else if (dados.peso_kg < 20 || dados.peso_kg > 300) {
    erros.push('Peso deve estar entre 20 e 300 kg');
  }
  
  if (!dados.altura_cm || dados.altura_cm <= 0) {
    erros.push('Altura é obrigatória e deve ser maior que zero');
  } else if (dados.altura_cm < 100 || dados.altura_cm > 250) {
    erros.push('Altura deve estar entre 100 e 250 cm');
  }
  
  if (!dados.idade || dados.idade <= 0) {
    erros.push('Idade é obrigatória e deve ser maior que zero');
  } else if (dados.idade < 18 || dados.idade > 120) {
    erros.push('Idade deve estar entre 18 e 120 anos');
  }
  
  if (!dados.sexo) {
    erros.push('Sexo é obrigatório');
  }
  
  if (dados.massa_livre_gordura_kg !== undefined && dados.massa_livre_gordura_kg !== null) {
    if (dados.massa_livre_gordura_kg <= 0) {
      erros.push('Massa livre de gordura deve ser maior que zero');
    } else if (dados.peso_kg && dados.massa_livre_gordura_kg >= dados.peso_kg) {
      erros.push('Massa livre de gordura deve ser menor que o peso total');
    }
  }
  
  return {
    valido: erros.length === 0,
    erros
  };
}
