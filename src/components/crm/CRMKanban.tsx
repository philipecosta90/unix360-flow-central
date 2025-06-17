
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const CRMKanban = () => {
  const [stages] = useState([
    { id: "lead", title: "Leads", color: "bg-blue-100" },
    { id: "contacted", title: "Contatados", color: "bg-yellow-100" },
    { id: "proposal", title: "Proposta Enviada", color: "bg-orange-100" },
    { id: "negotiation", title: "Negociação", color: "bg-purple-100" },
    { id: "active", title: "Clientes Ativos", color: "bg-green-100" }
  ]);

  const [prospects] = useState([
    {
      id: 1,
      name: "Ana Costa",
      email: "ana@email.com",
      stage: "lead",
      value: 2500,
      source: "Site",
      lastActivity: "2024-01-15",
      notes: "Interessada em coaching executivo"
    },
    {
      id: 2,
      name: "Carlos Silva",
      email: "carlos@email.com",
      stage: "contacted",
      value: 1500,
      source: "Indicação",
      lastActivity: "2024-01-14",
      notes: "Primeiro contato realizado"
    },
    {
      id: 3,
      name: "Beatriz Santos",
      email: "beatriz@email.com",
      stage: "proposal",
      value: 3000,
      source: "LinkedIn",
      lastActivity: "2024-01-13",
      notes: "Proposta enviada ontem"
    },
    {
      id: 4,
      name: "Roberto Lima",
      email: "roberto@email.com",
      stage: "negotiation",
      value: 4000,
      source: "Evento",
      lastActivity: "2024-01-12",
      notes: "Negociando valores e condições"
    },
    {
      id: 5,
      name: "Fernanda Rocha",
      email: "fernanda@email.com",
      stage: "active",
      value: 2800,
      source: "Site",
      lastActivity: "2024-01-10",
      notes: "Cliente ativo - plano premium"
    }
  ]);

  const getProspectsByStage = (stageId: string) => {
    return prospects.filter(prospect => prospect.stage === stageId);
  };

  const getTotalValueByStage = (stageId: string) => {
    return getProspectsByStage(stageId).reduce((total, prospect) => total + prospect.value, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Pipeline</h1>
          <p className="text-gray-600 mt-2">Gerencie seus prospects e oportunidades</p>
        </div>
        <Button className="bg-[#43B26D] hover:bg-[#37A05B]">
          + Novo Prospect
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageProspects = getProspectsByStage(stage.id);
          const stageValue = getTotalValueByStage(stage.id);
          
          return (
            <Card key={stage.id}>
              <CardContent className="p-4 text-center">
                <h3 className="font-medium text-gray-900">{stage.title}</h3>
                <p className="text-2xl font-bold text-[#43B26D] mt-1">
                  {stageProspects.length}
                </p>
                <p className="text-sm text-gray-600">
                  R$ {stageValue.toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto">
        {stages.map((stage) => {
          const stageProspects = getProspectsByStage(stage.id);
          
          return (
            <div key={stage.id} className="min-w-[280px]">
              <Card className={`${stage.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {stage.title}
                    <Badge variant="secondary">{stageProspects.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stageProspects.map((prospect) => (
                    <Card key={prospect.id} className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#43B26D] text-white text-xs">
                              {prospect.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{prospect.name}</h4>
                            <p className="text-xs text-gray-600">{prospect.email}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-[#43B26D]">
                              R$ {prospect.value.toLocaleString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {prospect.source}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {prospect.notes}
                          </p>
                          
                          <p className="text-xs text-gray-500">
                            Última atividade: {new Date(prospect.lastActivity).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {stageProspects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Nenhum prospect nesta etapa</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};
