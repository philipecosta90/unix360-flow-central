
import { useState } from "react";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CSClientDetailProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CSClientDetail = ({ clientId, open, onOpenChange }: CSClientDetailProps) => {
  const { useCSData, useClientInteracoes, useClientOnboarding } = useCustomerSuccess();
  const { data: csData } = useCSData();
  const { data: interacoes = [] } = useClientInteracoes(clientId || "");
  const { data: onboarding = [] } = useClientOnboarding(clientId || "");

  const cliente = csData?.clientes?.find(c => c.id === clientId);
  const clienteRisco = csData?.clientesRiscoDetalhes?.find(c => c.id === clientId);

  if (!cliente) return null;

  const getClientStatus = () => {
    if (clienteRisco) {
      return { 
        label: `Em Risco (${clienteRisco.diasSemInteracao} dias sem interação)`, 
        color: "bg-red-100 text-red-600", 
        icon: AlertTriangle 
      };
    }
    
    if (cliente.status === 'ativo') {
      return { label: "Ativo", color: "bg-green-100 text-green-600", icon: CheckCircle };
    }
    
    return { label: "Onboarding", color: "bg-yellow-100 text-yellow-600", icon: Clock };
  };

  const status = getClientStatus();
  const StatusIcon = status.icon;

  const onboardingConcluido = onboarding.filter(o => o.concluido).length;
  const onboardingTotal = onboarding.length;
  const percentualOnboarding = onboardingTotal > 0 ? (onboardingConcluido / onboardingTotal) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-[#43B26D] text-white">
                {cliente.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{cliente.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cliente.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{cliente.email}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{cliente.telefone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Cliente desde: {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progresso do Onboarding */}
          {onboarding.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Progresso do Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {onboardingConcluido} de {onboardingTotal} etapas concluídas
                    </span>
                    <span className="text-sm text-gray-600">
                      {percentualOnboarding.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#43B26D] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentualOnboarding}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {onboarding.map((step) => (
                      <div key={step.id} className="flex items-center gap-2">
                        {step.concluido ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-sm ${step.concluido ? 'text-gray-900' : 'text-gray-600'}`}>
                          {step.titulo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interações Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interacoes.length > 0 ? (
                <div className="space-y-3">
                  {interacoes.slice(0, 5).map((interacao) => (
                    <div key={interacao.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{interacao.titulo}</h4>
                          <span className="text-xs text-gray-500">
                            {format(new Date(interacao.data_interacao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{interacao.tipo}</p>
                        {interacao.descricao && (
                          <p className="text-sm text-gray-700 mt-2">{interacao.descricao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma interação registrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
