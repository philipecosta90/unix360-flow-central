import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Eye, AlertTriangle } from "lucide-react";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";

interface Pergunta {
  id: string;
  secao: string;
  secao_icone?: string | null;
  pergunta: string;
  tipo: string;
  obrigatoria: boolean;
}

interface ClientPagePreviewProps {
  tipo: "anamnese" | "checkin";
  templateNome: string;
  templateDescricao?: string;
  perguntas: Pergunta[];
  avisoFinal?: string;
}

export function ClientPagePreview({
  tipo,
  templateNome,
  templateDescricao,
  perguntas,
  avisoFinal,
}: ClientPagePreviewProps) {
  const { config, loading } = useEmpresaConfig();

  const perguntasPorSecao = useMemo(() => {
    return perguntas.reduce((acc, p) => {
      const secao = p.secao || "Geral";
      if (!acc[secao]) {
        acc[secao] = { icone: p.secao_icone, perguntas: [] };
      }
      acc[secao].perguntas.push(p);
      return acc;
    }, {} as Record<string, { icone: string | null | undefined; perguntas: Pergunta[] }>);
  }, [perguntas]);

  const empresaNome = config?.nome_exibicao || config?.nome || "Sua Empresa";
  const corPrimaria = config?.cor_primaria || "#43B26D";
  const corSecundaria = config?.cor_secundaria || "#37A05B";
  const logoUrl = config?.logo_url;

  const buttonLabel = tipo === "anamnese" ? "Enviar Anamnese" : "Enviar Check-in";
  const iconLabel = tipo === "anamnese" ? "📋" : "📊";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground text-sm">
          Carregando preview...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Preview Header */}
      <div className="flex items-center gap-2 pb-3 border-b mb-3">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Pré-visualização
        </span>
      </div>

      {/* Preview Content */}
      <div
        className="flex-1 rounded-lg overflow-hidden border shadow-sm"
        style={{ backgroundColor: "#f8fafc" }}
      >
        {/* Header with gradient */}
        <div
          className="p-4 text-white text-center"
          style={{
            background: `linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%)`,
          }}
        >
          <Avatar className="h-12 w-12 mx-auto mb-2 border-2 border-white/30">
            <AvatarImage src={logoUrl || undefined} alt={empresaNome} />
            <AvatarFallback className="bg-white/20 text-white">
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <p className="font-semibold text-sm">{empresaNome}</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto text-gray-900">
          {/* Template Title */}
          <div className="text-center">
            <h3 className="font-bold text-base flex items-center justify-center gap-2 text-gray-900">
              {iconLabel} {templateNome || "Nome do Template"}
            </h3>
            {templateDescricao && (
              <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                {templateDescricao}
              </p>
            )}
          </div>

          {/* Questions Preview */}
          {Object.keys(perguntasPorSecao).length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-xs">
              <p>Adicione perguntas para visualizar</p>
              <p className="mt-1">como aparecerão para o cliente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(perguntasPorSecao).map(([secao, { icone, perguntas: perguntasSecao }]) => (
                <div key={secao} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                    style={{ color: corPrimaria }}
                  >
                    {icone && <span>{icone}</span>}
                    {secao}
                  </h4>
                  <div className="space-y-2">
                    {perguntasSecao.map((p) => (
                      <div key={p.id} className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1 text-gray-900">
                          {p.pergunta}
                          {p.obrigatoria && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        <PreviewInput tipo={p.tipo} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warning Card */}
          {avisoFinal && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800 mb-0.5">Avisos Importantes</p>
                  <p className="text-xs text-amber-700 whitespace-pre-line">
                    {avisoFinal}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            className="w-full py-2 px-4 rounded-md text-white text-sm font-medium mt-4"
            style={{ backgroundColor: corPrimaria }}
            disabled
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewInput({ tipo }: { tipo: string }) {
  const baseClass =
    "w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-400";

  switch (tipo) {
    case "textarea":
      return (
        <div className={`${baseClass} h-12`}>
          <span className="text-gray-400">Resposta longa...</span>
        </div>
      );
    case "select":
    case "escala":
      return (
        <div className={`${baseClass} flex items-center justify-between`}>
          <span className="text-gray-400">Selecione...</span>
          <span className="text-gray-300">▼</span>
        </div>
      );
    case "number":
      return (
        <div className={baseClass}>
          <span className="text-gray-400">123</span>
        </div>
      );
    case "date":
      return (
        <div className={baseClass}>
          <span className="text-gray-400">dd/mm/aaaa</span>
        </div>
      );
    case "email":
      return (
        <div className={baseClass}>
          <span className="text-gray-400">email@exemplo.com</span>
        </div>
      );
    case "foto":
    case "arquivo":
      return (
        <div className={`${baseClass} text-center`}>
          <span className="text-gray-400">📎 Anexar arquivo</span>
        </div>
      );
    default:
      return (
        <div className={baseClass}>
          <span className="text-gray-400">Digite aqui...</span>
        </div>
      );
  }
}
