import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  Send, 
  RefreshCw,
  User,
  FileText,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CheckinEnvio {
  id: string;
  status: string;
  enviado_em: string | null;
  created_at: string | null;
  respondido_em: string | null;
  cliente: {
    id: string;
    nome: string;
  } | null;
  template: {
    id: string;
    nome: string;
  } | null;
  agendamento_id: string | null;
}

export default function CheckinEnviosFila() {
  const { userProfile } = useAuth();
  const [envios, setEnvios] = useState<CheckinEnvio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnvios = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("checkin_envios")
        .select(`
          id,
          status,
          enviado_em,
          created_at,
          respondido_em,
          agendamento_id,
          cliente:clientes(id, nome),
          template:checkin_templates(id, nome)
        `)
        .eq("empresa_id", userProfile.empresa_id)
        .eq("status", "pendente")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedData = (data || []).map((item) => ({
        ...item,
        cliente: Array.isArray(item.cliente) ? item.cliente[0] : item.cliente,
        template: Array.isArray(item.template) ? item.template[0] : item.template,
      })) as CheckinEnvio[];

      setEnvios(formattedData);
    } catch (error) {
      console.error("Erro ao buscar envios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvios();
  }, [userProfile?.empresa_id]);

  // Realtime subscription
  useEffect(() => {
    if (!userProfile?.empresa_id) return;

    const channel = supabase
      .channel("checkin-envios-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checkin_envios",
          filter: `empresa_id=eq.${userProfile.empresa_id}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchEnvios();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.empresa_id]);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return formatDistanceToNow(new Date(dateStr), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return "-";
    }
  };

  // Calculate estimated time (avg 17.5s per send)
  const estimatedMinutes = envios.length > 1 
    ? Math.ceil((envios.length - 1) * 17.5 / 60) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5" />
            Fila de Envios em Tempo Real
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEnvios}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
        
        {/* Stats Summary */}
        <div className="flex items-center gap-3 mt-3">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {envios.length} na fila
          </Badge>
          {envios.length > 0 && estimatedMinutes > 0 && (
            <span className="text-sm text-muted-foreground">
              Tempo estimado: ~{estimatedMinutes} min
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : envios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="font-medium">Fila de envios vazia</p>
            <p className="text-sm">Todos os check-ins foram enviados com sucesso</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {envios.map((envio, index) => {
                const isRecent = envio.created_at && 
                  (new Date().getTime() - new Date(envio.created_at).getTime()) < 60000;

                return (
                  <div
                    key={envio.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border bg-card transition-all ${
                      isRecent ? "ring-2 ring-primary/50 animate-pulse" : ""
                    }`}
                  >
                    {/* Queue position */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      #{index + 1}
                    </div>

                    {/* Client info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">
                          {envio.cliente?.nome || "Cliente não encontrado"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {envio.template?.nome || "Template"}
                        </span>
                        {envio.agendamento_id && (
                          <Badge variant="outline" className="text-xs">
                            Agendado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-xs text-muted-foreground text-right flex-shrink-0">
                      {formatTime(envio.created_at)}
                    </div>

                    {/* Status badge */}
                    <Badge
                      variant="outline"
                      className="flex-shrink-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="ml-1">Na fila</span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Atualizações em tempo real ativas
        </div>
      </CardContent>
    </Card>
  );
}
