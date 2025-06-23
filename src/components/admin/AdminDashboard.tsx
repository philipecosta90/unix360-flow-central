
import { useState } from "react";
import { AdminMetrics } from "./AdminMetrics";
import { CompanyList } from "./CompanyList";
import { CompanyFilters } from "./CompanyFilters";

export const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
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
    </div>
  );
};
