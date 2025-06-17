
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CRMCard } from "./CRMCard";

interface CRMStage {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}

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
  perfis?: {
    nome: string;
    sobrenome: string;
  };
}

interface CRMColumnProps {
  stage: CRMStage;
  prospects: CRMProspect[];
  totalValue: number;
}

export const CRMColumn = ({ stage, prospects, totalValue }: CRMColumnProps) => {
  const { setNodeRef } = useDroppable({
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

  return (
    <div className="min-w-[300px]">
      <Card className={`${getBackgroundColor(stage.cor)} border-2`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            {stage.nome}
            <Badge variant="secondary">{prospects.length}</Badge>
          </CardTitle>
          <div className="text-xs text-gray-600">
            R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </CardHeader>
        <CardContent 
          ref={setNodeRef}
          className="space-y-3 min-h-[200px]"
        >
          <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {prospects.map((prospect) => (
              <CRMCard key={prospect.id} prospect={prospect} />
            ))}
          </SortableContext>
          
          {prospects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Nenhum prospect nesta etapa</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
