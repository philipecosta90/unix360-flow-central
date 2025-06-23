
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CRMCard } from "./CRMCard";
import { CRMProspect } from "@/types/crm";

interface CRMStage {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}

interface CRMColumnProps {
  stage: CRMStage;
  prospects: CRMProspect[];
  totalValue: number;
  onProspectClick?: (prospectId: string) => void;
}

export const CRMColumn = ({ stage, prospects, totalValue, onProspectClick }: CRMColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const getBackgroundColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'bg-blue-50 border-blue-200',
      '#F59E0B': 'bg-amber-50 border-amber-200',
      '#F97316': 'bg-orange-50 border-orange-200',
      '#8B5CF6': 'bg-purple-50 border-purple-200',
      '#10B981': 'bg-emerald-50 border-emerald-200',
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200';
  };

  console.log(`🔍 CRMColumn "${stage.nome}" - Total de ${prospects.length} prospects para renderizar`);
  console.log(`📊 Lista completa de prospects na coluna "${stage.nome}":`, 
    prospects.map(p => ({ id: p.id, nome: p.nome, stage: p.stage })));
  console.log(`🎯 DnD Column "${stage.nome}" - isOver:`, isOver, 'droppable ID:', stage.id);

  return (
    <div className="min-w-[320px] max-w-[320px] flex-shrink-0">
      <Card className={`${getBackgroundColor(stage.cor)} border-2 ${isOver ? 'ring-2 ring-blue-400 bg-blue-100' : ''} flex flex-col h-full`}>
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {stage.nome}
            <Badge variant="secondary">{prospects.length}</Badge>
          </CardTitle>
          <div className="text-xs text-gray-600">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div 
              ref={setNodeRef}
              className="space-y-3 p-4 min-h-[200px]"
              style={{ minHeight: 'calc(100% - 16px)' }}
            >
              <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {prospects.map((prospect, index) => {
                  console.log(`📋 Renderizando prospect ${index + 1}/${prospects.length}: "${prospect.nome}" (ID: ${prospect.id}) na stage "${stage.nome}"`);
                  console.log(`🎯 DnD Prospect - sortable ID:`, prospect.id);
                  return (
                    <CRMCard 
                      key={prospect.id} 
                      prospect={prospect} 
                      onProspectClick={onProspectClick}
                    />
                  );
                })}
              </SortableContext>
              
              {prospects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhum prospect nesta etapa</p>
                  <p className="text-xs mt-1">Arraste prospects aqui</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
