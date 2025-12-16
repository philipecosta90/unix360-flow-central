import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnamneseTemplates } from "./AnamneseTemplates";
import { AnamneseEnvios } from "./AnamneseEnvios";
import { useAnamnese } from "@/hooks/useAnamnese";
import { FileText, Send, ClipboardList } from "lucide-react";

export const AnamneseModule = () => {
  const [currentTab, setCurrentTab] = useState("templates");
  const { fetchTemplates, fetchEnvios, templates, loading } = useAnamnese();

  useEffect(() => {
    fetchTemplates();
    fetchEnvios();
  }, [fetchTemplates, fetchEnvios]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-lime-500">Anamnese</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie questionários de anamnese e envie para seus clientes
          </p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="envios" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Envios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <AnamneseTemplates />
        </TabsContent>

        <TabsContent value="envios">
          <AnamneseEnvios />
        </TabsContent>
      </Tabs>
    </div>
  );
};
