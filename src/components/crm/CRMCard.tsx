
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { EditProspectDialog } from "./EditProspectDialog";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { CRMCardContent } from "./CRMCardContent";
import { CRMCardProps } from "@/types/crm";
import { GripVertical } from "lucide-react";

export const CRMCard = ({ prospect, isDragging = false, onProspectClick }: CRMCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  
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

  console.log(`🎯 DnD Card "${prospect.nome}" - isDragging:`, isSortableDragging, 'sortable ID:', prospect.id);

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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditDialog(true);
  };

  return (
    <>
      <Card 
        ref={setNodeRef}
        style={style}
        className={`bg-white shadow-sm hover:shadow-md transition-shadow relative mb-3 cursor-grab active:cursor-grabbing ${
          isSortableDragging ? 'shadow-lg ring-2 ring-blue-400 z-50' : ''
        }`}
        onClick={handleCardClick}
        {...attributes}
        {...listeners}
      >
        <div
          data-drag-handle
          className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 z-10 pointer-events-none"
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>

        <CardContent className="p-4 pr-8">
          <CRMCardContent 
            prospect={prospect} 
            onEditClick={handleEditClick}
          />
        </CardContent>
      </Card>

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
