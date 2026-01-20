import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNicheSettings } from "@/hooks/useNicheSettings";
import { CSDashboard } from "./CSDashboard";
import { CSOnboarding } from "./CSOnboarding";
import { CSKanbanBoard } from "./CSKanbanBoard";
import { CSPlanner } from "./CSPlanner";
import { CheckinModule } from "@/components/checkins/CheckinModule";

export const CSModule = () => {
  const { settings: nicheSettings, isLoading: nicheLoading } = useNicheSettings();

  const nicheConfig = nicheSettings?.config;
  const nicheType = nicheSettings?.niche_type || 'fitness';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sucesso do Cliente</h1>
        <p className="text-muted-foreground mt-2">
          Monitore e engaje seus clientes para maximizar a satisfação
          {nicheConfig?.name && ` - ${nicheConfig.name}`}
        </p>
      </div>

      {/* Orientações específicas do nicho */}
      {nicheConfig && !nicheLoading && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-lg border">
          <h4 className="font-medium mb-2">💡 Orientações para {nicheConfig.name}:</h4>
          <p className="text-sm text-muted-foreground">
            {nicheType === 'fitness' && "Focus no engajamento: monitore frequência, evolução física e satisfação dos alunos. Acompanhe cancelamentos e implemente programas de retenção."}
            {nicheType === 'consultoria' && "Foque nos resultados: acompanhe o progresso das sessões, alcance de objetivos e satisfação com os resultados. Monitore renovações de contratos."}
            {nicheType === 'medical' && "Cuidado contínuo: monitore adesão aos tratamentos, satisfação com atendimento e eficácia dos procedimentos. Acompanhe retornos e consultas preventivas."}
            {nicheType === 'dental' && "Saúde bucal contínua: acompanhe satisfação com tratamentos, dor pós-procedimento e adesão aos cuidados preventivos. Monitore retornos regulares."}
          </p>
        </div>
      )}

      <Tabs defaultValue="clientes" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 sm:grid sm:grid-cols-5 w-full">
          <TabsTrigger value="clientes" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">Jornada</TabsTrigger>
          <TabsTrigger value="planner" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">Planner</TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">Dashboard</TabsTrigger>
          <TabsTrigger value="checkins" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">Check-ins</TabsTrigger>
          <TabsTrigger value="onboarding" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">Onboarding</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-6">
          <CSKanbanBoard />
        </TabsContent>

        <TabsContent value="planner" className="space-y-6">
          <CSPlanner />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <CSDashboard />
        </TabsContent>

        <TabsContent value="checkins" className="space-y-6">
          <CheckinModule />
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <CSOnboarding />
        </TabsContent>
      </Tabs>
    </div>
  );
};
