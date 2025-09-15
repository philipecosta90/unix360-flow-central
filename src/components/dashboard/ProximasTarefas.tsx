
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const ProximasTarefas = () => {
  const { userProfile } = useAuth();

  const { data: proximasTarefas, isLoading } = useQuery({
    queryKey: ['proximas-tarefas', userProfile?.empresa_id],
    queryFn: async () => {
      if (!userProfile?.empresa_id) return [];

      const hoje = new Date().toISOString().split('T')[0];
      const proximaSemana = new Date();
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      const proximaSemanaStr = proximaSemana.toISOString().split('T')[0];

      const { data } = await supabase
        .from('financeiro_tarefas')
        .select('*')
        .eq('empresa_id', userProfile.empresa_id)
        .eq('concluida', false)
        .gte('vencimento', hoje)
        .lte('vencimento', proximaSemanaStr)
        .order('vencimento', { ascending: true })
        .limit(5);

      return data || [];
    },
    enabled: !!userProfile?.empresa_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="p-3 rounded-lg bg-muted">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  // Safe check for tasks array
  const safeTasks = Array.isArray(proximasTarefas) ? proximasTarefas : [];

  if (!safeTasks.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma tarefa próxima</p>
      </div>
    );
  }

  const formatarDataVencimento = (vencimento: string) => {
    if (!vencimento) return "Sem data";
    
    try {
      const data = new Date(vencimento);
      const hoje = new Date();
      const diffTime = data.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Hoje";
      if (diffDays === 1) return "Amanhã";
      if (diffDays <= 7) return `Em ${diffDays} dias`;
      return data.toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  const getPrioridade = (vencimento: string) => {
    if (!vencimento) return { label: "Normal", color: "bg-green-100 text-green-600" };
    
    try {
      const data = new Date(vencimento);
      const hoje = new Date();
      const diffTime = data.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) return { label: "Urgente", color: "bg-red-100 text-red-600" };
      if (diffDays <= 3) return { label: "Alta", color: "bg-orange-100 text-orange-600" };
      return { label: "Normal", color: "bg-green-100 text-green-600" };
    } catch {
      return { label: "Normal", color: "bg-green-100 text-green-600" };
    }
  };

  return (
    <>
      {safeTasks.map((task, index) => {
        if (!task) return null;
        
        const prioridade = getPrioridade(task.vencimento);
        return (
          <div key={task.id || index} className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div>
              <p className="text-sm font-medium text-foreground">{task.descricao || 'Tarefa sem descrição'}</p>
              <p className="text-xs text-muted-foreground">{formatarDataVencimento(task.vencimento)}</p>
            </div>
            <Badge className={`px-2 py-1 text-xs rounded-full ${prioridade.color}`}>
              {prioridade.label}
            </Badge>
          </div>
        );
      })}
    </>
  );
};
