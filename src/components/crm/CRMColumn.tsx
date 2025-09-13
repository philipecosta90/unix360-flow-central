import { useDroppable } from "@dnd-kit/core";
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

  const getHeaderColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'bg-blue-500',
      '#F59E0B': 'bg-amber-500', 
      '#F97316': 'bg-orange-500',
      '#8B5CF6': 'bg-purple-500',
      '#10B981': 'bg-emerald-500',
      '#EF4444': 'bg-red-500',
      '#6B7280': 'bg-gray-500',
      '#EC4899': 'bg-pink-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const formatValue = (value: number) => {
    if (value === 0) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-w-[250px] max-w-[250px] flex-shrink-0">
      <div className={`${isOver ? 'ring-2 ring-blue-400' : ''} flex flex-col h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-lg overflow-hidden`}>
        {/* Header com cor */}
        <div className={`${getHeaderColor(stage.cor)} px-4 py-3 text-white`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm uppercase tracking-wide">
              {stage.nome}
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                {prospects.length}
              </span>
            </div>
          </div>
          <div className="text-xs mt-1 text-white/90">
            {formatValue(totalValue)}
          </div>
        </div>
        
        {/* Conteúdo scrollável */}
        <div 
          ref={setNodeRef}
          className="flex-1 p-2 overflow-y-auto bg-gray-50"
        >
          <div className="space-y-2">
            {prospects.map((prospect) => (
              <CRMCard
                key={prospect.id} 
                prospect={prospect} 
                onProspectClick={onProspectClick}
              />
            ))}
          </div>
          
          {prospects.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Nenhum prospect</p>
              <p className="text-xs mt-1">Arraste aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};