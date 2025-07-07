import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feedback {
  id: string;
  nome: string | null;
  email: string | null;
  tipo: string;
  mensagem: string;
  data_envio: string;
}

export const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [ordemData, setOrdemData] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("feedback")
        .select("*");

      if (filtroTipo !== "todos") {
        query = query.eq("tipo", filtroTipo);
      }

      query = query.order("data_envio", { ascending: ordemData === "asc" });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setFeedbacks(data || []);
    } catch (error) {
      console.error("Erro ao buscar feedbacks:", error);
      toast({
        title: "Erro ao carregar feedbacks",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filtroTipo, ordemData]);

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "Bug":
        return "destructive";
      case "Sugestão":
        return "default";
      case "Dúvida":
        return "secondary";
      default:
        return "outline";
    }
  };

  const toggleOrdem = () => {
    setOrdemData(ordemData === "asc" ? "desc" : "asc");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">Feedbacks dos Usuários</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Sugestão">Sugestão</SelectItem>
              <SelectItem value="Bug">Bug</SelectItem>
              <SelectItem value="Dúvida">Dúvida</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleOrdem}
            className="flex items-center gap-2"
          >
            Data
            {ordemData === "desc" ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Nenhum feedback encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getBadgeVariant(feedback.tipo)}>
                      {feedback.tipo}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(feedback.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {(feedback.nome || feedback.email) && (
                    <div className="text-sm text-muted-foreground">
                      {feedback.nome && <span>{feedback.nome}</span>}
                      {feedback.nome && feedback.email && <span> • </span>}
                      {feedback.email && <span>{feedback.email}</span>}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback.mensagem}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};