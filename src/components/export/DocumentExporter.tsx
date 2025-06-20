
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Download, FileText, Table } from "lucide-react";
import { DateRange } from "react-day-picker";

interface ExportOptions {
  type: 'contracts' | 'clients' | 'financial' | 'tasks';
  format: 'csv' | 'pdf';
  dateRange?: DateRange;
}

export const DocumentExporter = () => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    type: 'contracts',
    format: 'csv'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simular exportação - aqui você implementaria a lógica real
      console.log('Exportando:', exportOptions);
      
      // Exemplo de geração de CSV
      if (exportOptions.format === 'csv') {
        const csvContent = generateCSV(exportOptions.type);
        downloadFile(csvContent, `${exportOptions.type}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      } else {
        // Para PDF, você usaria uma biblioteca como jsPDF ou react-pdf
        console.log('Exportação PDF em desenvolvimento');
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (type: string) => {
    // Exemplo básico de geração de CSV
    const headers = {
      contracts: 'Título,Cliente,Valor,Data Início,Status',
      clients: 'Nome,Email,Telefone,Status,Data Cadastro',
      financial: 'Descrição,Valor,Tipo,Data,Categoria',
      tasks: 'Título,Responsável,Prazo,Status,Descrição'
    };

    const sampleData = {
      contracts: 'Contrato Personal,João Silva,R$ 500.00,2024-01-15,Ativo',
      clients: 'Maria Santos,maria@email.com,(11) 99999-9999,Ativo,2024-01-10',
      financial: 'Mensalidade Janeiro,R$ 150.00,Entrada,2024-01-01,Mensalidades',
      tasks: 'Follow-up Cliente,Personal Trainer,2024-01-20,Pendente,Entrar em contato'
    };

    return `${headers[type as keyof typeof headers]}\n${sampleData[type as keyof typeof sampleData]}`;
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportar Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Dados</label>
            <Select 
              value={exportOptions.type} 
              onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">Contratos</SelectItem>
                <SelectItem value="clients">Clientes</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="tasks">Tarefas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <Select 
              value={exportOptions.format} 
              onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Período (opcional)</label>
          <DatePickerWithRange
            date={exportOptions.dateRange}
            onDateChange={(dateRange) => setExportOptions(prev => ({ ...prev, dateRange }))}
          />
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
        >
          {isExporting ? (
            "Exportando..."
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar {exportOptions.format.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
