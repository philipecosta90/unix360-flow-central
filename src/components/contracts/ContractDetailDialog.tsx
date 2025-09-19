
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ContractDocumentsList } from "./ContractDocumentsList";

interface Contract {
  id: string;
  titulo: string;
  cliente_nome?: string;
  valor?: number;
  data_inicio: string;
  data_fim?: string;
  status: 'ativo' | 'inativo' | 'pendente' | 'cancelado';
  tipo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface ContractDetailDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContractDetailDialog = ({ contract, open, onOpenChange }: ContractDetailDialogProps) => {
  if (!contract) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-100 text-green-800";
      case "pendente": return "bg-yellow-100 text-yellow-800";
      case "cancelado": return "bg-red-100 text-red-800";
      case "inativo": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo": return "Ativo";
      case "pendente": return "Pendente";
      case "cancelado": return "Cancelado";
      case "inativo": return "Inativo";
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#43B26D] text-white text-lg">
                {contract.cliente_nome ? contract.cliente_nome.split(' ').map(n => n[0]).join('') : 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{contract.titulo}</h3>
              <p className="text-gray-600">{contract.cliente_nome || 'Cliente não informado'}</p>
              <div className="flex items-center gap-2 mt-2">
                {contract.tipo && <Badge variant="outline">{contract.tipo}</Badge>}
                <Badge className={getStatusColor(contract.status)}>
                  {getStatusLabel(contract.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informações Gerais</h4>
              <div className="space-y-2 text-sm">
                {contract.valor && (
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="ml-2 font-medium text-[#43B26D]">
                      R$ {contract.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {contract.tipo && (
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2">{contract.tipo}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">{getStatusLabel(contract.status)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Datas Importantes</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Início:</span>
                  <span className="ml-2">
                    {new Date(contract.data_inicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {contract.data_fim && (
                  <div>
                    <span className="text-gray-600">Fim:</span>
                    <span className="ml-2">
                      {new Date(contract.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Criado em:</span>
                  <span className="ml-2">
                    {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Description */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                {contract.observacoes || `Contrato ${contract.titulo} para ${contract.cliente_nome || 'cliente'}${contract.valor ? ` com valor de R$ ${contract.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}.`}
              </p>
            </div>
          </div>

          <Separator />

          {/* Contract Documents */}
          <ContractDocumentsList contractId={contract.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
