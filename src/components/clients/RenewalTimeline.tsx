import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calendar, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface RenewalHistory {
  id: string;
  data_inicio_plano: string;
  data_fim_plano: string;
  periodo_dias: number;
  periodo_label: string;
  renovado_por: string | null;
  created_at: string;
  renovador_nome?: string;
}

interface RenewalTimelineProps {
  clientId: string;
}

export const RenewalTimeline = ({ clientId }: RenewalTimelineProps) => {
  const { userProfile } = useAuth();
  const [renewals, setRenewals] = useState<RenewalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRenewals = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("historico_renovacoes")
        .select(`
          id,
          data_inicio_plano,
          data_fim_plano,
          periodo_dias,
          periodo_label,
          renovado_por,
          created_at
        `)
        .eq("cliente_id", clientId)
        .eq("empresa_id", userProfile.empresa_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes dos renovadores
      if (data && data.length > 0) {
        const renovadorIds = data
          .map((r) => r.renovado_por)
          .filter((id): id is string => id !== null);

        if (renovadorIds.length > 0) {
          const { data: perfis } = await supabase
            .from("perfis")
            .select("id, nome")
            .in("id", renovadorIds);

          const perfilMap = new Map(perfis?.map((p) => [p.id, p.nome]) || []);

          setRenewals(
            data.map((r) => ({
              ...r,
              renovador_nome: r.renovado_por ? perfilMap.get(r.renovado_por) : undefined,
            }))
          );
        } else {
          setRenewals(data);
        }
      } else {
        setRenewals([]);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico de renovações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, [clientId, userProfile?.empresa_id]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Histórico de Renovações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (renewals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Histórico de Renovações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma renovação registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Histórico de Renovações ({renewals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-6">
            {renewals.map((renewal, index) => (
              <div key={renewal.id} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border-2 border-border"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                </div>

                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {renewal.periodo_label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(renewal.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(parseISO(renewal.data_inicio_plano), "dd/MM/yyyy")} →{" "}
                        {format(parseISO(renewal.data_fim_plano), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{renewal.periodo_dias} dias</span>
                    </div>
                    {renewal.renovador_nome && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{renewal.renovador_nome}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
