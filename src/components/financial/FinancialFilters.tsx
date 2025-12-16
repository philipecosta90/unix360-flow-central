import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface FinancialFiltersProps {
  startDate: string;
  endDate: string;
  tipo: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onTipoChange: (tipo: string) => void;
  onClearFilters: () => void;
}

export const FinancialFilters = ({
  startDate,
  endDate,
  tipo,
  onStartDateChange,
  onEndDateChange,
  onTipoChange,
  onClearFilters
}: FinancialFiltersProps) => {
  // Estado temporário local para os filtros
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempTipo, setTempTipo] = useState(tipo);

  // Sincroniza estado local quando props mudam (ex: ao limpar filtros)
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempTipo(tipo);
  }, [startDate, endDate, tipo]);

  // Aplica os filtros ao componente pai
  const handleApplyFilters = () => {
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
    onTipoChange(tempTipo);
  };

  // Limpa filtros locais e do pai
  const handleClearFilters = () => {
    setTempStartDate("");
    setTempEndDate("");
    setTempTipo("");
    onClearFilters();
  };

  // Verifica se há filtros para aplicar
  const hasFiltersToApply = tempStartDate !== startDate || tempEndDate !== endDate || tempTipo !== tipo;

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Inicial</Label>
          <Input 
            id="startDate" 
            type="date" 
            value={tempStartDate} 
            onChange={e => setTempStartDate(e.target.value)} 
            className="w-40" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Data Final</Label>
          <Input 
            id="endDate" 
            type="date" 
            value={tempEndDate} 
            onChange={e => setTempEndDate(e.target.value)} 
            className="w-40" 
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tempTipo} onValueChange={setTempTipo}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Receitas</SelectItem>
              <SelectItem value="saida">Despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleApplyFilters}
          disabled={!hasFiltersToApply}
          className="h-10"
        >
          <Search className="h-4 w-4 mr-2" />
          Aplicar Filtros
        </Button>

        <Button 
          variant="outline" 
          onClick={handleClearFilters} 
          className="h-10"
        >
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};
