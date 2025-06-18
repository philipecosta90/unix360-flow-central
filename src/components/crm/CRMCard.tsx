
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Phone, Mail, Calendar } from "lucide-react";
import { useState } from "react";
import { EditProspectDialog } from "./EditProspectDialog";

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

interface CRMCardProps {
  prospect: CRMProspect;
  isDragging?: boolean;
}

export const CRMCard = ({ prospect, isDragging = false }: CRMCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: prospect.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isFollowupOverdue = () => {
    if (!prospect.proximo_followup) return false;
    const today = new Date();
    const followupDate = new Date(prospect.proximo_followup);
    return followupDate < today;
  };

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      >
        <CardContent className="p-4">
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
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowEditDialog(true);
              }}
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
                isFollowupOverdue() ? 'text-red-600' : 'text-gray-600'
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
        </CardContent>
      </Card>

      <EditProspectDialog
        prospect={prospect}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
};
