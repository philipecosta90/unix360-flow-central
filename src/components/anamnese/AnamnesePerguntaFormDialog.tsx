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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { AnamnesePergunta } from "@/hooks/useAnamnese";

const ICONES_SECAO = [
  { value: "👤", label: "Pessoa" },
  { value: "🎯", label: "Alvo" },
  { value: "🍽️", label: "Alimentação" },
  { value: "⚠️", label: "Alerta" },
  { value: "😴", label: "Sono" },
  { value: "💬", label: "Conversa" },
  { value: "💪", label: "Treino" },
  { value: "❤️", label: "Saúde" },
  { value: "📋", label: "Lista" },
  { value: "🏃", label: "Exercício" },
  { value: "🧠", label: "Mente" },
  { value: "💊", label: "Medicamento" },
];

const TIPOS_PERGUNTA = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "email", label: "E-mail" },
  { value: "select", label: "Seleção (escolha única)" },
];

interface AnamnesePerguntaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pergunta?: AnamnesePergunta | null;
  defaultSecao?: string;
  secoesExistentes?: string[];
  onSave: (data: {
    secao: string;
    secao_icone?: string;
    pergunta: string;
    tipo: string;
    obrigatoria: boolean;
    placeholder?: string;
    opcoes?: string[];
  }) => void;
}

export function AnamnesePerguntaFormDialog({
  open,
  onOpenChange,
  pergunta,
  defaultSecao = "",
  secoesExistentes = [],
  onSave,
}: AnamnesePerguntaFormDialogProps) {
  const [secao, setSecao] = useState("");
  const [secaoIcone, setSecaoIcone] = useState("");
  const [textoPergunta, setTextoPergunta] = useState("");
  const [tipo, setTipo] = useState("text");
  const [obrigatoria, setObrigatoria] = useState(true);
  const [placeholder, setPlaceholder] = useState("");
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const [novaOpcao, setNovaOpcao] = useState("");
  const [usarNovaSecao, setUsarNovaSecao] = useState(false);

  const isEditing = !!pergunta;

  useEffect(() => {
    if (open) {
      if (pergunta) {
        setSecao(pergunta.secao);
        setSecaoIcone(pergunta.secao_icone || "");
        setTextoPergunta(pergunta.pergunta);
        setTipo(pergunta.tipo);
        setObrigatoria(pergunta.obrigatoria ?? true);
        setPlaceholder(pergunta.placeholder || "");
        
        // Parse opcoes
        if (pergunta.opcoes) {
          try {
            const parsed = typeof pergunta.opcoes === 'string' 
              ? JSON.parse(pergunta.opcoes) 
              : pergunta.opcoes;
            setOpcoes(Array.isArray(parsed) ? parsed : []);
          } catch {
            setOpcoes([]);
          }
        } else {
          setOpcoes([]);
        }
        setUsarNovaSecao(false);
      } else {
        setSecao(defaultSecao);
        setSecaoIcone("");
        setTextoPergunta("");
        setTipo("text");
        setObrigatoria(true);
        setPlaceholder("");
        setOpcoes([]);
        setUsarNovaSecao(!defaultSecao && secoesExistentes.length === 0);
      }
    }
  }, [open, pergunta, defaultSecao, secoesExistentes]);

  const handleAddOpcao = () => {
    if (novaOpcao.trim() && !opcoes.includes(novaOpcao.trim())) {
      setOpcoes([...opcoes, novaOpcao.trim()]);
      setNovaOpcao("");
    }
  };

  const handleRemoveOpcao = (index: number) => {
    setOpcoes(opcoes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!secao.trim() || !textoPergunta.trim()) return;

    onSave({
      secao: secao.trim(),
      secao_icone: secaoIcone || undefined,
      pergunta: textoPergunta.trim(),
      tipo,
      obrigatoria,
      placeholder: placeholder.trim() || undefined,
      opcoes: tipo === "select" ? opcoes : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Pergunta" : "Nova Pergunta"}
          </DialogTitle>
          <DialogDescription>
            Configure os detalhes da pergunta do questionário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seção */}
          <div className="space-y-2">
            <Label>Seção *</Label>
            {secoesExistentes.length > 0 && !usarNovaSecao ? (
              <div className="space-y-2">
                <Select value={secao} onValueChange={setSecao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma seção" />
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
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
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
                      <SelectValue placeholder="🔹" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICONES_SECAO.map((icone) => (
                        <SelectItem key={icone.value} value={icone.value}>
                          {icone.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Nome da seção (ex: Dados Pessoais)"
                    value={secao}
                    onChange={(e) => setSecao(e.target.value)}
                    className="flex-1"
                  />
                </div>
                {secoesExistentes.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setUsarNovaSecao(false)}
                  >
                    Usar seção existente
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pergunta */}
          <div className="space-y-2">
            <Label htmlFor="pergunta">Texto da Pergunta *</Label>
            <Input
              id="pergunta"
              placeholder="Ex: Qual o seu objetivo com a consultoria?"
              value={textoPergunta}
              onChange={(e) => setTextoPergunta(e.target.value)}
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
                {TIPOS_PERGUNTA.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opções para select */}
          {tipo === "select" && (
            <div className="space-y-2">
              <Label>Opções de Resposta</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma opção"
                  value={novaOpcao}
                  onChange={(e) => setNovaOpcao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOpcao();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddOpcao}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {opcoes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {opcoes.map((opcao, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {opcao}
                      <button
                        type="button"
                        onClick={() => handleRemoveOpcao(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placeholder */}
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder (opcional)</Label>
            <Input
              id="placeholder"
              placeholder="Ex: Digite sua resposta aqui..."
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
            />
          </div>

          {/* Obrigatória */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="obrigatoria"
              checked={obrigatoria}
              onCheckedChange={(checked) => setObrigatoria(checked === true)}
            />
            <Label htmlFor="obrigatoria" className="text-sm font-normal cursor-pointer">
              Pergunta obrigatória
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!secao.trim() || !textoPergunta.trim()}
          >
            {isEditing ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
