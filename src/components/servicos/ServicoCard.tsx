import { Edit2, Trash2, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Servico } from "@/hooks/useServicos";

interface ServicoCardProps {
  servico: Servico;
  onEdit: () => void;
  onDelete: () => void;
}

const tipoLabels: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  avulso: "Avulso",
};

const tipoColors: Record<string, string> = {
  mensal: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  trimestral: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  semestral: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  anual: "bg-green-500/10 text-green-600 border-green-500/20",
  avulso: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export const ServicoCard = ({ servico, onEdit, onDelete }: ServicoCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className={`transition-all hover:shadow-md ${!servico.ativo ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{servico.nome}</h3>
            {servico.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {servico.descricao}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(servico.valor)}
          </span>
          {!servico.ativo && (
            <Badge variant="secondary">Inativo</Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={tipoColors[servico.tipo] || tipoColors.avulso}>
            <Calendar className="h-3 w-3 mr-1" />
            {tipoLabels[servico.tipo] || servico.tipo}
            {servico.tipo !== 'avulso' && ` (${servico.duracao_meses} ${servico.duracao_meses === 1 ? 'mês' : 'meses'})`}
          </Badge>
          <Badge variant="outline" className="bg-muted/50">
            <Tag className="h-3 w-3 mr-1" />
            {servico.categoria}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
