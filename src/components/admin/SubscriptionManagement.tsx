import { useState } from "react";
import { SubscriptionList } from "./SubscriptionList";
import { SubscriptionFilters } from "./SubscriptionFilters";
import { SubscriptionMetrics } from "./SubscriptionMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, List } from "lucide-react";

export const SubscriptionManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [planFilter, setPlanFilter] = useState("todos");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Gestão de Assinaturas</h2>
        <p className="text-muted-foreground">Gerencie todas as assinaturas do sistema</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista de Assinaturas
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <SubscriptionFilters 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            planFilter={planFilter}
            onPlanChange={setPlanFilter}
          />
          
          <SubscriptionList 
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            planFilter={planFilter}
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <SubscriptionMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};