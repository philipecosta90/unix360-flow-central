import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckinTemplates } from "./CheckinTemplates";
import { CheckinAgendamentos } from "./CheckinAgendamentos";
import { CheckinRelatorio } from "./CheckinRelatorio";

export const CheckinModule = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Check-ins Inteligentes</h2>
        <p className="text-muted-foreground mt-1">
          Acompanhe a evolução dos seus pacientes com questionários automatizados
        </p>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <CheckinTemplates />
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-4 mt-4">
          <CheckinAgendamentos />
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-4 mt-4">
          <CheckinRelatorio />
        </TabsContent>
      </Tabs>
    </div>
  );
};
