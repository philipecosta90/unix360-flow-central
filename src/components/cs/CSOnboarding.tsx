import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useCustomerSuccess } from "@/hooks/useCustomerSuccess";
import { 
  Search, 
  CheckCircle, 
  Clock, 
  User,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  ClipboardList,
  Dumbbell,
  PartyPopper
} from "lucide-react";
import { toast } from "sonner";

interface CSOnboardingProps {
  selectedClient?: string | null;
}

// Ícones para cada etapa de onboarding
const getStepIcon = (titulo: string, concluido: boolean) => {
  const iconClass = concluido ? "text-green-600" : "text-muted-foreground";
  
  if (titulo.toLowerCase().includes("boas-vindas")) {
    return <PartyPopper className={`h-4 w-4 ${iconClass}`} />;
  }
  if (titulo.toLowerCase().includes("anamnese enviada")) {
    return <Send className={`h-4 w-4 ${iconClass}`} />;
  }
  if (titulo.toLowerCase().includes("anamnese preenchida")) {
    return <FileText className={`h-4 w-4 ${iconClass}`} />;
  }
  if (titulo.toLowerCase().includes("planejamento")) {
    return <ClipboardList className={`h-4 w-4 ${iconClass}`} />;
  }
  if (titulo.toLowerCase().includes("protocolo")) {
    return <Dumbbell className={`h-4 w-4 ${iconClass}`} />;
  }
  
  return concluido 
    ? <CheckCircle className={`h-4 w-4 ${iconClass}`} />
    : <Clock className={`h-4 w-4 ${iconClass}`} />;
};

export const CSOnboarding = ({ selectedClient }: CSOnboardingProps) => {
  const { useClientesEmOnboarding, updateOnboardingStep } = useCustomerSuccess();
  const { data: clientesOnboarding, isLoading } = useClientesEmOnboarding();

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  // Filtrar clientes com base na busca
  const filteredClientes = useMemo(() => {
    if (!clientesOnboarding) return [];
    
    if (!searchTerm.trim()) return clientesOnboarding;
    
    const termLower = searchTerm.toLowerCase();
    return clientesOnboarding.filter(item => 
      item.cliente.nome.toLowerCase().includes(termLower) ||
      item.cliente.email?.toLowerCase().includes(termLower)
    );
  }, [clientesOnboarding, searchTerm]);

  const toggleExpanded = (clienteId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clienteId)) {
        newSet.delete(clienteId);
      } else {
        newSet.add(clienteId);
      }
      return newSet;
    });
  };

  const handleToggleStep = async (stepId: string, concluido: boolean) => {
    try {
      await updateOnboardingStep.mutateAsync({
        id: stepId,
        concluido,
        data_conclusao: concluido ? new Date().toISOString() : null
      });
      
      toast.success(concluido ? "Etapa concluída!" : "Etapa marcada como pendente");
    } catch (error) {
      toast.error("Erro ao atualizar etapa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Onboarding de Clientes</h2>
          <p className="text-muted-foreground mt-1">
            Acompanhe o progresso de cada cliente no processo de onboarding
          </p>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes em onboarding */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Carregando clientes...</p>
          </CardContent>
        </Card>
      ) : filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Nenhum cliente encontrado com esse termo" 
                : "Nenhum cliente em processo de onboarding"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando você cadastrar novos clientes, eles aparecerão aqui automaticamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClientes.map((item) => {
            const { cliente, etapas } = item;
            const etapasConcluidas = etapas.filter(e => e.concluido).length;
            const totalEtapas = etapas.length;
            const progresso = totalEtapas > 0 ? (etapasConcluidas / totalEtapas) * 100 : 0;
            const isExpanded = expandedClients.has(cliente.id);
            
            // Encontrar próxima etapa pendente
            const proximaEtapa = etapas.find(e => !e.concluido);
            
            return (
              <Card key={cliente.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                        {cliente.email && (
                          <p className="text-sm text-muted-foreground">{cliente.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={progresso === 100 ? "default" : "secondary"}
                        className={progresso === 100 ? "bg-green-100 text-green-800" : ""}
                      >
                        {etapasConcluidas}/{totalEtapas} etapas
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(cliente.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{Math.round(progresso)}%</span>
                    </div>
                    <Progress value={progresso} className="h-2" />
                  </div>
                  
                  {/* Próxima etapa (quando não expandido) */}
                  {!isExpanded && proximaEtapa && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">
                          Próxima: <strong>{proximaEtapa.titulo}</strong>
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStep(proximaEtapa.id, true)}
                        disabled={updateOnboardingStep.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como concluída
                      </Button>
                    </div>
                  )}
                </CardHeader>
                
                {/* Lista de etapas expandida */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 border-t pt-4">
                      {etapas.map((step) => (
                        <div
                          key={step.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            step.concluido 
                              ? 'bg-green-50 border border-green-100' 
                              : 'bg-muted/30 border border-transparent hover:border-muted'
                          }`}
                        >
                          <Checkbox
                            checked={step.concluido}
                            onCheckedChange={(checked) => handleToggleStep(step.id, !!checked)}
                            disabled={updateOnboardingStep.isPending}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getStepIcon(step.titulo, step.concluido)}
                              <h4 className={`font-medium ${
                                step.concluido ? 'text-green-800' : 'text-foreground'
                              }`}>
                                {step.titulo}
                              </h4>
                            </div>
                            
                            {step.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {step.descricao}
                              </p>
                            )}
                            
                            {step.data_conclusao && (
                              <p className="text-xs text-green-600 mt-1">
                                Concluído em {new Date(step.data_conclusao).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          
                          <Badge variant="outline" className="flex-shrink-0">
                            {step.ordem}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
