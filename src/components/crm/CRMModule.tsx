
import { useState } from "react";
import { CRMKanbanBoard } from "./CRMKanbanBoard";
import { CRMFilters } from "./CRMFilters";
import { AddProspectDialog } from "./AddProspectDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const CRMModule = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    tags: [] as string[],
    responsavel: "",
    stage: "",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Pipeline</h1>
          <p className="text-gray-600 mt-2">Gerencie seus prospects e oportunidades</p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-[#43B26D] hover:bg-[#37A05B]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Prospect
        </Button>
      </div>

      <CRMFilters filters={filters} onFiltersChange={setFilters} />
      
      <CRMKanbanBoard filters={filters} />

      <AddProspectDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
};
