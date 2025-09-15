import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface CompanyFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedPlan: string;
  onPlanChange: (plan: string) => void;
}

export const CompanyFilters = ({
  searchTerm,
  onSearchChange,
  selectedPlan,
  onPlanChange,
}: CompanyFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar empresas por nome ou email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="min-w-[180px]">
        <Select value={selectedPlan} onValueChange={onPlanChange}>
          <SelectTrigger className="gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Filtrar por plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os planos</SelectItem>
            <SelectItem value="gratuito">Gratuito</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};