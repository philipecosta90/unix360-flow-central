import type { DietaCliente, DietaTemplate, DietaClienteRefeicao, DietaTemplateRefeicao } from '@/types/dieta';

// Calcula totais de macros para uma refeição
export function calcularTotaisRefeicao(alimentos: { calorias?: number; proteinas_g?: number; carboidratos_g?: number; gorduras_g?: number }[]) {
  return alimentos.reduce(
    (acc, alimento) => ({
      calorias: acc.calorias + (alimento.calorias || 0),
      proteinas_g: Math.round((acc.proteinas_g + (alimento.proteinas_g || 0)) * 10) / 10,
      carboidratos_g: Math.round((acc.carboidratos_g + (alimento.carboidratos_g || 0)) * 10) / 10,
      gorduras_g: Math.round((acc.gorduras_g + (alimento.gorduras_g || 0)) * 10) / 10,
    }),
    { calorias: 0, proteinas_g: 0, carboidratos_g: 0, gorduras_g: 0 }
  );
}

// Calcula totais de macros para uma dieta completa
export function calcularTotaisDieta(refeicoes: (DietaClienteRefeicao | DietaTemplateRefeicao)[]) {
  let totalCalorias = 0;
  let totalProteinas = 0;
  let totalCarboidratos = 0;
  let totalGorduras = 0;

  for (const refeicao of refeicoes) {
    const alimentos = refeicao.alimentos || [];
    for (const alimento of alimentos) {
      totalCalorias += alimento.calorias || 0;
      totalProteinas += alimento.proteinas_g || 0;
      totalCarboidratos += alimento.carboidratos_g || 0;
      totalGorduras += alimento.gorduras_g || 0;
    }
  }

  return {
    calorias_total: Math.round(totalCalorias),
    proteinas_g: Math.round(totalProteinas * 10) / 10,
    carboidratos_g: Math.round(totalCarboidratos * 10) / 10,
    gorduras_g: Math.round(totalGorduras * 10) / 10,
  };
}

// Calcula a distribuição percentual de macros
export function calcularDistribuicaoMacros(proteinas_g: number, carboidratos_g: number, gorduras_g: number) {
  const caloriasProteinas = proteinas_g * 4;
  const caloriasCarboidratos = carboidratos_g * 4;
  const caloriasGorduras = gorduras_g * 9;
  const totalCalorias = caloriasProteinas + caloriasCarboidratos + caloriasGorduras;

  if (totalCalorias === 0) {
    return { proteinas: 0, carboidratos: 0, gorduras: 0 };
  }

  return {
    proteinas: Math.round((caloriasProteinas / totalCalorias) * 100),
    carboidratos: Math.round((caloriasCarboidratos / totalCalorias) * 100),
    gorduras: Math.round((caloriasGorduras / totalCalorias) * 100),
  };
}

// Formata exibição de macros
export function formatarMacros(proteinas: number, carboidratos: number, gorduras: number): string {
  return `P: ${proteinas}g | C: ${carboidratos}g | G: ${gorduras}g`;
}

// Verifica se uma dieta precisa de recálculo
export function dietaPrecisaRecalculo(dieta: DietaCliente | DietaTemplate): boolean {
  const totaisCalculados = calcularTotaisDieta(dieta.refeicoes || []);
  
  return (
    dieta.calorias_total !== totaisCalculados.calorias_total ||
    dieta.proteinas_g !== totaisCalculados.proteinas_g ||
    dieta.carboidratos_g !== totaisCalculados.carboidratos_g ||
    dieta.gorduras_g !== totaisCalculados.gorduras_g
  );
}

// Retorna os totais recalculados de uma dieta
export function recalcularTotaisDieta(dieta: DietaCliente | DietaTemplate) {
  return calcularTotaisDieta(dieta.refeicoes || []);
}
