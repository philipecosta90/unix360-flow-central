import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Pergunta {
  id: string;
  secao: string;
  secao_icone: string | null;
  ordem: number;
  pergunta: string;
  tipo: string;
  opcoes: Json;
  obrigatoria: boolean;
  placeholder: string | null;
}

interface EnvioData {
  id: string;
  status: string;
  expira_em: string;
  template: {
    nome: string;
    descricao: string | null;
  };
}

export const AnamnesePublicPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [envio, setEnvio] = useState<EnvioData | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Link inválido");
        setLoading(false);
        return;
      }

      try {
        // Usar edge function segura para buscar dados do formulário
        const { data, error: fetchError } = await supabase.functions.invoke("get-anamnese-form", {
          body: { token },
        });

        if (fetchError || !data?.success) {
          setError(data?.error || "Link não encontrado ou inválido");
          setLoading(false);
          return;
        }

        const formData = data.data;

        setEnvio({
          id: formData.envio.id,
          status: formData.envio.status,
          expira_em: formData.envio.expira_em,
          template: formData.template,
        });

        setPerguntas(formData.perguntas.map((p: any) => ({
          id: p.id,
          secao: p.secao,
          secao_icone: p.secao_icone,
          ordem: p.ordem,
          pergunta: p.pergunta,
          tipo: p.tipo,
          opcoes: p.opcoes,
          obrigatoria: p.obrigatoria ?? false,
          placeholder: p.placeholder,
        })));
      } catch (err) {
        setError("Erro ao carregar questionário");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const obrigatoriasMissing = perguntas.filter(p => p.obrigatoria && !respostas[p.id]?.trim());
    if (obrigatoriasMissing.length > 0) {
      alert("Por favor, preencha todas as perguntas obrigatórias (marcadas com *)");
      return;
    }

    setSubmitting(true);
    try {
      const respostasArray = Object.entries(respostas).map(([pergunta_id, resposta]) => ({
        pergunta_id,
        resposta,
      }));

      const { error } = await supabase.functions.invoke("submit-anamnese", {
        body: { token, respostas: respostasArray },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || "Erro ao enviar respostas");
    } finally {
      setSubmitting(false);
    }
  };

  const perguntasPorSecao = perguntas.reduce((acc, p) => {
    if (!acc[p.secao]) acc[p.secao] = { icone: p.secao_icone, perguntas: [] };
    acc[p.secao].perguntas.push(p);
    return acc;
  }, {} as Record<string, { icone: string | null; perguntas: Pergunta[] }>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#43B26D]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ops!</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle2 className="h-16 w-16 text-[#43B26D] mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Respostas Enviadas!</h2>
            <p className="text-muted-foreground">
              Obrigado por preencher o questionário. Suas respostas foram recebidas com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-[#43B26D] to-[#37A05B] text-white rounded-t-lg">
            <h1 className="text-2xl font-bold">{envio?.template?.nome}</h1>
          </CardHeader>
          {envio?.template?.descricao && (
            <CardContent className="pt-4">
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {envio.template.descricao}
              </p>
            </CardContent>
          )}
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(perguntasPorSecao).map(([secao, data]) => (
            <Card key={secao}>
              <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {data.icone && <span>{data.icone}</span>}
                  {secao}
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.perguntas.map((p) => (
                  <div key={p.id} className="space-y-2">
                    <Label>
                      {p.pergunta}
                      {p.obrigatoria && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {p.tipo === "textarea" ? (
                      <Textarea
                        value={respostas[p.id] || ""}
                        onChange={(e) => setRespostas({ ...respostas, [p.id]: e.target.value })}
                        placeholder={p.placeholder || ""}
                        rows={3}
                      />
                    ) : p.tipo === "select" && Array.isArray(p.opcoes) ? (
                      <Select
                        value={respostas[p.id] || ""}
                        onValueChange={(v) => setRespostas({ ...respostas, [p.id]: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {(p.opcoes as string[]).map((opcao) => (
                            <SelectItem key={opcao} value={opcao}>{opcao}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={p.tipo === "number" ? "number" : p.tipo === "email" ? "email" : p.tipo === "date" ? "date" : "text"}
                        value={respostas[p.id] || ""}
                        onChange={(e) => setRespostas({ ...respostas, [p.id]: e.target.value })}
                        placeholder={p.placeholder || ""}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Button
            type="submit"
            className="w-full bg-[#43B26D] hover:bg-[#37A05B] py-6 text-lg"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            Enviar Respostas
          </Button>
        </form>
      </div>
    </div>
  );
};
