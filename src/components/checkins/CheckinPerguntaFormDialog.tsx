import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import {
  useCheckinPerguntas,
  CheckinPergunta,
  TIPOS_PERGUNTA_CHECKIN,
} from "@/hooks/useCheckins";
import { toast } from "sonner";

const ICONES_SECAO = ["📋", "💪", "🍎", "😴", "💧", "🎯", "📊", "💬", "⚡", "🏃"];

interface CheckinPerguntaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  pergunta: CheckinPergunta | null;
  secoesExistentes: string[];
  proximaOrdem: number;
}

export const CheckinPerguntaFormDialog = ({
  open,
  onOpenChange,
  templateId,
  pergunta,
  secoesExistentes,
  proximaOrdem,
}: CheckinPerguntaFormDialogProps) => {
  const isEditing = !!pergunta;
  const { createPergunta, updatePergunta } = useCheckinPerguntas(templateId);

  const [secao, setSecao] = useState("");
  const [secaoIcone, setSecaoIcone] = useState("📋");
  const [usarNovaSecao, setUsarNovaSecao] = useState(false);
  const [textoPergunta, setTextoPergunta] = useState("");
  const [tipo, setTipo] = useState("likert_5");
  const [pontosMaximo, setPontosMaximo] = useState(5);
  const [obrigatoria, setObrigatoria] = useState(true);
  const [placeholder, setPlaceholder] = useState("");
  const [opcoesPontuacao, setOpcoesPontuacao] = useState<{ label: string; pontos: number }[]>([]);
  const [novaOpcaoLabel, setNovaOpcaoLabel] = useState("");
  const [novaOpcaoPontos, setNovaOpcaoPontos] = useState(0);

  useEffect(() => {
    if (pergunta) {
      setSecao(pergunta.secao);
      setSecaoIcone(pergunta.secao_icone || "📋");
      setTextoPergunta(pergunta.pergunta);
      setTipo(pergunta.tipo);
      setPontosMaximo(pergunta.pontos_maximo);
      setObrigatoria(pergunta.obrigatoria);
      setPlaceholder(pergunta.placeholder || "");
      
      if (pergunta.opcoes_pontuacao) {
        const opcoes = Object.entries(pergunta.opcoes_pontuacao).map(([label, pontos]) => ({
          label,
          pontos: pontos as number,
        }));
        setOpcoesPontuacao(opcoes);
      } else {
        setOpcoesPontuacao([]);
      }
    } else {
      setSecao(secoesExistentes[0] || "");
      setSecaoIcone("📋");
      setUsarNovaSecao(secoesExistentes.length === 0);
      setTextoPergunta("");
      setTipo("likert_5");
      setPontosMaximo(5);
      setObrigatoria(true);
      setPlaceholder("");
      setOpcoesPontuacao([]);
    }
  }, [pergunta, open, secoesExistentes]);

  // Atualizar pontos máximos baseado no tipo
  useEffect(() => {
    if (tipo === "likert_5") {
      setPontosMaximo(5);
    } else if (tipo === "likert_10") {
      setPontosMaximo(10);
    } else if (tipo === "select_pontuado") {
      const maxPontos = opcoesPontuacao.reduce((max, opt) => Math.max(max, opt.pontos), 0);
      setPontosMaximo(maxPontos);
    } else {
      setPontosMaximo(0);
    }
  }, [tipo, opcoesPontuacao]);

  const handleAddOpcao = () => {
    if (!novaOpcaoLabel.trim()) {
      toast.error("Label é obrigatório");
      return;
    }
    setOpcoesPontuacao([...opcoesPontuacao, { label: novaOpcaoLabel, pontos: novaOpcaoPontos }]);
    setNovaOpcaoLabel("");
    setNovaOpcaoPontos(0);
  };

  const handleRemoveOpcao = (index: number) => {
    setOpcoesPontuacao(opcoesPontuacao.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!textoPergunta.trim()) {
      toast.error("Pergunta é obrigatória");
      return;
    }

    const secaoFinal = usarNovaSecao ? secao : secao;
    if (!secaoFinal.trim()) {
      toast.error("Seção é obrigatória");
      return;
    }

    if (tipo === "select_pontuado" && opcoesPontuacao.length < 2) {
      toast.error("Adicione pelo menos 2 opções para perguntas com pontuação");
      return;
    }

    const opcoesPontuacaoObj = opcoesPontuacao.length > 0
      ? opcoesPontuacao.reduce((acc, opt) => ({ ...acc, [opt.label]: opt.pontos }), {})
      : null;

    try {
      if (isEditing) {
        await updatePergunta.mutateAsync({
          id: pergunta.id,
          secao: secaoFinal,
          secao_icone: secaoIcone,
          pergunta: textoPergunta,
          tipo,
          pontos_maximo: pontosMaximo,
          obrigatoria,
          placeholder: placeholder || null,
          opcoes_pontuacao: opcoesPontuacaoObj,
        });
      } else {
        await createPergunta.mutateAsync({
          template_id: templateId,
          secao: secaoFinal,
          secao_icone: secaoIcone,
          ordem: proximaOrdem,
          pergunta: textoPergunta,
          tipo,
          pontos_maximo: pontosMaximo,
          obrigatoria,
          placeholder: placeholder || null,
          opcoes_pontuacao: opcoesPontuacaoObj,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const tipoPergunta = TIPOS_PERGUNTA_CHECKIN.find((t) => t.value === tipo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] !flex !flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isEditing ? "Editar Pergunta" : "Nova Pergunta"}
          </DialogTitle>
          <DialogDescription>
            Configure a pergunta e seu sistema de pontuação
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4">
            {/* Seção */}
            <div className="space-y-2">
              <Label>Seção</Label>
              {secoesExistentes.length > 0 && !usarNovaSecao ? (
                <div className="space-y-2">
                  <Select value={secao} onValueChange={setSecao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a seção" />
                    </SelectTrigger>
                    <SelectContent>
                      {secoesExistentes.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => {
                      setUsarNovaSecao(true);
                      setSecao("");
                    }}
                  >
                    + Criar nova seção
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select value={secaoIcone} onValueChange={setSecaoIcone}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICONES_SECAO.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={secao}
                      onChange={(e) => setSecao(e.target.value)}
                      placeholder="Nome da seção"
                      className="flex-1"
                    />
                  </div>
                  {secoesExistentes.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => {
                        setUsarNovaSecao(false);
                        setSecao(secoesExistentes[0]);
                      }}
                    >
                      Usar seção existente
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Pergunta */}
            <div className="space-y-2">
              <Label htmlFor="pergunta">Pergunta *</Label>
              <Input
                id="pergunta"
                value={textoPergunta}
                onChange={(e) => setTextoPergunta(e.target.value)}
                placeholder="Digite a pergunta..."
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Resposta</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PERGUNTA_CHECKIN.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                      {t.pontuavel && " ⭐"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tipoPergunta?.pontuavel && (
                <p className="text-xs text-muted-foreground">
                  ⭐ Este tipo de pergunta contribui para a pontuação do check-in
                </p>
              )}
            </div>

            {/* Opções pontuadas */}
            {tipo === "select_pontuado" && (
              <div className="space-y-3">
                <Label>Opções com Pontuação</Label>
                
                {opcoesPontuacao.map((opcao, index) => (
                  <Card key={index}>
                    <CardContent className="p-2 flex items-center justify-between">
                      <span>{opcao.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{opcao.pontos} pts</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleRemoveOpcao(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-2">
                  <Input
                    value={novaOpcaoLabel}
                    onChange={(e) => setNovaOpcaoLabel(e.target.value)}
                    placeholder="Ex: Ótimo"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={novaOpcaoPontos}
                    onChange={(e) => setNovaOpcaoPontos(parseInt(e.target.value) || 0)}
                    placeholder="Pontos"
                    className="w-20"
                  />
                  <Button variant="outline" size="icon" onClick={handleAddOpcao}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Pontuação máxima */}
            {tipoPergunta?.pontuavel && tipo !== "select_pontuado" && (
              <div className="space-y-2">
                <Label htmlFor="pontos">Pontos Máximos</Label>
                <Input
                  id="pontos"
                  type="number"
                  value={pontosMaximo}
                  onChange={(e) => setPontosMaximo(parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
            )}

            {/* Placeholder */}
            {(tipo === "texto" || tipo === "numero") && (
              <div className="space-y-2">
                <Label htmlFor="placeholder">Placeholder (opcional)</Label>
                <Input
                  id="placeholder"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="Texto de ajuda no campo"
                />
              </div>
            )}

            {/* Obrigatória */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Obrigatória</Label>
                <p className="text-sm text-muted-foreground">
                  O paciente deve responder esta pergunta
                </p>
              </div>
              <Switch checked={obrigatoria} onCheckedChange={setObrigatoria} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createPergunta.isPending || updatePergunta.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
