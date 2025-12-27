import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { CheckinTemplates } from "./CheckinTemplates";
import { CheckinAgendamentos } from "./CheckinAgendamentos";
import { CheckinRelatorio } from "./CheckinRelatorio";
import { CheckinEnviarDialog } from "./CheckinEnviarDialog";

export const CheckinModule = () => {
  const [showEnviarDialog, setShowEnviarDialog] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Check-ins Inteligentes</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe a evolução dos seus pacientes com questionários automatizados
          </p>
        </div>
        <Button
          onClick={() => setShowEnviarDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Enviar via WhatsApp
        </Button>
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

      <CheckinEnviarDialog
        open={showEnviarDialog}
        onOpenChange={setShowEnviarDialog}
      />
    </div>
  );
};
