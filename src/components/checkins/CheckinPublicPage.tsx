import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle, AlertCircle, Clock, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

interface Pergunta {
  id: string;
  pergunta: string;
  tipo: string;
  secao: string;
  secao_icone?: string;
  obrigatoria: boolean;
  placeholder?: string;
  pontos_maximo?: number;
  opcoes_pontuacao?: Array<{ label: string; valor: number }>;
}

interface EnvioData {
  id: string;
  status: string;
  expira_em: string;
  template: {
    nome: string;
    descricao?: string;
  };
  cliente: {
    nome: string;
  };
}

export const CheckinPublicPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [envio, setEnvio] = useState<EnvioData | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Link inválido");
        setLoading(false);
        return;
      }

      try {
        // Buscar envio pelo token
        const { data: envioData, error: envioError } = await supabase
          .from("checkin_envios")
          .select(`
            id,
            status,
            expira_em,
            template:checkin_templates(nome, descricao),
            cliente:clientes(nome)
          `)
          .eq("token", token)
          .maybeSingle();

        if (envioError || !envioData) {
          setError("Link inválido ou não encontrado");
          setLoading(false);
          return;
        }

        // Verificar status
        if (envioData.status === "respondido") {
          setError("Este check-in já foi respondido");
          setLoading(false);
          return;
        }

        // Verificar expiração
        const now = new Date();
        const expiraEm = new Date(envioData.expira_em);
        if (now > expiraEm) {
          setError("Este link expirou. Solicite um novo envio.");
          setLoading(false);
          return;
        }

        // Buscar template_id do envio
        const { data: envioFull } = await supabase
          .from("checkin_envios")
          .select("template_id")
          .eq("token", token)
          .single();

        if (!envioFull) {
          setError("Erro ao carregar dados do check-in");
          setLoading(false);
          return;
        }

        // Buscar perguntas do template
        const { data: perguntasData, error: perguntasError } = await supabase
          .from("checkin_perguntas")
          .select("*")
          .eq("template_id", envioFull.template_id)
          .order("ordem");

        if (perguntasError) {
          throw perguntasError;
        }

        const mappedPerguntas: Pergunta[] = (perguntasData || []).map(p => ({
          id: p.id,
          pergunta: p.pergunta,
          tipo: p.tipo,
          secao: p.secao,
          secao_icone: p.secao_icone,
          obrigatoria: p.obrigatoria ?? false,
          placeholder: p.placeholder,
          pontos_maximo: p.pontos_maximo,
          opcoes_pontuacao: p.opcoes_pontuacao as Array<{ label: string; valor: number }> | undefined
        }));

        setEnvio({
          id: envioData.id,
          status: envioData.status,
          expira_em: envioData.expira_em,
          template: envioData.template as { nome: string; descricao?: string },
          cliente: envioData.cliente as { nome: string }
        });
        setPerguntas(mappedPerguntas);
      } catch (err) {
        console.error("Erro ao carregar check-in:", err);
        setError("Erro ao carregar o check-in. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async () => {
    // Validar campos obrigatórios
    const perguntasObrigatorias = perguntas.filter(p => p.obrigatoria);
    const naoRespondidas = perguntasObrigatorias.filter(
      p => !respostas[p.id] || respostas[p.id].trim() === ""
    );

    if (naoRespondidas.length > 0) {
      toast.error(`Por favor, responda todas as perguntas obrigatórias (${naoRespondidas.length} faltando)`);
      return;
    }

    setSubmitting(true);

    try {
      // Preparar respostas com pontuação
      const respostasArray = perguntas.map(p => {
        const resposta = respostas[p.id] || "";
        let pontuacao: number | null = null;
        let indicador_visual: string | null = null;

        // Calcular pontuação para tipos com escala
        if (p.tipo === "likert" && resposta) {
          pontuacao = parseInt(resposta);
          const max = p.pontos_maximo || 5;
          const percent = (pontuacao / max) * 100;
          if (percent >= 80) indicador_visual = "verde";
          else if (percent >= 50) indicador_visual = "amarelo";
          else indicador_visual = "vermelho";
        } else if (p.tipo === "select_pontos" && resposta && p.opcoes_pontuacao) {
          const opcao = p.opcoes_pontuacao.find(o => o.label === resposta);
          if (opcao) {
            pontuacao = opcao.valor;
            const max = p.pontos_maximo || Math.max(...p.opcoes_pontuacao.map(o => o.valor));
            const percent = (pontuacao / max) * 100;
            if (percent >= 80) indicador_visual = "verde";
            else if (percent >= 50) indicador_visual = "amarelo";
            else indicador_visual = "vermelho";
          }
        }

        return {
          pergunta_id: p.id,
          resposta,
          pontuacao,
          indicador_visual
        };
      });

      const response = await supabase.functions.invoke("submit-checkin", {
        body: { token, respostas: respostasArray }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setSuccess(true);
      toast.success("Check-in enviado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao enviar check-in:", err);
      toast.error(err.message || "Erro ao enviar check-in. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Agrupar perguntas por seção
  const perguntasPorSecao = perguntas.reduce((acc, pergunta) => {
    const secao = pergunta.secao || "Geral";
    if (!acc[secao]) {
      acc[secao] = [];
    }
    acc[secao].push(pergunta);
    return acc;
  }, {} as Record<string, Pergunta[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando check-in...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 to-destructive/10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ops!</h2>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Check-in Enviado!</h2>
            <p className="text-muted-foreground text-center">
              Obrigado por preencher seu check-in, {envio?.cliente?.nome}!
              <br />
              Suas respostas foram registradas com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderInputField = (pergunta: Pergunta) => {
    const value = respostas[pergunta.id] || "";

    switch (pergunta.tipo) {
      case "likert":
        const maxPontos = pergunta.pontos_maximo || 5;
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => setRespostas({ ...respostas, [pergunta.id]: v })}
            className="flex flex-wrap gap-3 mt-2"
          >
            {Array.from({ length: maxPontos }, (_, i) => i + 1).map((num) => (
              <div key={num} className="flex flex-col items-center">
                <RadioGroupItem
                  value={num.toString()}
                  id={`${pergunta.id}-${num}`}
                  className="sr-only"
                />
                <Label
                  htmlFor={`${pergunta.id}-${num}`}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center cursor-pointer 
                    border-2 transition-all text-lg font-medium
                    ${value === num.toString()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/30 hover:border-primary/50"
                    }
                  `}
                >
                  {num}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "select_pontos":
        if (pergunta.opcoes_pontuacao && pergunta.opcoes_pontuacao.length > 0) {
          return (
            <RadioGroup
              value={value}
              onValueChange={(v) => setRespostas({ ...respostas, [pergunta.id]: v })}
              className="space-y-2 mt-2"
            >
              {pergunta.opcoes_pontuacao.map((opcao, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <RadioGroupItem value={opcao.label} id={`${pergunta.id}-${idx}`} />
                  <Label htmlFor={`${pergunta.id}-${idx}`} className="cursor-pointer">
                    {opcao.label} <span className="text-muted-foreground text-sm">({opcao.valor} pts)</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );
        }
        return null;

      case "texto_longo":
        return (
          <Textarea
            value={value}
            onChange={(e) => setRespostas({ ...respostas, [pergunta.id]: e.target.value })}
            placeholder={pergunta.placeholder || "Digite sua resposta..."}
            className="mt-2"
            rows={4}
          />
        );

      case "numero":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setRespostas({ ...respostas, [pergunta.id]: e.target.value })}
            placeholder={pergunta.placeholder || "Digite um número"}
            className="mt-2"
          />
        );

      case "foto":
      case "arquivo":
        return (
          <div className="mt-2">
            <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-sm">Upload de {pergunta.tipo === "foto" ? "foto" : "arquivo"} em breve...</span>
            </div>
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setRespostas({ ...respostas, [pergunta.id]: e.target.value })}
            placeholder={pergunta.placeholder || "Digite sua resposta"}
            className="mt-2"
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{envio?.template?.nome}</CardTitle>
            {envio?.template?.descricao && (
              <CardDescription className="text-base mt-2">
                {envio.template.descricao}
              </CardDescription>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Olá, <span className="font-medium text-foreground">{envio?.cliente?.nome}</span>!
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
              <Clock className="h-4 w-4" />
              <span>
                Válido até {envio?.expira_em ? new Date(envio.expira_em).toLocaleDateString("pt-BR") : ""}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Perguntas por Seção */}
        {Object.entries(perguntasPorSecao).map(([secao, perguntasSecao]) => (
          <Card key={secao} className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                {secao}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {perguntasSecao.map((pergunta, index) => (
                <div key={pergunta.id} className="space-y-2">
                  <Label className="text-base">
                    {index + 1}. {pergunta.pergunta}
                    {pergunta.obrigatoria && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  {renderInputField(pergunta)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Submit Button */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="min-w-[200px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Check-in"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
