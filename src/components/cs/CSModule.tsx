
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Heart, Target } from "lucide-react";
import { useNicheSettings } from "@/hooks/useNicheSettings";
import { CSDashboard } from "./CSDashboard";
import { CSOnboarding } from "./CSOnboarding";
import { CSInteracoes } from "./CSInteracoes";
import { CSNPS } from "./CSNPS";
import { CSClientList } from "./CSClientList";

export const CSModule = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const { settings: nicheSettings, isLoading: nicheLoading } = useNicheSettings();

  const nicheConfig = nicheSettings?.config;
  const nicheType = nicheSettings?.niche_type || 'fitness';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sucesso do Cliente</h1>
        <p className="text-gray-600 mt-2">
          Monitore e engaje seus clientes para maximizar a satisfação
          {nicheConfig?.name && ` - ${nicheConfig.name}`}
        </p>
      </div>

      {/* Card de Configurações do Nicho */}
      {nicheConfig && !nicheLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações do Nicho - {nicheConfig.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Etapas do Funil */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Etapas do Funil de Vendas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {nicheConfig.leadStages?.map((stage, index) => (
                  <Badge key={index} variant="outline">
                    {stage}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Campos Personalizados para Interações */}
            {nicheConfig.customFields && nicheConfig.customFields.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Campos Personalizados para Cliente:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {nicheConfig.customFields.map((field) => (
                    <Badge key={field.id} variant="secondary">
                      {field.name}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Métricas de Sucesso */}
            {nicheConfig.metrics && nicheConfig.metrics.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Métricas de Sucesso:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {nicheConfig.metrics.map((metric, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Orientações específicas do nicho */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
              <h4 className="font-medium mb-2">💡 Orientações para {nicheConfig.name}:</h4>
              <p className="text-sm text-gray-700">
                {nicheType === 'fitness' && "Focus no engajamento: monitore frequência, evolução física e satisfação dos alunos. Acompanhe cancelamentos e implemente programas de retenção."}
                {nicheType === 'consultoria' && "Foque nos resultados: acompanhe o progresso das sessões, alcance de objetivos e satisfação com os resultados. Monitore renovações de contratos."}
                {nicheType === 'medical' && "Cuidado contínuo: monitore adesão aos tratamentos, satisfação com atendimento e eficácia dos procedimentos. Acompanhe retornos e consultas preventivas."}
                {nicheType === 'dental' && "Saúde bucal contínua: acompanhe satisfação com tratamentos, dor pós-procedimento e adesão aos cuidados preventivos. Monitore retornos regulares."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
