import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { File, Download, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ContractDocumentUploadDialog } from "./ContractDocumentUploadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContractDocument {
  id: string;
  nome: string;
  tipo_arquivo?: string;
  tamanho?: number;
  url_arquivo?: string;
  created_at: string;
}

interface ContractDocumentsListProps {
  contractId: string;
}

export const ContractDocumentsList = ({ contractId }: ContractDocumentsListProps) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const fetchDocuments = async () => {
    if (!userProfile?.empresa_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contratos_documentos')
        .select('*')
        .eq('contrato_id', contractId)
        .eq('empresa_id', userProfile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar documentos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os documentos.",
          variant: "destructive",
        });
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: ContractDocument) => {
    if (!doc.url_arquivo) {
      toast({
        title: "Erro",
        description: "URL do arquivo não encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(doc.url_arquivo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.nome;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('contratos_documentos')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Erro ao excluir documento:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o documento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso!",
      });

      fetchDocuments();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Tamanho desconhecido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchDocuments();
  }, [contractId, userProfile?.empresa_id]);

  if (loading) {
    return <div className="text-muted-foreground">Carregando documentos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documentos do Contrato</h3>
        <Button onClick={() => setShowUploadDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Documento
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento anexado a este contrato.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{document.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(document.tamanho)} • {new Date(document.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir documento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o documento "{document.nome}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(document.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContractDocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        contractId={contractId}
        onDocumentAdded={fetchDocuments}
      />
    </div>
  );
};