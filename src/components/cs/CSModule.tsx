
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSDashboard } from "./CSDashboard";
import { CSOnboarding } from "./CSOnboarding";
import { CSInteracoes } from "./CSInteracoes";
import { CSNPS } from "./CSNPS";
import { CSClientList } from "./CSClientList";

export const CSModule = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sucesso do Cliente</h1>
        <p className="text-gray-600 mt-2">Monitore e engaje seus clientes para maximizar a satisfação</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="interacoes">Interações</TabsTrigger>
          <TabsTrigger value="nps">Satisfação</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CSDashboard />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          <CSClientList onSelectClient={setSelectedClient} />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <CSOnboarding selectedClient={selectedClient} />
        </TabsContent>

        <TabsContent value="interacoes" className="space-y-6">
          <CSInteracoes selectedClient={selectedClient} />
        </TabsContent>

        <TabsContent value="nps" className="space-y-6">
          <CSNPS selectedClient={selectedClient} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
