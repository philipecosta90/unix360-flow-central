import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Phone, Mail, Calendar, MessageSquare, Clock } from "lucide-react";

interface CRMActivity {
  id: string;
  prospect_id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  data_atividade: string;
  created_by: string;
  created_at: string;
}

interface ActivityListProps {
  activities: CRMActivity[];
  prospectId: string;
}

export const ActivityList = ({ activities, prospectId }: ActivityListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('crm_atividades')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities', prospectId] });
      toast({
        title: "Atividade removida",
        description: "A atividade foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting activity:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a atividade.",
        variant: "destructive",
      });
    },
  });

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      case 'stage_change':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (tipo: string) => {
    const labels = {
      call: 'Ligação',
      email: 'E-mail',
      meeting: 'Reunião',
      note: 'Nota',
      stage_change: 'Mudança de Etapa',
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="border rounded-lg p-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.tipo)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{activity.titulo}</span>
                  <Badge variant="outline" className="text-xs">
                    {getActivityTypeLabel(activity.tipo)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {formatDateTime(activity.data_atividade)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir esta atividade?")) {
                        deleteActivityMutation.mutate(activity.id);
                      }
                    }}
                    disabled={deleteActivityMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {activity.descricao && (
                <p className="text-sm text-gray-600 mt-1">{activity.descricao}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};