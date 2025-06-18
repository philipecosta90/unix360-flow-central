
import { useState } from "react";
import { CRMKanbanBoard } from "./CRMKanbanBoard";
import { CRMDashboard } from "./CRMDashboard";
import { CRMFilters } from "./CRMFilters";
import { AddProspectDialog } from "./AddProspectDialog";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Kanban } from "lucide-react";

export const CRMModule = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "kanban">("dashboard");
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
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-600 mt-2">Gerencie seus prospects e oportunidades</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border bg-gray-50 p-1">
            <Button
              variant={currentView === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("dashboard")}
              className={currentView === "dashboard" ? "bg-[#43B26D] hover:bg-[#37A05B]" : ""}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView("kanban")}
              className={currentView === "kanban" ? "bg-[#43B26D] hover:bg-[#37A05B]" : ""}
            >
              <Kanban className="w-4 h-4 mr-2" />
              Pipeline
            </Button>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-[#43B26D] hover:bg-[#37A05B]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Prospect
          </Button>
        </div>
      </div>

      {currentView === "dashboard" ? (
        <CRMDashboard />
      ) : (
        <>
          <CRMFilters filters={filters} onFiltersChange={setFilters} />
          <CRMKanbanBoard filters={filters} />
        </>
      )}

      <AddProspectDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
};
