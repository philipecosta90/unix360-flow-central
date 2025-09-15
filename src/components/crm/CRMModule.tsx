import { useState } from "react";
import { CRMKanbanBoard } from "./CRMKanbanBoard";
import { CRMDashboard } from "./CRMDashboard";
import { CRMFollowupAlerts } from "./CRMFollowupAlerts";
import { CRMFilters } from "./CRMFilters";
import { AddProspectDialog } from "./AddProspectDialog";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Kanban } from "lucide-react";
export const CRMModule = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentView, setCurrentView] = useState<"kanban" | "dashboard">("kanban");
  const [filters, setFilters] = useState({
    search: "",
    tags: [] as string[],
    responsavel: "",
    stage: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  });
  return <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-lime-500">CRM</h1>
          <p className="text-gray-600 mt-2">Gerencie seus prospects e oportunidades</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex rounded-lg border bg-gray-50 dark:bg-gray-800 p-1 w-full sm:w-auto">
            <Button variant={currentView === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setCurrentView("kanban")} className={`flex-1 sm:flex-none text-xs sm:text-sm ${currentView === "kanban" ? "bg-[#43B26D] hover:bg-[#37A05B] text-white" : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"}`}>
              <Kanban className="w-4 h-4 mr-1 sm:mr-2" />
              Pipeline
            </Button>
            <Button variant={currentView === "dashboard" ? "default" : "ghost"} size="sm" onClick={() => setCurrentView("dashboard")} className={`flex-1 sm:flex-none text-xs sm:text-sm ${currentView === "dashboard" ? "bg-[#43B26D] hover:bg-[#37A05B] text-white" : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"}`}>
              <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
              Dashboard
            </Button>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="bg-[#43B26D] hover:bg-[#37A05B] w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Novo Prospect
          </Button>
        </div>
      </div>

      {currentView === "dashboard" ? <div className="space-y-4 sm:space-y-6">
          <CRMDashboard />
          <CRMFollowupAlerts />
        </div> : <>
          <CRMFilters filters={filters} onFiltersChange={setFilters} />
          <div className="overflow-x-auto">
            <CRMKanbanBoard filters={filters} />
          </div>
        </>}

      <AddProspectDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>;
};