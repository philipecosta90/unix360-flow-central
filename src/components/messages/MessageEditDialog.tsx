import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppMessage } from '@/hooks/useWhatsAppMessages';

interface MessageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: WhatsAppMessage | undefined;
  config?: {
    tipo: string;
    titulo: string;
    descricao: string;
    icone: string;
    variaveis: string[];
    conteudoPadrao: string;
  } | null;
  isSystemMessage?: boolean;
  onSave: (conteudo: string) => Promise<boolean>;
  onToggleActive: (ativo: boolean) => Promise<boolean>;
  saving: boolean;
}

const EXAMPLE_VALUES: Record<string, string> = {
  clienteNome: 'João Silva',
  nomeEmpresa: 'Studio Fitness',
  link: 'https://app.unix360.com.br/anamnese/preencher/abc123',
  nomeTemplate: 'Check-in Semanal',
  dataAtual: new Date().toLocaleDateString('pt-BR'),
  telefone: '(11) 99999-9999',
  email: 'cliente@email.com',
};

export const MessageEditDialog = ({
  open,
  onOpenChange,
  message,
  config,
  isSystemMessage = true,
  onSave,
  onToggleActive,
  saving,
}: MessageEditDialogProps) => {
  const [conteudo, setConteudo] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [activeTab, setActiveTab] = useState('editar');

  // Get display values
  const displayIcon = message?.icone || config?.icone || '📩';
  const displayTitle = message?.titulo || config?.titulo || 'Editar Mensagem';
  const displayDescription = message?.descricao || config?.descricao || '';
  const displayVariables = message?.variaveis_disponiveis || config?.variaveis || [];
  const defaultContent = config?.conteudoPadrao || '';

  useEffect(() => {
    if (open) {
      setConteudo(message?.conteudo || defaultContent);
      setAtivo(message?.ativo ?? true);
    }
  }, [open, message, defaultContent]);

  const handleSave = async () => {
    const success = await onSave(conteudo);
    if (success) {
      if (message && message.ativo !== ativo) {
        await onToggleActive(ativo);
      }
      onOpenChange(false);
    }
  };

  const insertVariable = (variable: string) => {
    setConteudo((prev) => prev + `{${variable}}`);
  };

  const getPreview = () => {
    let preview = conteudo;
    displayVariables.forEach((variable) => {
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      preview = preview.replace(regex, EXAMPLE_VALUES[variable] || `[${variable}]`);
    });
    return preview;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{displayIcon}</span>
            {displayTitle}
            {!isSystemMessage && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Personalizada
              </Badge>
            )}
          </DialogTitle>
          {displayDescription && (
            <DialogDescription>{displayDescription}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="ativo">Envio automático</Label>
              <p className="text-sm text-muted-foreground">
                Quando desativado, esta mensagem não será enviada automaticamente
              </p>
            </div>
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
          </div>

          {/* Tabs for Edit/Preview */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editar">Editar</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editar" className="space-y-3">
              {/* Variables */}
              {displayVariables.length > 0 && (
                <div>
                  <Label className="mb-2 block">Variáveis disponíveis</Label>
                  <div className="flex flex-wrap gap-2">
                    {displayVariables.map((variable) => (
                      <Badge
                        key={variable}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => insertVariable(variable)}
                      >
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Clique para inserir no final da mensagem
                  </p>
                </div>
              )}

              {/* Content Editor */}
              <div>
                <Label htmlFor="conteudo">Conteúdo da mensagem</Label>
                <Textarea
                  id="conteudo"
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  className="mt-1.5 min-h-[250px] font-mono text-sm"
                  placeholder="Digite sua mensagem..."
                />
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="rounded-lg bg-muted/50 p-4">
                <Label className="mb-2 block">Preview com dados de exemplo</Label>
                <div className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm">
                  {getPreview()}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
