// Parser para arquivos de alimentos (TACO e TBCA)
import * as XLSX from 'xlsx';

export interface AlimentoImportado {
  tabela_origem: 'taco' | 'tbca' | 'tbca72' | 'tucunduva' | 'fabricantes' | 'suplementos' | 'custom';
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
}

// Função para parsear número brasileiro (vírgula como separador decimal)
const parseNumero = (valor: string | number | undefined | null): number | undefined => {
  if (valor === undefined || valor === null || valor === '' || valor === 'tr' || valor === 'NA' || valor === '-') {
    return undefined;
  }
  
  if (typeof valor === 'number') {
    return isNaN(valor) ? undefined : valor;
  }
  
  // Substituir vírgula por ponto e remover espaços
  const limpo = String(valor).trim().replace(',', '.');
  const numero = parseFloat(limpo);
  
  return isNaN(numero) ? undefined : numero;
};

// Função para limpar nome do alimento
const limparNome = (nome: string): string => {
  if (!nome) return '';
  
  return nome
    .trim()
    .replace(/,+$/, '') // Remover vírgulas finais
    .replace(/\s+/g, ' ') // Normalizar espaços
    .trim();
};

// Parser para CSV da TBCA
export const parseTBCA_CSV = (conteudoCSV: string): AlimentoImportado[] => {
  const linhas = conteudoCSV.split('\n');
  const alimentos: AlimentoImportado[] = [];
  
  // Pular header (primeira linha)
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha.trim()) continue;
    
    // Parse CSV com suporte a campos entre aspas
    const campos = parseCSVLine(linha);
    
    if (campos.length < 10) continue;
    
    const [
      id, // ID
      nomeCompleto, // ALIMENTO
      _energiaKJ, // Energia KJ
      energiaKcal, // Energia Kcal
      _umidade, // Umidade g
      _carbTotal, // Carboidrato total
      _carbDisp, // Carboidrato disponível
      proteina, // Proteína
      lipidios, // Lipídios
      fibra, // Fibra alimentar
      _alcool, // Álcool
      _cinzas, // Cinzas
      _colesterol, // Colesterol
      _agsaturados, // Ácidos graxos saturados
      _agmono, // Ácidos graxos monoinsaturados
      _agpoli, // Ácidos graxos polinsaturados
      _agtrans, // Ácidos graxos trans
      calcio, // Cálcio
      ferro, // Ferro
      sodio, // Sódio
    ] = campos;
    
    const nome = limparNome(nomeCompleto);
    if (!nome) continue;
    
    // Extrair grupo do nome (primeira parte antes da vírgula)
    const partes = nome.split(',');
    const grupo = partes[0]?.trim() || undefined;
    
    alimentos.push({
      tabela_origem: 'tbca',
      codigo_original: id?.trim(),
      nome,
      grupo,
      porcao_padrao: '100g',
      calorias_100g: parseNumero(energiaKcal),
      proteinas_100g: parseNumero(proteina),
      carboidratos_100g: parseNumero(campos[5]), // Carboidrato total
      gorduras_100g: parseNumero(lipidios),
      fibras_100g: parseNumero(fibra),
      sodio_mg: parseNumero(sodio),
      calcio_mg: parseNumero(calcio),
      ferro_mg: parseNumero(ferro),
      vitamina_a_mcg: parseNumero(campos[26]), // Vitamina A (RAE)
      vitamina_c_mg: parseNumero(campos[35]), // Vitamina C
    });
  }
  
  return alimentos;
};

// Helper para parsear linha CSV com campos entre aspas
const parseCSVLine = (linha: string): string[] => {
  const campos: string[] = [];
  let campoAtual = '';
  let dentroAspas = false;
  
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    
    if (char === '"') {
      dentroAspas = !dentroAspas;
    } else if (char === ',' && !dentroAspas) {
      campos.push(campoAtual.trim());
      campoAtual = '';
    } else {
      campoAtual += char;
    }
  }
  
  campos.push(campoAtual.trim());
  return campos;
};

// Parser para Excel TACO (baseado no formato markdown extraído)
export const parseTACO_Markdown = (conteudoMarkdown: string): AlimentoImportado[] => {
  const linhas = conteudoMarkdown.split('\n');
  const alimentos: AlimentoImportado[] = [];
  let grupoAtual = '';
  
  for (const linha of linhas) {
    // Detectar grupo (linhas que não começam com | e não são vazias)
    if (!linha.startsWith('|') && linha.trim() && !linha.startsWith('#') && !linha.startsWith('-')) {
      grupoAtual = linha.trim();
      continue;
    }
    
    // Ignorar headers e separadores
    if (!linha.startsWith('|') || linha.includes('---') || linha.includes('Código e descrição')) {
      continue;
    }
    
    // Parse da linha de tabela
    const partes = linha.split('|').filter(p => p.trim());
    
    if (partes.length < 8) continue;
    
    // Formato: Código | Nome | CódigoPrep | Preparação | Energia | Proteína | Lipídios | Carboidrato | Fibra
    const [codigo, nome, _codPrep, preparacao, energia, proteina, lipidios, carboidrato, fibra] = partes.map(p => p.trim());
    
    // Ignorar linhas de header ou vazias
    if (!nome || nome.includes('descrição') || nome.includes('Tabela')) continue;
    
    // Construir nome completo incluindo preparação se não for "Não se aplica"
    let nomeCompleto = nome;
    if (preparacao && preparacao !== 'Não se aplica' && preparacao !== '99') {
      nomeCompleto = `${nome}, ${preparacao}`;
    }
    
    // Verificar se já existe (evitar duplicatas por código + preparação)
    const chave = `${codigo}_${preparacao}`;
    
    alimentos.push({
      tabela_origem: 'taco',
      codigo_original: codigo,
      nome: limparNome(nomeCompleto),
      grupo: grupoAtual || undefined,
      porcao_padrao: '100g',
      calorias_100g: parseNumero(energia),
      proteinas_100g: parseNumero(proteina),
      carboidratos_100g: parseNumero(carboidrato),
      gorduras_100g: parseNumero(lipidios),
      fibras_100g: parseNumero(fibra),
    });
  }
  
  // Remover duplicatas baseado no nome + preparação
  const vistos = new Set<string>();
  return alimentos.filter(a => {
    const chave = `${a.codigo_original}_${a.nome}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
};

// Parser para Excel TACO usando XLSX
export const parseTACO_Excel = async (buffer: ArrayBuffer): Promise<AlimentoImportado[]> => {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    raw: true,
  }) as unknown[][];
  
  const alimentos: AlimentoImportado[] = [];
  let grupoAtual = '';
  
  // Procurar início dos dados (linha após header)
  let inicioData = 0;
  for (let i = 0; i < jsonData.length; i++) {
    const linha = jsonData[i];
    if (Array.isArray(linha) && linha[0] && String(linha[0]).match(/^\d{7}$/)) {
      inicioData = i;
      break;
    }
  }
  
  for (let i = inicioData; i < jsonData.length; i++) {
    const linha = jsonData[i] as unknown[];
    
    if (!linha || linha.length === 0) continue;
    
    // Detectar linha de grupo (só primeira coluna preenchida, sem código numérico)
    if (linha[0] && !String(linha[0]).match(/^\d+$/) && !linha[4]) {
      grupoAtual = String(linha[0]).trim();
      continue;
    }
    
    // Linha de dados
    const codigo = linha[0] ? String(linha[0]).trim() : '';
    const nome = linha[1] ? String(linha[1]).trim() : '';
    const codPrep = linha[2] ? String(linha[2]) : '';
    const preparacao = linha[3] ? String(linha[3]).trim() : '';
    const energia = linha[4] as string | number | undefined;
    const proteina = linha[5] as string | number | undefined;
    const lipidios = linha[6] as string | number | undefined;
    const carboidrato = linha[7] as string | number | undefined;
    const fibra = linha[8] as string | number | undefined;
    
    if (!nome || !codigo.match(/^\d+$/)) continue;
    
    // Construir nome completo
    let nomeCompleto = nome;
    if (preparacao && preparacao !== 'Não se aplica' && codPrep !== '99') {
      nomeCompleto = `${nome}, ${preparacao}`;
    }
    
    alimentos.push({
      tabela_origem: 'taco',
      codigo_original: codigo,
      nome: limparNome(nomeCompleto),
      grupo: grupoAtual || undefined,
      porcao_padrao: '100g',
      calorias_100g: parseNumero(energia),
      proteinas_100g: parseNumero(proteina),
      carboidratos_100g: parseNumero(carboidrato),
      gorduras_100g: parseNumero(lipidios),
      fibras_100g: parseNumero(fibra),
    });
  }
  
  // Remover duplicatas
  const vistos = new Set<string>();
  return alimentos.filter(a => {
    const chave = `${a.codigo_original}_${a.nome}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
};

// Função para gerar SQL de INSERT
export const gerarSQL_Inserts = (alimentos: AlimentoImportado[]): string => {
  const valores = alimentos.map(a => {
    const escape = (v: string | undefined) => v ? `'${v.replace(/'/g, "''")}'` : 'NULL';
    const num = (v: number | undefined) => v !== undefined ? v : 'NULL';
    
    return `(
      '${a.tabela_origem}',
      ${escape(a.codigo_original)},
      ${escape(a.nome)},
      ${escape(a.grupo)},
      ${escape(a.porcao_padrao)},
      ${num(a.calorias_100g)},
      ${num(a.proteinas_100g)},
      ${num(a.carboidratos_100g)},
      ${num(a.gorduras_100g)},
      ${num(a.fibras_100g)},
      ${num(a.sodio_mg)},
      ${num(a.calcio_mg)},
      ${num(a.ferro_mg)},
      ${num(a.vitamina_a_mcg)},
      ${num(a.vitamina_c_mg)},
      true,
      NULL
    )`;
  });
  
  return `INSERT INTO alimentos_base (
    tabela_origem,
    codigo_original,
    nome,
    grupo,
    porcao_padrao,
    calorias_100g,
    proteinas_100g,
    carboidratos_100g,
    gorduras_100g,
    fibras_100g,
    sodio_mg,
    calcio_mg,
    ferro_mg,
    vitamina_a_mcg,
    vitamina_c_mg,
    ativo,
    empresa_id
  ) VALUES
${valores.join(',\n')};`;
};
