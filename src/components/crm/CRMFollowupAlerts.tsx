
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCRMFollowupAlerts } from "@/hooks/useCRMFollowupAlerts";
import { AlertTriangle, Phone, Mail, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { EditProspectDialog } from "./EditProspectDialog";
import { AddActivityDialog } from "./AddActivityDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const CRMFollowupAlerts = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: alerts = [], isLoading, error } = useCRMFollowupAlerts();
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [showProspectDetail, setShowProspectDetail] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  // Fetch the selected prospect data for the EditProspectDialog
  const { data: selectedProspect } = useQuery({
    queryKey: ['crm-prospect', selectedProspectId],
    queryFn: async () => {
      if (!selectedProspectId) return null;
      
      const { data, error } = await supabase
        .from('crm_prospects')
        .select(`
          *,
          perfis:responsavel_id(nome, sobrenome)
        `)
        .eq('id', selectedProspectId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        perfis: data.perfis && !('error' in data.perfis) ? data.perfis : null
      };
    },
    enabled: !!selectedProspectId && showEditDialog,
  });

  // Delete prospect mutation
  const deleteProspectMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      const { error } = await supabase
        .from('crm_prospects')
        .delete()
        .eq('id', prospectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-followup-alerts'] });
      toast({
        title: "Prospect excluído",
        description: "O prospect foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting prospect:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o prospect.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Alertas de Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar alertas de follow-up. Tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'lead': 'bg-blue-100 text-blue-800',
      'contatado': 'bg-yellow-100 text-yellow-800',
      'proposta enviada': 'bg-orange-100 text-orange-800',
      'negociação': 'bg-purple-100 text-purple-800',
      'fechado': 'bg-green-100 text-green-800',
    };
    return stageColors[stage.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const handleViewProspect = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setShowProspectDetail(true);
  };

  const handleEditProspect = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setShowEditDialog(true);
  };

  const handleScheduleFollowUp = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setShowActivityDialog(true);
  };

  const handleDeleteProspect = (prospectId: string) => {
    if (confirm('Tem certeza que deseja excluir este prospect?')) {
      deleteProspectMutation.mutate(prospectId);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Alertas de Follow-up
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum prospect precisa de follow-up no momento.</p>
              <p className="text-sm mt-1">Todos os prospects estão em dia!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.is_critical 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        {alert.is_critical && (
                          <span className="text-red-500 text-lg" title="Alerta crítico">
                            ⚠️
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900 truncate">
                          {alert.nome}
                        </h3>
                        <Badge className={getStageColor(alert.stage)}>
                          {alert.stage.charAt(0).toUpperCase() + alert.stage.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                        {alert.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{alert.email}</span>
                          </div>
                        )}
                        {alert.telefone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{alert.telefone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Última atividade: {formatDate(alert.last_activity_date)}</span>
                        </div>
                        {alert.proximo_followup && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">Follow-up: {formatDate(alert.proximo_followup)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {alert.is_overdue_followup && (
                          <Badge variant="destructive" className="text-xs">
                            Follow-up em atraso
                          </Badge>
                        )}
                        {alert.is_inactive && (
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                            Sem atividade há 14+ dias
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewProspect(alert.id)}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Ver
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[#43B26D] hover:bg-[#37A05B] text-xs px-2 py-1 h-7"
                          onClick={() => handleScheduleFollowUp(alert.id)}
                        >
                          Follow-up
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditProspect(alert.id)}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteProspect(alert.id)}
                          disabled={deleteProspectMutation.isPending}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais e Dialogs */}
      {selectedProspectId && (
        <>
          <CRMProspectDetail
            prospectId={selectedProspectId}
            open={showProspectDetail}
            onOpenChange={setShowProspectDetail}
          />
          
          {selectedProspect && (
            <EditProspectDialog
              prospect={selectedProspect}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}
          
          <AddActivityDialog
            prospectId={selectedProspectId}
            open={showActivityDialog}
            onOpenChange={setShowActivityDialog}
          />
        </>
      )}
    </>
  );
};
