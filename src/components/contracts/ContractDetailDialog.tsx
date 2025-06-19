
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Contract {
  id: number;
  clientName: string;
  title: string;
  value: number;
  status: string;
  sentDate: string | null;
  signedDate: string | null;
  validUntil: string | null;
  type: string;
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
      case "Assinado": return "bg-green-100 text-green-800";
      case "Enviado": return "bg-blue-100 text-blue-800";
      case "Pendente": return "bg-yellow-100 text-yellow-800";
      case "Expirado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Contrato</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#43B26D] text-white text-lg">
                {contract.clientName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{contract.title}</h3>
              <p className="text-gray-600">{contract.clientName}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{contract.type}</Badge>
                <Badge className={getStatusColor(contract.status)}>
                  {contract.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informações Gerais</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <span className="ml-2 font-medium text-[#43B26D]">
                    R$ {contract.value.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2">{contract.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2">{contract.status}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Datas Importantes</h4>
              <div className="space-y-2 text-sm">
                {contract.sentDate && (
                  <div>
                    <span className="text-gray-600">Enviado em:</span>
                    <span className="ml-2">
                      {new Date(contract.sentDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {contract.signedDate && (
                  <div>
                    <span className="text-gray-600">Assinado em:</span>
                    <span className="ml-2">
                      {new Date(contract.signedDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {contract.validUntil && (
                  <div>
                    <span className="text-gray-600">Válido até:</span>
                    <span className="ml-2">
                      {new Date(contract.validUntil).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Description */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                Contrato de {contract.type.toLowerCase()} para {contract.clientName}, 
                com valor total de R$ {contract.value.toLocaleString('pt-BR')}.
                {contract.status === "Assinado" && " Contrato já assinado e em vigor."}
                {contract.status === "Enviado" && " Aguardando assinatura do cliente."}
                {contract.status === "Pendente" && " Contrato ainda em preparação."}
                {contract.status === "Expirado" && " Contrato expirou e precisa ser renovado."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
