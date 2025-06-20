
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
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open detail if clicking on edit button or drag handle
    if ((e.target as HTMLElement).closest('[data-edit-button]') || 
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
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
        className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative mb-3 flex-shrink-0"
        onClick={handleCardClick}
        {...attributes}
      >
        {/* Drag Handle - separate from main card content */}
        <div
          data-drag-handle
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 z-10"
          {...listeners}
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
