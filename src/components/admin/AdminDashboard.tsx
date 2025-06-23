
import { AdminMetrics } from "./AdminMetrics";
import { CompanyList } from "./CompanyList";
import { UserInviteManager } from "./UserInviteManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, UserPlus, BarChart3 } from "lucide-react";

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600 mt-2">Gerencie usuários, empresas e configurações do sistema</p>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Usuários
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <AdminMetrics />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserInviteManager />
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <CompanyList />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações do Sistema</h3>
            <p className="text-gray-600">Em desenvolvimento...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
