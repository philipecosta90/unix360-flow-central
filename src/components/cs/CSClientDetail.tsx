
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
              <AvatarFallback className="bg-[#43B26D] text-white text-lg sm:text-xl">
                {cliente.nome.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold leading-tight">{cliente.nome}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${status.color} text-xs sm:text-sm px-2 py-1`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  <span className="hidden xs:inline">{status.label}</span>
                  <span className="xs:hidden">
                    {status.label.includes('Risco') ? 'Risco' : status.label.split(' ')[0]}
                  </span>
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {cliente.email && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm break-all">{cliente.email}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm">{cliente.telefone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Progresso do Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {onboardingConcluido} de {onboardingTotal} etapas concluídas
                    </span>
                    <span className="text-sm text-gray-600 font-semibold">
                      {percentualOnboarding.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-[#43B26D] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${percentualOnboarding}%` }}
                    />
                  </div>
                  <div className="space-y-3">
                    {onboarding.map((step) => (
                      <div key={step.id} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                        {step.concluido ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-1" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                        )}
                        <span className={`text-sm leading-relaxed ${step.concluido ? 'text-gray-900' : 'text-gray-600'}`}>
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                Interações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interacoes.length > 0 ? (
                <div className="space-y-3">
                  {interacoes.slice(0, 5).map((interacao) => (
                    <div key={interacao.id} className="flex items-start gap-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-2">
                          <h4 className="font-medium text-sm leading-tight truncate">{interacao.titulo}</h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {format(new Date(interacao.data_interacao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{interacao.tipo}</p>
                        {interacao.descricao && (
                          <p className="text-sm text-gray-700 mt-2 leading-relaxed break-words">{interacao.descricao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
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
