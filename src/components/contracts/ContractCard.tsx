
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { Contract } from "@/hooks/useContracts";

interface ContractCardProps {
  contract: Contract;
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
}

export const ContractCard = ({ contract, onView, onEdit, onDelete }: ContractCardProps) => {
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contract.titulo}</CardTitle>
            {contract.cliente_nome && (
              <p className="text-sm text-gray-600 mt-1">{contract.cliente_nome}</p>
            )}
          </div>
          <Badge className={getStatusColor(contract.status)}>
            {getStatusLabel(contract.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Início:</span>
            <span>{new Date(contract.data_inicio).toLocaleDateString('pt-BR')}</span>
          </div>
          
          {contract.data_fim && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fim:</span>
              <span>{new Date(contract.data_fim).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          
          {contract.valor && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Valor:</span>
              <span className="font-medium">
                R$ {contract.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t">
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onView(contract)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit(contract)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(contract.id)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(contract.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
