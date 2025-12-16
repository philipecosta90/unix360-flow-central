import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useCRMProspects } from "@/hooks/useCRMProspects";

interface TasksFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    includeCompleted: boolean;
    clientId: string;
  };
  onFiltersChange: (filters: any) => void;
}

export const TasksFilters = ({ filters, onFiltersChange }: TasksFiltersProps) => {
  const { data: prospects = [] } = useCRMProspects({
    search: "",
    tags: [],
    responsavel: "",
    stage: "",
    startDate: undefined,
    endDate: undefined,
  });

  // Estado temporário local para os filtros
  const [tempFilters, setTempFilters] = useState(filters);

  // Sincroniza estado local quando props mudam (ex: ao limpar filtros)
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  const handleTempFilterChange = (key: string, value: any) => {
    const finalValue = value === "none" ? "" : value;
    setTempFilters(prev => ({ ...prev, [key]: finalValue }));
  };

  // Aplica os filtros ao componente pai
  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
  };

  // Limpa todos os filtros
  const handleClearFilters = () => {
    const clearedFilters = {
      startDate: "",
      endDate: "",
      includeCompleted: false,
      clientId: ""
    };
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Verifica se há filtros para aplicar
  const hasFiltersToApply = 
    tempFilters.startDate !== filters.startDate ||
    tempFilters.endDate !== filters.endDate ||
    tempFilters.includeCompleted !== filters.includeCompleted ||
    tempFilters.clientId !== filters.clientId;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Início</Label>
            <Input
              id="startDate"
              type="date"
              value={tempFilters.startDate}
              onChange={(e) => handleTempFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={tempFilters.endDate}
              onChange={(e) => handleTempFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select 
              value={tempFilters.clientId === "" ? "none" : tempFilters.clientId} 
              onValueChange={(value) => handleTempFilterChange('clientId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos os clientes</SelectItem>
                {prospects.map((prospect) => (
                  <SelectItem key={prospect.id} value={prospect.id}>
                    {prospect.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="includeCompleted"
              checked={tempFilters.includeCompleted}
              onCheckedChange={(checked) => handleTempFilterChange('includeCompleted', checked)}
            />
            <Label htmlFor="includeCompleted">Incluir Concluídas</Label>
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
      </CardContent>
    </Card>
  );
};
