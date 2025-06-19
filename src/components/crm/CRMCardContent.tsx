
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, Calendar } from "lucide-react";
import { CRMProspect } from "@/types/crm";
import { getInitials, formatCurrency, isFollowupOverdue } from "@/utils/crmFormatters";

interface CRMCardContentProps {
  prospect: CRMProspect;
  onEditClick: (e: React.MouseEvent) => void;
}

export const CRMCardContent = ({ prospect, onEditClick }: CRMCardContentProps) => {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-[#43B26D] text-white text-xs">
              {getInitials(prospect.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">{prospect.nome}</h4>
            {prospect.empresa_cliente && (
              <p className="text-xs text-gray-600 truncate">{prospect.empresa_cliente}</p>
            )}
          </div>
        </div>
        <Button
          data-edit-button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onEditClick}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {prospect.valor_estimado && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#43B26D]">
              {formatCurrency(prospect.valor_estimado)}
            </span>
            {prospect.origem && (
              <Badge variant="outline" className="text-xs">
                {prospect.origem}
              </Badge>
            )}
          </div>
        )}

        {/* Contact info */}
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          {prospect.email && (
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{prospect.email}</span>
            </div>
          )}
          {prospect.telefone && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>{prospect.telefone}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {prospect.tags && prospect.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prospect.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {prospect.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{prospect.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Follow-up date */}
        {prospect.proximo_followup && (
          <div className={`flex items-center space-x-1 text-xs ${
            isFollowupOverdue(prospect.proximo_followup) ? 'text-red-600' : 'text-gray-600'
          }`}>
            <Calendar className="h-3 w-3" />
            <span>
              Follow-up: {new Date(prospect.proximo_followup).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        {/* Responsible - for now just show the ID since we removed the join */}
        {prospect.responsavel_id && (
          <div className="text-xs text-gray-600">
            Responsável: {prospect.responsavel_id}
          </div>
        )}
      </div>
    </>
  );
};
