
import { AdminMetrics } from "./AdminMetrics";
import { CompanyList } from "./CompanyList";
import { CreateUserForm } from "./CreateUserForm";
import { FeedbackList } from "./FeedbackList";
import { SystemHealth } from "./SystemHealth";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, UserPlus, BarChart3, MessageSquare, Activity } from "lucide-react";

export const AdminDashboard = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600 mt-2">Gerencie usuários, empresas e configurações do sistema</p>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
          <TabsTrigger value="metrics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Métricas</span>
            <span className="sm:hidden">Métr.</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresas</span>
            <span className="sm:hidden">Emp.</span>
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedbacks</span>
            <span className="sm:hidden">Feed.</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
            <span className="sm:hidden">Sist.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4 sm:space-y-6">
          <AdminMetrics />
        </TabsContent>

        <TabsContent value="users" className="space-y-4 sm:space-y-6">
          <CreateUserForm />
        </TabsContent>

        <TabsContent value="companies" className="space-y-4 sm:space-y-6">
          <CompanyList searchTerm="" selectedPlan="todos" />
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-4 sm:space-y-6">
          <FeedbackList />
        </TabsContent>

        <TabsContent value="system" className="space-y-4 sm:space-y-6">
          <SystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
};
