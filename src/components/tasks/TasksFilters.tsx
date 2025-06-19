
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Início</Label>
            <Input
              id="startDate"
              type="date"
              value={(filters.startDate ?? "").toString()}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={(filters.endDate ?? "").toString()}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select 
              value={(filters.clientId ?? "").toString()} 
              onValueChange={(value) => handleFilterChange('clientId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {prospects.map((prospect) => (
                  <SelectItem key={prospect.id} value={prospect.id}>
                    {(prospect.nome ?? "Cliente sem nome").toString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="includeCompleted"
              checked={filters.includeCompleted ?? false}
              onCheckedChange={(checked) => handleFilterChange('includeCompleted', checked)}
            />
            <Label htmlFor="includeCompleted">Incluir Concluídas</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
