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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ICONES_SECAO = [
  { value: "📋", label: "📋 Geral" },
  { value: "💪", label: "💪 Treino" },
  { value: "🍽️", label: "🍽️ Alimentação" },
  { value: "😴", label: "😴 Sono" },
  { value: "💧", label: "💧 Hidratação" },
  { value: "🎯", label: "🎯 Objetivos" },
  { value: "⚡", label: "⚡ Energia" },
  { value: "🧠", label: "🧠 Mental" },
  { value: "❤️", label: "❤️ Saúde" },
  { value: "📊", label: "📊 Métricas" },
  { value: "📝", label: "📝 Observações" },
  { value: "⭐", label: "⭐ Avaliação" },
];

interface SecaoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secao: string;
  icone: string | null;
  onSave: (novoNome: string, novoIcone: string | null) => void;
  isLoading?: boolean;
}

export const SecaoEditDialog = ({
  open,
  onOpenChange,
  secao,
  icone,
  onSave,
  isLoading,
}: SecaoEditDialogProps) => {
  const [nome, setNome] = useState(secao);
  const [iconeValue, setIconeValue] = useState(icone || "");

  useEffect(() => {
    if (open) {
      setNome(secao);
      setIconeValue(icone || "none");
    }
  }, [open, secao, icone]);

  const handleSave = () => {
    if (!nome.trim()) return;
    onSave(nome.trim(), iconeValue === "none" ? null : iconeValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Seção</DialogTitle>
          <DialogDescription>
            Altere o nome e ícone da seção. Todas as perguntas desta seção serão atualizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="secao-nome">Nome da Seção</Label>
            <Input
              id="secao-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Treino, Alimentação..."
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <Select value={iconeValue} onValueChange={setIconeValue}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ícone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem ícone</SelectItem>
                {ICONES_SECAO.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nome.trim() || isLoading}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
