
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { EditProspectDialog } from "./EditProspectDialog";
import { CRMProspectDetail } from "./CRMProspectDetail";
import { CRMCardContent } from "./CRMCardContent";
import { CRMCardProps } from "@/types/crm";

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
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open detail if clicking on edit button
    if ((e.target as HTMLElement).closest('[data-edit-button]')) {
      return;
    }
    
    // Use onProspectClick if provided, otherwise use local state
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
        {...attributes}
        {...listeners}
        className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
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

      {/* Only show local detail drawer if onProspectClick is not provided */}
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
