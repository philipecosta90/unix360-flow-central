import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, X, Database, Plus, Check } from 'lucide-react';
import { useAlimentosBase } from '@/hooks/useAlimentosBase';
import { MEDIDAS_CASEIRAS, formatQuantidadeMedida, getMedidaById } from '@/constants/medidasCaseiras';
import type { AlimentoBase, TabelaOrigem } from '@/types/dieta';
import { cn } from '@/lib/utils';

interface AlimentoSearchInputProps {
  onSelect: (alimento: AlimentoBase, quantidade: number, medidaTexto: string) => void;
  onManualAdd?: () => void;
  placeholder?: string;
  className?: string;
}

const TABELAS_FILTRO: { value: TabelaOrigem | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'taco', label: 'TACO' },
  { value: 'tbca', label: 'TBCA' },
  { value: 'suplementos', label: 'Suplementos' },
  { value: 'custom', label: 'Meus Alimentos' },
];

const getTabelaBadgeColor = (tabela: TabelaOrigem) => {
  switch (tabela) {
    case 'taco': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'tbca': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'tbca72': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
    case 'tucunduva': return 'bg-purple-500/10 text-purple-600 border-purple-200';
    case 'fabricantes': return 'bg-orange-500/10 text-orange-600 border-orange-200';
    case 'suplementos': return 'bg-pink-500/10 text-pink-600 border-pink-200';
    case 'custom': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
  }
};

interface AlimentoSelection {
  quantidade: number;
  medidaId: string;
}

export const AlimentoSearchInput = ({ 
  onSelect, 
  onManualAdd,
  placeholder = "Buscar alimento...",
  className 
}: AlimentoSearchInputProps) => {
  const { 
    alimentos, 
    loading, 
    searchAlimentos, 
    filters, 
    setFilters,
    calculateNutrientsByPortion 
  } = useAlimentosBase({ limit: 30 });
  
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<TabelaOrigem | 'todos'>('todos');
  const [selections, setSelections] = useState<{ [alimentoId: string]: AlimentoSelection }>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 2) {
        searchAlimentos(inputValue);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, searchAlimentos]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (tabela: TabelaOrigem | 'todos') => {
    setSelectedFilter(tabela);
    setFilters({ ...filters, tabela_origem: tabela });
    if (inputValue.length >= 2) {
      searchAlimentos(inputValue, { tabela_origem: tabela });
    }
  };

  const getSelection = (alimentoId: string): AlimentoSelection => {
    return selections[alimentoId] || { quantidade: 1, medidaId: 'porcao' };
  };

  const updateSelection = (alimentoId: string, updates: Partial<AlimentoSelection>) => {
    setSelections(prev => ({
      ...prev,
      [alimentoId]: { ...getSelection(alimentoId), ...updates }
    }));
  };

  const calculatePesoTotal = (alimentoId: string): number => {
    const selection = getSelection(alimentoId);
    const medida = getMedidaById(selection.medidaId);
    if (!medida) return 100;
    if (medida.id === 'gramas') return selection.quantidade;
    return selection.quantidade * medida.pesoGramas;
  };

  const handleSelectAlimento = (alimento: AlimentoBase) => {
    const selection = getSelection(alimento.id);
    const medida = getMedidaById(selection.medidaId);
    const pesoTotal = calculatePesoTotal(alimento.id);
    const medidaTexto = medida ? formatQuantidadeMedida(selection.quantidade, medida) : `${pesoTotal}g`;
    
    onSelect(alimento, pesoTotal, medidaTexto);
    setInputValue('');
    setIsOpen(false);
    setSelections({});
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-8"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          {/* Filtros de tabela */}
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
            {TABELAS_FILTRO.map(({ value, label }) => (
              <Badge
                key={value}
                variant={selectedFilter === value ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => handleFilterChange(value)}
              >
                {label}
              </Badge>
            ))}
          </div>

          {/* Resultados */}
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alimentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum alimento encontrado
                </p>
                {onManualAdd && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => {
                      setIsOpen(false);
                      onManualAdd();
                    }}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar manualmente
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {alimentos.map((alimento) => {
                  const selection = getSelection(alimento.id);
                  const pesoTotal = calculatePesoTotal(alimento.id);
                  const nutrients = calculateNutrientsByPortion(alimento, pesoTotal);
                  const medida = getMedidaById(selection.medidaId);
                  const isGramas = selection.medidaId === 'gramas';
                  
                  return (
                    <div
                      key={alimento.id}
                      className="px-3 py-3 hover:bg-muted/50 border-b last:border-0"
                    >
                      {/* Header do alimento */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {alimento.nome}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px] px-1.5 py-0 shrink-0", getTabelaBadgeColor(alimento.tabela_origem))}
                            >
                              {alimento.tabela_origem.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {alimento.grupo && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {alimento.grupo}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Seletor de quantidade e medida */}
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          type="number"
                          value={selection.quantidade}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            updateSelection(alimento.id, { quantidade: Math.max(1, val) });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 h-9 text-center"
                          min="1"
                          step={isGramas ? "10" : "1"}
                        />
                        
                        <Select
                          value={selection.medidaId}
                          onValueChange={(value) => {
                            updateSelection(alimento.id, { 
                              medidaId: value,
                              quantidade: value === 'gramas' ? 100 : 1
                            });
                          }}
                        >
                          <SelectTrigger className="flex-1 h-9" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {MEDIDAS_CASEIRAS.map((medida) => (
                              <SelectItem key={medida.id} value={medida.id}>
                                {medida.nome} {medida.pesoGramas > 0 && medida.id !== 'gramas' && `(${medida.pesoGramas}g)`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          className="h-9 px-3 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAlimento(alimento);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      
                      {/* Preview de nutrientes */}
                      <div className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1.5">
                        <span className="text-muted-foreground">
                          {medida && medida.id !== 'a_vontade' && (
                            <span className="font-medium text-foreground">{pesoTotal}g</span>
                          )}
                          {medida?.id === 'a_vontade' && (
                            <span className="italic">Sem cálculo</span>
                          )}
                        </span>
                        {medida?.id !== 'a_vontade' && (
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-orange-600">{nutrients.calorias} kcal</span>
                            <span className="text-blue-600">P: {nutrients.proteinas_g}g</span>
                            <span className="text-amber-600">C: {nutrients.carboidratos_g}g</span>
                            <span className="text-red-600">G: {nutrients.gorduras_g}g</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer com opção manual */}
          {onManualAdd && alimentos.length > 0 && (
            <div className="p-2 border-t bg-muted/20">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-xs"
                onClick={() => {
                  setIsOpen(false);
                  onManualAdd();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Não encontrou? Adicionar manualmente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
