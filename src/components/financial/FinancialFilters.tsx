import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface FinancialFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
}

export const FinancialFilters = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters
}: FinancialFiltersProps) => {
  // Estado temporário local para as datas
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // Sincroniza estado local quando props mudam (ex: ao limpar filtros)
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  // Aplica os filtros ao componente pai
  const handleApplyFilters = () => {
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
  };

  // Limpa filtros locais e do pai
  const handleClearFilters = () => {
    setTempStartDate("");
    setTempEndDate("");
    onClearFilters();
  };

  // Verifica se há filtros para aplicar
  const hasFiltersToApply = tempStartDate !== startDate || tempEndDate !== endDate;

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
