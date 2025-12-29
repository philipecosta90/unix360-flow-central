import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit, Trash2 } from "lucide-react";
import { CheckinPergunta } from "@/hooks/useCheckins";

interface SortableCheckinPerguntaProps {
  pergunta: CheckinPergunta;
  onEdit: (pergunta: CheckinPergunta) => void;
  onDelete: (id: string) => void;
  getTipoLabel: (tipo: string) => string;
}

export const SortableCheckinPergunta = ({
  pergunta,
  onEdit,
  onDelete,
  getTipoLabel,
}: SortableCheckinPerguntaProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pergunta.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{pergunta.pergunta}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {getTipoLabel(pergunta.tipo)}
            </Badge>
            {pergunta.pontos_maximo > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pergunta.pontos_maximo} pts
              </Badge>
            )}
            {pergunta.obrigatoria && (
              <Badge className="text-xs bg-primary/10 text-primary">
                Obrigatória
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(pergunta)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(pergunta.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
