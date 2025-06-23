
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface CompanyFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPlan: string;
  onPlanChange: (value: string) => void;
}

export const CompanyFilters = ({
  searchTerm,
  onSearchChange,
  selectedPlan,
  onPlanChange
}: CompanyFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nome da empresa..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={selectedPlan || "todos"} onValueChange={onPlanChange}>
        <SelectTrigger className="w-full sm:w-48">
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
  );
};
