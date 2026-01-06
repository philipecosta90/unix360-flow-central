import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  X 
} from 'lucide-react';
import {
  parseFile,
  autoDetectMapping,
  formatPhone,
  parseDate,
  validateRow,
  generateTemplate,
  mapStatus,
  softwareTemplates,
  type ImportedRow,
  type ColumnMapping,
  type ValidationResult,
} from '@/utils/importUtils';

interface ImportClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'importing' | 'complete';

export const ImportClientsDialog = ({ open, onOpenChange, onSuccess }: ImportClientsDialogProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedSoftware, setSelectedSoftware] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    nome: null,
    email: null,
    telefone: null,
    data_nascimento: null,
    plano_contratado: null,
    observacoes: null,
    status: null,
  });
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setStep('upload');
    setSelectedSoftware('');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({
      nome: null,
      email: null,
      telefone: null,
      data_nascimento: null,
      plano_contratado: null,
      observacoes: null,
      status: null,
    });
    setValidationResults([]);
    setImportProgress(0);
    setImportedCount(0);
    setErrorCount(0);
    setIsProcessing(false);
  }, []);

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.csv') && 
        !selectedFile.name.endsWith('.xlsx') &&
        !selectedFile.name.endsWith('.xls')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo CSV ou Excel (.xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setFile(selectedFile);

    try {
      const { headers: parsedHeaders, rows: parsedRows } = await parseFile(selectedFile);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      
      // Auto-detectar mapeamento
      const detectedMapping = autoDetectMapping(parsedHeaders, selectedSoftware || undefined);
      setMapping(detectedMapping);
      
      // Validar todas as linhas
      const existingEmails = new Set<string>();
      const results = parsedRows.map((row, index) => {
        const result = validateRow(row, detectedMapping, index, existingEmails);
        const email = detectedMapping.email ? row[detectedMapping.email] : undefined;
        if (email) existingEmails.add(email.toLowerCase());
        return result;
      });
      setValidationResults(results);
      
      setStep('mapping');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: 'Verifique se o arquivo está no formato correto',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  }, [selectedSoftware]);

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...mapping, [field]: value === '_none_' ? null : value };
    setMapping(newMapping);
    
    // Re-validar com novo mapeamento
    const existingEmails = new Set<string>();
    const results = rows.map((row, index) => {
      const result = validateRow(row, newMapping, index, existingEmails);
      const email = newMapping.email ? row[newMapping.email] : undefined;
      if (email) existingEmails.add(email.toLowerCase());
      return result;
    });
    setValidationResults(results);
  };

  const handleImport = async () => {
    if (!userProfile?.empresa_id) return;
    
    const validRows = validationResults.filter(r => r.valid);
    if (validRows.length === 0) {
      toast({
        title: 'Nenhum dado válido',
        description: 'Corrija os erros antes de importar',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImportProgress(0);
    setImportedCount(0);
    setErrorCount(0);

    const batchSize = 50;
    const batches: ImportedRow[][] = [];
    
    for (let i = 0; i < validRows.length; i += batchSize) {
      batches.push(validRows.slice(i, i + batchSize).map(r => r.row));
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        const clientsToInsert = batch.map(row => ({
          empresa_id: userProfile.empresa_id,
          nome: mapping.nome ? row[mapping.nome] || 'Sem nome' : 'Sem nome',
          email: mapping.email ? row[mapping.email] || null : null,
          telefone: mapping.telefone ? formatPhone(row[mapping.telefone]) : null,
          data_nascimento: mapping.data_nascimento ? parseDate(row[mapping.data_nascimento]) : null,
          plano_contratado: mapping.plano_contratado ? row[mapping.plano_contratado] || null : null,
          observacoes: mapping.observacoes ? row[mapping.observacoes] || null : null,
          status: mapping.status ? mapStatus(row[mapping.status]) : 'ativo' as const,
          tags: selectedSoftware ? [`Migrado do ${softwareTemplates[selectedSoftware]?.name || 'outro sistema'}`] : [],
        }));

        const { error } = await supabase
          .from('clientes')
          .insert(clientsToInsert);

        if (error) {
          console.error('Erro ao inserir batch:', error);
          failCount += batch.length;
        } else {
          successCount += batch.length;
        }
      } catch (error) {
        console.error('Erro no batch:', error);
        failCount += batch.length;
      }

      setImportProgress(((i + 1) / batches.length) * 100);
      setImportedCount(successCount);
      setErrorCount(failCount);
    }

    setStep('complete');
    
    if (successCount > 0) {
      toast({
        title: 'Importação concluída!',
        description: `${successCount} clientes importados com sucesso.`,
      });
      onSuccess();
    }
  };

  const handleDownloadTemplate = () => {
    const blob = generateTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_clientes.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = validationResults.filter(r => r.valid).length;
  const invalidCount = validationResults.filter(r => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Clientes
          </DialogTitle>
          <DialogDescription>
            Importe clientes de outros softwares através de planilhas CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                De qual software você está migrando? (opcional)
              </label>
              <Select value={selectedSoftware} onValueChange={setSelectedSoftware}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o software de origem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dietbox">Dietbox</SelectItem>
                  <SelectItem value="liveclin">Liveclin</SelectItem>
                  <SelectItem value="webdiet">Webdiet</SelectItem>
                  <SelectItem value="primecoaching">Primecoaching</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecionar o software ajuda a mapear as colunas automaticamente
              </p>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">Processando arquivo...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Arraste seu arquivo aqui</p>
                  <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos: .csv, .xlsx, .xls | Máximo: 5MB
                  </p>
                </>
              )}
            </div>

            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Baixar modelo de planilha
            </Button>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">{rows.length} linhas encontradas</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {validCount} válidos
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="text-red-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {invalidCount} com erros
                  </Badge>
                )}
              </div>
            </div>

            {/* Preview das primeiras linhas */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.slice(0, 5).map((header, i) => (
                      <TableHead key={i} className="whitespace-nowrap">{header}</TableHead>
                    ))}
                    {headers.length > 5 && <TableHead>...</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 3).map((row, i) => (
                    <TableRow key={i}>
                      {headers.slice(0, 5).map((header, j) => (
                        <TableCell key={j} className="whitespace-nowrap max-w-[200px] truncate">
                          {row[header] || '-'}
                        </TableCell>
                      ))}
                      {headers.length > 5 && <TableCell>...</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mapeamento de colunas */}
            <div>
              <h3 className="font-medium mb-3">Mapeamento de Colunas</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'nome' as const, label: 'Nome *', required: true },
                  { key: 'email' as const, label: 'E-mail' },
                  { key: 'telefone' as const, label: 'Telefone' },
                  { key: 'data_nascimento' as const, label: 'Data de Nascimento' },
                  { key: 'plano_contratado' as const, label: 'Plano' },
                  { key: 'observacoes' as const, label: 'Observações' },
                ].map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-sm w-40">{label}</span>
                    <span className="text-muted-foreground">→</span>
                    <Select
                      value={mapping[key] || '_none_'}
                      onValueChange={(v) => handleMappingChange(key, v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none_">Não importar</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {invalidCount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidCount} linha(s) com erros serão ignoradas na importação.
                  {validationResults.filter(r => !r.valid).slice(0, 3).map((r, i) => (
                    <div key={i} className="text-xs mt-1">
                      Linha {r.index + 2}: {r.errors.join(', ')}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validCount === 0 || !mapping.nome}
                className="bg-[#43B26D] hover:bg-[#37A05B]"
              >
                Importar {validCount} clientes
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Importando clientes...</p>
              <p className="text-sm text-muted-foreground">
                {importedCount} de {validCount} importados
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-xl font-medium">Importação Concluída!</p>
              <div className="flex justify-center gap-4 mt-4">
                <Badge variant="outline" className="text-green-600 text-lg py-1 px-3">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {importedCount} importados
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="outline" className="text-red-600 text-lg py-1 px-3">
                    <X className="w-4 h-4 mr-1" />
                    {errorCount} erros
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={handleClose} className="w-full bg-[#43B26D] hover:bg-[#37A05B]">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
