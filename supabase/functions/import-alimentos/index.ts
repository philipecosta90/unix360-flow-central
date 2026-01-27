import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlimentoImport {
  tabela_origem: string;
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

// Função para parsear número brasileiro
const parseNumero = (valor: string | number | undefined | null): number | null => {
  if (valor === undefined || valor === null || valor === '' || valor === 'tr' || valor === 'NA' || valor === '-') {
    return null;
  }
  
  if (typeof valor === 'number') {
    return isNaN(valor) ? null : valor;
  }
  
  const limpo = String(valor).trim().replace(',', '.');
  const numero = parseFloat(limpo);
  
  return isNaN(numero) ? null : numero;
};

// Limpar nome do alimento
const limparNome = (nome: string): string => {
  if (!nome) return '';
  return nome.trim().replace(/,+$/, '').replace(/\s+/g, ' ').trim();
};

// Parse CSV line with quotes support
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

// Parser para CSV da TBCA
const parseTBCA = (conteudo: string): AlimentoImport[] => {
  const linhas = conteudo.split('\n');
  const alimentos: AlimentoImport[] = [];
  
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha.trim()) continue;
    
    const campos = parseCSVLine(linha);
    if (campos.length < 10) continue;
    
    const nome = limparNome(campos[1]);
    if (!nome) continue;
    
    // Extrair grupo do nome
    const partes = nome.split(',');
    const grupo = partes[0]?.trim() || undefined;
    
    alimentos.push({
      tabela_origem: 'tbca',
      codigo_original: campos[0]?.trim(),
      nome,
      grupo,
      porcao_padrao: '100g',
      calorias_100g: parseNumero(campos[3]), // Energia Kcal
      proteinas_100g: parseNumero(campos[7]), // Proteína
      carboidratos_100g: parseNumero(campos[5]), // Carboidrato total
      gorduras_100g: parseNumero(campos[8]), // Lipídios
      fibras_100g: parseNumero(campos[9]), // Fibra alimentar
      sodio_mg: parseNumero(campos[19]), // Sódio
      calcio_mg: parseNumero(campos[17]), // Cálcio
      ferro_mg: parseNumero(campos[18]), // Ferro
      vitamina_a_mcg: parseNumero(campos[27]), // Vitamina A (RAE)
      vitamina_c_mg: parseNumero(campos[35]), // Vitamina C
    });
  }
  
  return alimentos;
};

// Parser para TACO JSON (from parsed markdown)
const parseTACO = (dados: Array<{ codigo: string; nome: string; grupo: string; energia: number; proteina: number; lipidios: number; carboidrato: number; fibra: number }>): AlimentoImport[] => {
  return dados.map(d => ({
    tabela_origem: 'taco',
    codigo_original: d.codigo,
    nome: limparNome(d.nome),
    grupo: d.grupo,
    porcao_padrao: '100g',
    calorias_100g: d.energia,
    proteinas_100g: d.proteina,
    carboidratos_100g: d.carboidrato,
    gorduras_100g: d.lipidios,
    fibras_100g: d.fibra,
  }));
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tipo, dados } = await req.json();
    
    let alimentos: AlimentoImport[] = [];
    
    if (tipo === 'tbca_csv') {
      alimentos = parseTBCA(dados);
    } else if (tipo === 'taco_json') {
      alimentos = parseTACO(dados);
    } else if (tipo === 'raw') {
      // Dados já formatados
      alimentos = dados as AlimentoImport[];
    } else {
      throw new Error(`Tipo de importação não suportado: ${tipo}`);
    }
    
    if (alimentos.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum alimento encontrado nos dados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Inserir em lotes de 100
    const batchSize = 100;
    let totalInserido = 0;
    let erros: string[] = [];
    
    for (let i = 0; i < alimentos.length; i += batchSize) {
      const batch = alimentos.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('alimentos_base')
        .upsert(
          batch.map(a => ({
            tabela_origem: a.tabela_origem,
            codigo_original: a.codigo_original || null,
            nome: a.nome,
            grupo: a.grupo || null,
            porcao_padrao: a.porcao_padrao || '100g',
            calorias_100g: a.calorias_100g,
            proteinas_100g: a.proteinas_100g,
            carboidratos_100g: a.carboidratos_100g,
            gorduras_100g: a.gorduras_100g,
            fibras_100g: a.fibras_100g,
            sodio_mg: a.sodio_mg,
            calcio_mg: a.calcio_mg,
            ferro_mg: a.ferro_mg,
            vitamina_a_mcg: a.vitamina_a_mcg,
            vitamina_c_mg: a.vitamina_c_mg,
            ativo: true,
            empresa_id: null, // Dados globais
          })),
          { onConflict: 'tabela_origem,codigo_original' }
        );
      
      if (error) {
        console.error(`Erro no batch ${i}:`, error);
        erros.push(`Batch ${i}: ${error.message}`);
      } else {
        totalInserido += batch.length;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        totalInserido,
        totalRecebido: alimentos.length,
        erros: erros.length > 0 ? erros : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro na importação:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
