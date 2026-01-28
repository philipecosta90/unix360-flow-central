export interface MedidaCaseira {
  id: string;
  nome: string;
  pesoGramas: number;
  categoria: 'padrao' | 'colher' | 'xicara' | 'unidade' | 'fatia' | 'outros';
}

export const MEDIDAS_CASEIRAS: MedidaCaseira[] = [
  { id: 'gramas', nome: 'Gramas', pesoGramas: 1, categoria: 'outros' },
  { id: 'colher_sopa', nome: 'Colher de sopa', pesoGramas: 15, categoria: 'colher' },
  { id: 'colher_cha', nome: 'Colher de chá', pesoGramas: 5, categoria: 'colher' },
  { id: 'colher_arroz', nome: 'Colher de arroz', pesoGramas: 45, categoria: 'colher' },
  { id: 'colher_sobremesa', nome: 'Colher de sobremesa', pesoGramas: 10, categoria: 'colher' },
  { id: 'xicara', nome: 'Xícara', pesoGramas: 200, categoria: 'xicara' },
  { id: 'meia_xicara', nome: '1/2 Xícara', pesoGramas: 100, categoria: 'xicara' },
  { id: 'unidade_p', nome: 'Unidade pequena', pesoGramas: 50, categoria: 'unidade' },
  { id: 'unidade_m', nome: 'Unidade média', pesoGramas: 100, categoria: 'unidade' },
  { id: 'unidade_g', nome: 'Unidade grande', pesoGramas: 150, categoria: 'unidade' },
  { id: 'fatia_p', nome: 'Fatia pequena', pesoGramas: 30, categoria: 'fatia' },
  { id: 'fatia_m', nome: 'Fatia média', pesoGramas: 50, categoria: 'fatia' },
  { id: 'fatia_g', nome: 'Fatia grande', pesoGramas: 70, categoria: 'fatia' },
  { id: 'copo_200', nome: 'Copo (200ml)', pesoGramas: 200, categoria: 'outros' },
  { id: 'copo_300', nome: 'Copo (300ml)', pesoGramas: 300, categoria: 'outros' },
  { id: 'porcao', nome: 'Porção (100g)', pesoGramas: 100, categoria: 'padrao' },
  { id: 'a_vontade', nome: 'À vontade', pesoGramas: 0, categoria: 'outros' },
];

export const getMedidaById = (id: string): MedidaCaseira | undefined => {
  return MEDIDAS_CASEIRAS.find(m => m.id === id);
};

export const formatQuantidadeMedida = (quantidade: number, medida: MedidaCaseira): string => {
  if (medida.id === 'gramas') {
    return `${quantidade}g`;
  }
  if (medida.id === 'a_vontade') {
    return 'À vontade';
  }
  const pesoTotal = quantidade * medida.pesoGramas;
  return `${quantidade} ${medida.nome}${quantidade > 1 ? 's' : ''} (${pesoTotal}g)`;
};
