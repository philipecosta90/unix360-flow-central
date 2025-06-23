
import { useState } from "react";
import { AdminMetrics } from "./AdminMetrics";
import { CompanyList } from "./CompanyList";
import { CompanyFilters } from "./CompanyFilters";
import { AddCompanyDialog } from "./AddCompanyDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <Button 
          onClick={() => setIsAddCompanyOpen(true)}
          className="bg-[#43B26D] hover:bg-[#379a5d]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Métricas */}
      <AdminMetrics />

      {/* Filtros */}
      <CompanyFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
      />

      {/* Lista de empresas */}
      <CompanyList 
        searchTerm={searchTerm}
        selectedPlan={selectedPlan}
      />

      {/* Modal de adicionar empresa */}
      <AddCompanyDialog 
        open={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
      />
    </div>
  );
};
