import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseTBCA_CSV, parseTACO_Excel, AlimentoImportado } from '@/utils/alimentosImportParser';

interface AlimentosImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'processing' | 'inserting' | 'done' | 'error';

export function AlimentosImportDialog({ open, onOpenChange, onSuccess }: AlimentosImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ total: number; inserido: number; erros: string[] } | null>(null);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setStep('processing');
    setProgress(10);
    setMessage('Lendo arquivos...');
    
    try {
      const allAlimentos: AlimentoImportado[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setMessage(`Processando ${file.name}...`);
        setProgress(10 + (i / files.length) * 40);
        
        if (file.name.endsWith('.csv')) {
          // CSV (TBCA)
          const text = await file.text();
          const alimentos = parseTBCA_CSV(text);
          allAlimentos.push(...alimentos);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Excel (TACO)
          const buffer = await file.arrayBuffer();
          const alimentos = await parseTACO_Excel(buffer);
          allAlimentos.push(...alimentos);
        }
      }
      
      if (allAlimentos.length === 0) {
        throw new Error('Nenhum alimento encontrado nos arquivos');
      }
      
      setProgress(50);
      setMessage(`${allAlimentos.length} alimentos encontrados. Inserindo no banco...`);
      setStep('inserting');
      
      // Inserir via Edge Function
      const { data, error } = await supabase.functions.invoke('import-alimentos', {
        body: { tipo: 'raw', dados: allAlimentos }
      });
      
      if (error) throw error;
      
      setProgress(100);
      setStep('done');
      setResult({
        total: allAlimentos.length,
        inserido: data.totalInserido || 0,
        erros: data.erros || []
      });
      
      toast.success(`${data.totalInserido} alimentos importados com sucesso!`);
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Erro na importação:', error);
      setStep('error');
      setMessage(error.message || 'Erro ao importar alimentos');
      toast.error('Erro ao importar alimentos');
    }
  };
  
  const handleClose = () => {
    setStep('upload');
    setProgress(0);
    setMessage('');
    setResult(null);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Alimentos
          </DialogTitle>
          <DialogDescription>
            Importe alimentos das tabelas TACO ou TBCA para a base de dados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Clique para selecionar arquivos</p>
                  <p className="text-xs text-muted-foreground">
                    CSV (TBCA) ou Excel (TACO)
                  </p>
                </Label>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Formatos suportados:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  <li>CSV da TBCA (Tabela Brasileira de Composição de Alimentos)</li>
                  <li>Excel da TACO (Tabela de Composição de Alimentos)</li>
                </ul>
              </div>
            </div>
          )}
          
          {(step === 'processing' || step === 'inserting') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">{message}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {step === 'done' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium">Importação concluída!</span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>Total processado:</strong> {result.total} alimentos</p>
                <p><strong>Inseridos:</strong> {result.inserido} alimentos</p>
                {result.erros.length > 0 && (
                  <div className="text-destructive">
                    <p><strong>Erros:</strong></p>
                    <ul className="list-disc list-inside text-xs mt-1">
                      {result.erros.slice(0, 3).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {result.erros.length > 3 && (
                        <li>...e mais {result.erros.length - 3} erros</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </div>
          )}
          
          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <span className="font-medium">Erro na importação</span>
              </div>
              
              <p className="text-sm text-muted-foreground">{message}</p>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={() => setStep('upload')} className="flex-1">
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
