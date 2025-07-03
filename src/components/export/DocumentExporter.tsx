
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Download, FileText, Table } from "lucide-react";
import { DateRange } from "react-day-picker";
import jsPDF from 'jspdf';

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
      console.log('Exportando:', exportOptions);
      
      if (exportOptions.format === 'csv') {
        const csvContent = generateCSV(exportOptions.type);
        downloadFile(csvContent, `${exportOptions.type}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
      } else if (exportOptions.format === 'pdf') {
        generatePDF(exportOptions.type);
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

  const generatePDF = (type: string) => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    
    // Configuração do PDF
    doc.setFontSize(16);
    doc.text(`Relatório - ${getTypeLabel(type)}`, 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Data de exportação: ${date}`, 20, 30);
    
    // Headers baseados no tipo
    const headers = {
      contracts: ['Título', 'Cliente', 'Valor', 'Data Início', 'Status'],
      clients: ['Nome', 'Email', 'Telefone', 'Status', 'Data Cadastro'],
      financial: ['Descrição', 'Valor', 'Tipo', 'Data', 'Categoria'],
      tasks: ['Título', 'Responsável', 'Prazo', 'Status', 'Descrição']
    };
    
    // Dados de exemplo
    const sampleData = {
      contracts: [['Contrato Personal', 'João Silva', 'R$ 500,00', '15/01/2024', 'Ativo']],
      clients: [['Maria Santos', 'maria@email.com', '(11) 99999-9999', 'Ativo', '10/01/2024']],
      financial: [['Mensalidade Janeiro', 'R$ 150,00', 'Entrada', '01/01/2024', 'Mensalidades']],
      tasks: [['Follow-up Cliente', 'Personal Trainer', '20/01/2024', 'Pendente', 'Entrar em contato']]
    };
    
    // Cabeçalhos da tabela
    let yPos = 50;
    doc.setFontSize(8);
    const currentHeaders = headers[type as keyof typeof headers];
    const colWidth = 180 / currentHeaders.length;
    
    currentHeaders.forEach((header, index) => {
      doc.text(header, 20 + (index * colWidth), yPos);
    });
    
    // Linha separadora
    yPos += 5;
    doc.line(20, yPos, 200, yPos);
    
    // Dados da tabela
    yPos += 10;
    const currentData = sampleData[type as keyof typeof sampleData];
    currentData.forEach((row) => {
      row.forEach((cell, index) => {
        doc.text(cell, 20 + (index * colWidth), yPos);
      });
      yPos += 10;
    });
    
    // Rodapé
    doc.setFontSize(8);
    doc.text('Relatório gerado pelo sistema UniX360', 20, 280);
    
    // Download do PDF
    doc.save(`${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      contracts: 'Contratos',
      clients: 'Clientes', 
      financial: 'Financeiro',
      tasks: 'Tarefas'
    };
    return labels[type as keyof typeof labels] || type;
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
