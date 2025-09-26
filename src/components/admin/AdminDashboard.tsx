
import { AdminMetrics } from "./AdminMetrics";
import { CompanyList } from "./CompanyList";
import { CreateUserForm } from "./CreateUserForm";
import { FeedbackList } from "./FeedbackList";
import { SystemHealth } from "./SystemHealth";
import { AddCompanyDialog } from "./AddCompanyDialog";
import { CompanyFilters } from "./CompanyFilters";
import { SubscriptionManagement } from "./SubscriptionManagement";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, UserPlus, BarChart3, MessageSquare, Activity, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("todos");
  const [showAddCompany, setShowAddCompany] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2">Gerencie usuários, empresas e configurações do sistema</p>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
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
          <TabsTrigger value="subscriptions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Assinaturas</span>
            <span className="sm:hidden">Assin.</span>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Gerenciar Empresas</h2>
              <p className="text-muted-foreground">Visualize e gerencie todas as empresas do sistema</p>
            </div>
            <Button onClick={() => setShowAddCompany(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </div>
          
          <CompanyFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedPlan={selectedPlan}
            onPlanChange={setSelectedPlan}
          />
          
          <CompanyList 
            searchTerm={searchTerm} 
            selectedPlan={selectedPlan} 
          />
          
          <AddCompanyDialog 
            open={showAddCompany} 
            onClose={() => setShowAddCompany(false)} 
          />
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-4 sm:space-y-6">
          <FeedbackList />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4 sm:space-y-6">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-4 sm:space-y-6">
          <SystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  );
};
