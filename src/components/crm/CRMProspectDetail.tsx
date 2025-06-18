
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddActivityDialog } from "./AddActivityDialog";
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  User, 
  Plus,
  MessageSquare,
  Clock
} from "lucide-react";

interface CRMProspect {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa_cliente: string;
  cargo: string;
  stage: string;
  valor_estimado: number;
  origem: string;
  tags: string[];
  responsavel_id: string;
  proximo_followup: string;
  observacoes: string;
  created_at: string;
}

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

interface CRMProspectDetailProps {
  prospectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CRMProspectDetail = ({ prospectId, open, onOpenChange }: CRMProspectDetailProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddActivity, setShowAddActivity] = useState(false);

  // Fetch prospect details
  const { data: prospect, isLoading: prospectLoading } = useQuery({
    queryKey: ['crm-prospect', prospectId],
    queryFn: async () => {
      if (!prospectId) return null;
      
      const { data, error } = await supabase
        .from('crm_prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (error) throw error;
      return data as CRMProspect;
    },
    enabled: !!prospectId && open,
  });

  // Fetch activities
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['crm-activities', prospectId],
    queryFn: async () => {
      if (!prospectId) return [];
      
      const { data, error } = await supabase
        .from('crm_atividades')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('data_atividade', { ascending: false });

      if (error) throw error;
      return data as CRMActivity[];
    },
    enabled: !!prospectId && open,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

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

  if (!prospect && !prospectLoading) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-[#43B26D] text-white">
                    {prospect ? getInitials(prospect.nome) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DrawerTitle className="text-xl">
                    {prospect?.nome || 'Carregando...'}
                  </DrawerTitle>
                  {prospect?.empresa_cliente && (
                    <p className="text-sm text-gray-600">{prospect.empresa_cliente}</p>
                  )}
                </div>
              </div>
              <DrawerClose />
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {prospectLoading ? (
              <div className="space-y-4">
                <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : prospect ? (
              <>
                {/* Prospect Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Prospect</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {prospect.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{prospect.email}</span>
                        </div>
                      )}
                      {prospect.telefone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{prospect.telefone}</span>
                        </div>
                      )}
                      {prospect.cargo && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{prospect.cargo}</span>
                        </div>
                      )}
                      {prospect.empresa_cliente && (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{prospect.empresa_cliente}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Etapa:</span>
                        <Badge variant="outline" className="ml-2">{prospect.stage}</Badge>
                      </div>
                      {prospect.valor_estimado && (
                        <div>
                          <span className="text-sm font-medium">Valor Estimado:</span>
                          <span className="ml-2 text-sm font-medium text-[#43B26D]">
                            {formatCurrency(prospect.valor_estimado)}
                          </span>
                        </div>
                      )}
                      {prospect.origem && (
                        <div>
                          <span className="text-sm font-medium">Origem:</span>
                          <span className="ml-2 text-sm">{prospect.origem}</span>
                        </div>
                      )}
                      {prospect.proximo_followup && (
                        <div>
                          <span className="text-sm font-medium">Próximo Follow-up:</span>
                          <span className="ml-2 text-sm">{formatDate(prospect.proximo_followup)}</span>
                        </div>
                      )}
                    </div>

                    {prospect.tags && prospect.tags.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prospect.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {prospect.observacoes && (
                      <div>
                        <span className="text-sm font-medium">Observações:</span>
                        <p className="text-sm text-gray-600 mt-1">{prospect.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activities Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Atividades</CardTitle>
                      <Button
                        size="sm"
                        onClick={() => setShowAddActivity(true)}
                        className="bg-[#43B26D] hover:bg-[#37A05B]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Atividade
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : activities.length > 0 ? (
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
                                  <span className="text-xs text-gray-500">
                                    {formatDateTime(activity.data_atividade)}
                                  </span>
                                </div>
                                {activity.descricao && (
                                  <p className="text-sm text-gray-600 mt-1">{activity.descricao}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma atividade registrada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>

      <AddActivityDialog
        prospectId={prospectId}
        open={showAddActivity}
        onOpenChange={setShowAddActivity}
      />
    </>
  );
};
