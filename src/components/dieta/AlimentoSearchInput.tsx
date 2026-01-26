import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, X, Database, Plus } from 'lucide-react';
import { useAlimentosBase } from '@/hooks/useAlimentosBase';
import type { AlimentoBase, TabelaOrigem } from '@/types/dieta';
import { cn } from '@/lib/utils';

interface AlimentoSearchInputProps {
  onSelect: (alimento: AlimentoBase, quantidade: number) => void;
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
  const [portionInput, setPortionInput] = useState<{ [key: string]: string }>({});
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

  const handleSelectAlimento = (alimento: AlimentoBase) => {
    const portion = parseInt(portionInput[alimento.id] || '100') || 100;
    onSelect(alimento, portion);
    setInputValue('');
    setIsOpen(false);
    setPortionInput({});
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
          <div className="flex flex-wrap gap-1 p-2 border-b">
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
          <ScrollArea className="max-h-[300px]">
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
                  const portion = parseInt(portionInput[alimento.id] || '100') || 100;
                  const nutrients = calculateNutrientsByPortion(alimento, portion);
                  
                  return (
                    <div
                      key={alimento.id}
                      className="px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0" onClick={() => handleSelectAlimento(alimento)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {alimento.nome}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px] px-1.5 py-0", getTabelaBadgeColor(alimento.tabela_origem))}
                            >
                              {alimento.tabela_origem.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {alimento.grupo && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {alimento.grupo}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{nutrients.calorias} kcal</span>
                            <span>P: {nutrients.proteinas_g}g</span>
                            <span>C: {nutrients.carboidratos_g}g</span>
                            <span>G: {nutrients.gorduras_g}g</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={portionInput[alimento.id] || '100'}
                            onChange={(e) => {
                              e.stopPropagation();
                              setPortionInput({ ...portionInput, [alimento.id]: e.target.value });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 h-8 text-xs text-center"
                            min="1"
                          />
                          <span className="text-xs text-muted-foreground">g</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAlimento(alimento);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer com opção manual */}
          {onManualAdd && alimentos.length > 0 && (
            <div className="p-2 border-t">
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
