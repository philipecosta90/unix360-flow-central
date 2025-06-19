
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ClientsModule } from "@/components/clients/ClientsModule";
import { CRMKanban } from "@/components/crm/CRMKanban";
import { FinancialModule } from "@/components/financial/FinancialModule";
import { TasksModule } from "@/components/tasks/TasksModule";
import { ContractsModule } from "@/components/contracts/ContractsModule";

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [currentModule, setCurrentModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderCurrentModule = () => {
    switch (currentModule) {
      case "dashboard":
        return <DashboardOverview />;
      case "clients":
        return <ClientsModule />;
      case "crm":
        return <CRMKanban />;
      case "financial":
        return <FinancialModule />;
      case "tasks":
        return <TasksModule />;
      case "contracts":
        return <ContractsModule />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user} 
          onLogout={onLogout || (() => {})}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {renderCurrentModule()}
        </main>
      </div>
    </div>
  );
};
