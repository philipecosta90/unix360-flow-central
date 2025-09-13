import { CRMProspect } from "@/types/crm";
import { getInitials, formatCurrency, isFollowupOverdue } from "@/utils/crmFormatters";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Mail, Phone, Calendar, MapPin, MessageCircle, FileText, GripVertical, MoreHorizontal } from "lucide-react";

interface CRMCardContentProps {
  prospect: CRMProspect;
  onEditClick: (e: React.MouseEvent) => void;
  onDeleteClick?: (e: React.MouseEvent) => void;
  dragListeners?: any;
}

export const CRMCardContent = ({ prospect, onEditClick, onDeleteClick, dragListeners }: CRMCardContentProps) => {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prospect.telefone) {
      // Preparado para integração futura
      console.log('WhatsApp integration:', prospect.telefone);
    }
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prospect.telefone) {
      window.open(`tel:${prospect.telefone}`, '_self');
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prospect.email) {
      window.open(`mailto:${prospect.email}`, '_self');
    }
  };

  const handleDocuments = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Preparado para funcionalidade de documentos
    console.log('Documents for:', prospect.nome);
  };

  return (
    <div className="relative">
      {/* Handle de drag */}
      <div
        className="absolute -top-1 -right-1 p-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
        {...dragListeners}
      >
        <GripVertical className="h-3 w-3 text-gray-400" />
      </div>

      {/* Conteúdo principal */}
      <div className="space-y-2">
        {/* Avatar e informações principais */}
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10 border-2 border-gray-200">
            <AvatarFallback className="text-xs font-semibold bg-gray-100 text-gray-700">
              {getInitials(prospect.nome)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {prospect.nome}
            </p>
            {prospect.empresa_cliente && (
              <p className="text-xs text-gray-600 truncate mt-0.5">
                {prospect.empresa_cliente}
              </p>
            )}
          </div>
        </div>

        {/* Linha de ações */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {/* Telefone */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCall}
              className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              title="Ligar"
            >
              <Phone className="h-4 w-4" />
            </Button>

            {/* WhatsApp */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWhatsApp}
              className="h-8 w-8 p-0 text-gray-600 hover:text-green-600 hover:bg-green-50"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>

            {/* Email */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmail}
              className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              title="Email"
            >
              <Mail className="h-4 w-4" />
            </Button>

            {/* Documentos */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDocuments}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              title="Documentos"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu de ações */}
          <div className="flex items-center space-x-1">
            <Button
              data-edit-button
              variant="ghost"
              size="sm"
              onClick={onEditClick}
              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              title="Editar"
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            {onDeleteClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteClick}
                className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
                title="Excluir"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};