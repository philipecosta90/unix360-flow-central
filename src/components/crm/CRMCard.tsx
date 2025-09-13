
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditProspectDialog } from "./EditProspectDialog";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { CRMCardContent } from "./CRMCardContent";
import { CRMCardProps } from "@/types/crm";
import { GripVertical } from "lucide-react";

export const CRMCard = ({ prospect, isDragging = false, onProspectClick }: CRMCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    opacity: isDragging || isSortableDragging ? 0.8 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-edit-button]') || 
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    
    if (onProspectClick) {
      onProspectClick(prospect.id);
    } else {
      setShowDetailDrawer(true);
    }
  };

  const deleteProspectMutation = useMutation({
    mutationFn: async (prospectId: string) => {
      const { error } = await supabase
        .from('crm_prospects')
        .delete()
        .eq('id', prospectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-prospects'] });
      toast({
        title: "Prospect removido",
        description: "O prospect foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting prospect:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o prospect.",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditDialog(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este prospect? Esta ação não pode ser desfeita.")) {
      deleteProspectMutation.mutate(prospect.id);
    }
  };

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
          isSortableDragging ? 'shadow-lg ring-2 ring-blue-400 z-50 rotate-3' : ''
        }`}
        onClick={handleCardClick}
        {...attributes}
      >
        <div className="p-3">
          <CRMCardContent 
            prospect={prospect} 
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            dragListeners={listeners}
          />
        </div>
      </div>

      <EditProspectDialog
        prospect={prospect}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      {!onProspectClick && (
        <CRMProspectDetail
          prospectId={prospect.id}
          open={showDetailDrawer}
          onOpenChange={setShowDetailDrawer}
        />
      )}
    </>
  );
};
