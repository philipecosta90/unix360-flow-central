import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle, AlertCircle, Clock, Upload, X } from "lucide-react";
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
  opcoes_pontuacao?: Record<string, number>;
}

interface EmpresaData {
  nome: string;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
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
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [arquivos, setArquivos] = useState<Record<string, File[]>>({});
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Link inválido");
        setLoading(false);
        return;
      }

      try {
        // Usar edge function segura para buscar dados do formulário
        const { data, error: fetchError } = await supabase.functions.invoke("get-checkin-form", {
          body: { token },
        });

        if (fetchError || !data?.success) {
          setError(data?.error || "Link inválido ou não encontrado");
          setLoading(false);
          return;
        }

        const formData = data.data;

        setEnvio({
          id: formData.envio.id,
          status: formData.envio.status,
          expira_em: formData.envio.expira_em,
          template: formData.template,
          cliente: formData.cliente,
        });

        // Dados da empresa para personalização
        if (formData.empresa) {
          setEmpresa({
            nome: formData.empresa.nome,
            logo_url: formData.empresa.logo_url,
            cor_primaria: formData.empresa.cor_primaria || "#43B26D",
            cor_secundaria: formData.empresa.cor_secundaria || "#37A05B",
          });
        }

        setPerguntas(formData.perguntas.map((p: any) => ({
          id: p.id,
          pergunta: p.pergunta,
          tipo: p.tipo,
          secao: p.secao,
          secao_icone: p.secao_icone,
          obrigatoria: p.obrigatoria ?? false,
          placeholder: p.placeholder,
          pontos_maximo: p.pontos_maximo,
          opcoes_pontuacao: p.opcoes_pontuacao as Record<string, number> | undefined
        })));
      } catch (err) {
        console.error("Erro ao carregar check-in:", err);
        setError("Erro ao carregar o check-in. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleFileSelect = (perguntaId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setArquivos(prev => ({
      ...prev,
      [perguntaId]: [...(prev[perguntaId] || []), ...fileArray]
    }));
  };

  const removeFile = (perguntaId: string, index: number) => {
    setArquivos(prev => ({
      ...prev,
      [perguntaId]: prev[perguntaId].filter((_, i) => i !== index)
    }));
  };

  const uploadFiles = async (perguntaId: string, files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const fileName = `${envio?.id}/${perguntaId}/${Date.now()}-${file.name}`;
      
      const { error } = await supabase.storage
        .from('checkin-uploads')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('checkin-uploads')
        .getPublicUrl(fileName);
      
      urls.push(urlData.publicUrl);
    }
    
    return urls;
  };

  const handleSubmit = async () => {
    // Validar campos obrigatórios (considera arquivos como resposta válida)
    const perguntasObrigatorias = perguntas.filter(p => p.obrigatoria);
    const naoRespondidas = perguntasObrigatorias.filter(p => {
      const temResposta = respostas[p.id] && respostas[p.id].trim() !== "";
      const temArquivo = arquivos[p.id] && arquivos[p.id].length > 0;
      return !temResposta && !temArquivo;
    });

    if (naoRespondidas.length > 0) {
      toast.error(`Por favor, responda todas as perguntas obrigatórias (${naoRespondidas.length} faltando)`);
      return;
    }

    setSubmitting(true);
    setUploadingFiles(true);

    try {
      // Upload de arquivos primeiro
      const arquivosUrls: Record<string, string> = {};
      
      for (const [perguntaId, files] of Object.entries(arquivos)) {
        if (files.length > 0) {
          const urls = await uploadFiles(perguntaId, files);
          arquivosUrls[perguntaId] = urls.join('|||');
        }
      }
      
      setUploadingFiles(false);

      // Preparar respostas com pontuação
      const respostasArray = perguntas.map(p => {
        const resposta = respostas[p.id] || "";
        let pontuacao: number | null = null;
        let indicador_visual: string | null = null;

        // Calcular pontuação para tipos com escala
        if ((p.tipo === "likert" || p.tipo === "likert_5" || p.tipo === "likert_10") && resposta) {
          pontuacao = parseInt(resposta);
          const max = p.pontos_maximo || (p.tipo === "likert_10" ? 10 : 5);
          const percent = (pontuacao / max) * 100;
          if (percent >= 80) indicador_visual = "verde";
          else if (percent >= 50) indicador_visual = "amarelo";
          else indicador_visual = "vermelho";
        } else if (p.tipo === "select_pontuado" && resposta && p.opcoes_pontuacao) {
          pontuacao = p.opcoes_pontuacao[resposta] ?? null;
          if (pontuacao !== null) {
            const max = p.pontos_maximo || Math.max(...Object.values(p.opcoes_pontuacao));
            const percent = (pontuacao / max) * 100;
            if (percent >= 80) indicador_visual = "verde";
            else if (percent >= 50) indicador_visual = "amarelo";
            else indicador_visual = "vermelho";
          }
        }

        return {
          pergunta_id: p.id,
          resposta,
          resposta_arquivo: arquivosUrls[p.id] || null,
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
      setUploadingFiles(false);
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

  // Cores da empresa ou padrão
  const corPrimaria = empresa?.cor_primaria || "#43B26D";
  const corSecundaria = empresa?.cor_secundaria || "#37A05B";
  const empresaNome = empresa?.nome || "Empresa";
  const initials = empresaNome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${corPrimaria}10, ${corSecundaria}10)` }}
      >
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: corPrimaria }} />
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${corPrimaria}10, ${corSecundaria}10)` }}
      >
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 mb-4" style={{ color: corPrimaria }} />
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
      case "likert_5":
      case "likert_10":
        const maxPontos = pergunta.pontos_maximo || (pergunta.tipo === "likert_10" ? 10 : 5);
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
                  className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all text-lg font-medium"
                  style={{
                    backgroundColor: value === num.toString() ? corPrimaria : "transparent",
                    color: value === num.toString() ? "white" : "inherit",
                    borderColor: value === num.toString() ? corPrimaria : "hsl(var(--muted-foreground) / 0.3)",
                  }}
                >
                  {num}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "select_pontuado":
        if (pergunta.opcoes_pontuacao && Object.keys(pergunta.opcoes_pontuacao).length > 0) {
          const opcoes = Object.entries(pergunta.opcoes_pontuacao);
          return (
            <RadioGroup
              value={value}
              onValueChange={(v) => setRespostas({ ...respostas, [pergunta.id]: v })}
              className="space-y-2 mt-2"
            >
              {opcoes.map(([label, pontos], idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <RadioGroupItem value={label} id={`${pergunta.id}-${idx}`} />
                  <Label htmlFor={`${pergunta.id}-${idx}`} className="cursor-pointer">
                    {label} <span className="text-muted-foreground text-sm">({pontos} pts)</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          );
        }
        return null;

      case "sim_nao":
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => setRespostas({ ...respostas, [pergunta.id]: v })}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${pergunta.id}-sim`} />
              <Label htmlFor={`${pergunta.id}-sim`} className="cursor-pointer font-medium">
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${pergunta.id}-nao`} />
              <Label htmlFor={`${pergunta.id}-nao`} className="cursor-pointer font-medium">
                Não
              </Label>
            </div>
          </RadioGroup>
        );

      case "multipla_escolha":
        if (pergunta.opcoes_pontuacao && Object.keys(pergunta.opcoes_pontuacao).length > 0) {
          const opcoes = Object.keys(pergunta.opcoes_pontuacao);
          const selectedValues = value ? value.split("|||") : [];
          
          return (
            <div className="space-y-2 mt-2">
              {opcoes.map((opcao, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${pergunta.id}-${idx}`}
                    checked={selectedValues.includes(opcao)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, opcao]
                        : selectedValues.filter(v => v !== opcao);
                      setRespostas({ ...respostas, [pergunta.id]: newValues.join("|||") });
                    }}
                  />
                  <Label htmlFor={`${pergunta.id}-${idx}`} className="cursor-pointer">
                    {opcao}
                  </Label>
                </div>
              ))}
            </div>
          );
        }
        return null;

      case "texto_longo":
      case "texto":
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
      case "arquivo": {
        const files = arquivos[pergunta.id] || [];
        const tipoAceito = pergunta.tipo === "foto" ? "image/*" : "*/*";
        
        return (
          <div className="mt-2 space-y-3">
            <input
              type="file"
              accept={tipoAceito}
              multiple={pergunta.tipo === "foto"}
              className="hidden"
              id={`file-${pergunta.id}`}
              onChange={(e) => handleFileSelect(pergunta.id, e.target.files)}
            />
            <label
              htmlFor={`file-${pergunta.id}`}
              className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
              style={{ borderColor: files.length > 0 ? corPrimaria : undefined }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para selecionar {pergunta.tipo === "foto" ? "fotos" : "arquivo"}
              </span>
            </label>
            
            {/* Preview das fotos/arquivos selecionados */}
            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {files.map((file, idx) => (
                  <div key={idx} className="relative aspect-square group">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground text-center px-2 truncate">
                          {file.name}
                        </span>
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => removeFile(pergunta.id, idx)}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-80 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

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
    <div 
      className="min-h-screen py-8 px-4"
      style={{ background: `linear-gradient(135deg, ${corPrimaria}08, ${corSecundaria}08)` }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header com branding da empresa */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                <AvatarImage src={empresa?.logo_url || undefined} alt={empresaNome} />
                <AvatarFallback 
                  className="text-lg font-semibold text-white"
                  style={{ backgroundColor: corPrimaria }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{empresaNome}</p>
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
            className="min-w-[200px] text-white"
            style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
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