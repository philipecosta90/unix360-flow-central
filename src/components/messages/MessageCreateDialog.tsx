import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MessageCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    titulo: string;
    tipo: string;
    conteudo: string;
    variaveis_disponiveis: string[];
    icone: string;
    descricao: string;
  }) => Promise<boolean>;
  saving: boolean;
}

const AVAILABLE_EMOJIS = ['📩', '🎂', '📢', '💬', '⭐', '🎉', '📝', '💡', '🔔', '❤️', '👏', '🙏'];

const AVAILABLE_VARIABLES = [
  { key: 'clienteNome', label: 'Nome do Cliente' },
  { key: 'nomeEmpresa', label: 'Nome da Empresa' },
  { key: 'dataAtual', label: 'Data Atual' },
  { key: 'telefone', label: 'Telefone do Cliente' },
  { key: 'email', label: 'Email do Cliente' },
];

export const MessageCreateDialog = ({
  open,
  onOpenChange,
  onSave,
  saving,
}: MessageCreateDialogProps) => {
  const [titulo, setTitulo] = useState('');
  const [icone, setIcone] = useState('📩');
  const [descricao, setDescricao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<string[]>(['clienteNome', 'nomeEmpresa']);
  const [activeTab, setActiveTab] = useState('editor');

  const generateTipo = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const toggleVariable = (key: string) => {
    setSelectedVariables((prev) =>
      prev.includes(key) ? prev.filter((v) => v !== key) : [...prev, key]
    );
  };

  const insertVariable = (key: string) => {
    setConteudo((prev) => prev + `{${key}}`);
  };

  const getPreview = () => {
    let preview = conteudo;
    const examples: Record<string, string> = {
      clienteNome: 'João Silva',
      nomeEmpresa: 'Minha Empresa',
      dataAtual: new Date().toLocaleDateString('pt-BR'),
      telefone: '(11) 99999-9999',
      email: 'cliente@email.com',
    };

    Object.entries(examples).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return preview;
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      return;
    }

    const success = await onSave({
      titulo: titulo.trim(),
      tipo: generateTipo(titulo),
      conteudo: conteudo.trim() || `Olá {clienteNome}!\n\n${titulo}\n\nEquipe {nomeEmpresa}`,
      variaveis_disponiveis: selectedVariables,
      icone,
      descricao: descricao.trim(),
    });

    if (success) {
      setTitulo('');
      setIcone('📩');
      setDescricao('');
      setConteudo('');
      setSelectedVariables(['clienteNome', 'nomeEmpresa']);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setTitulo('');
    setIcone('📩');
    setDescricao('');
    setConteudo('');
    setSelectedVariables(['clienteNome', 'nomeEmpresa']);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{icone}</span>
            Nova Mensagem Personalizada
          </DialogTitle>
          <DialogDescription>
            Crie uma nova mensagem para enviar aos seus clientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título e Ícone */}
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Mensagem *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Feliz Aniversário!"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-1 max-w-[180px]">
                {AVAILABLE_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcone(emoji)}
                    className={`p-1.5 text-lg rounded hover:bg-muted ${
                      icone === emoji ? 'bg-primary/10 ring-1 ring-primary' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Mensagem enviada no aniversário do cliente"
            />
          </div>

          {/* Variáveis */}
          <div className="space-y-2">
            <Label>Variáveis Disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map((v) => (
                <Badge
                  key={v.key}
                  variant={selectedVariables.includes(v.key) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleVariable(v.key)}
                >
                  {`{${v.key}}`} - {v.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Conteúdo com Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="editor" className="flex-1">
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">
                Prévia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-2">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedVariables.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(key)}
                    >
                      + {`{${key}}`}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  placeholder={`Olá {clienteNome}!\n\nDigite sua mensagem aqui...\n\nEquipe {nomeEmpresa}`}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-2">
              <div className="rounded-lg bg-muted/50 p-4 min-h-[200px]">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {getPreview() || 'Digite o conteúdo da mensagem para ver a prévia'}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !titulo.trim()}>
            {saving ? 'Salvando...' : 'Criar Mensagem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
