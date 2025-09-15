
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onDocumentAdded: () => void;
}

export const DocumentUploadDialog = ({ open, onOpenChange, clientId, onDocumentAdded }: DocumentUploadDialogProps) => {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileName.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e informe o nome do documento.",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Usuário não possui empresa associada.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Upload do arquivo para o Supabase Storage
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName_sanitized = fileName.replace(/[^a-zA-Z0-9-_\.]/g, '');  
      const filePath = `${userProfile.empresa_id}/${clientId}/${Date.now()}-${fileName_sanitized}.${fileExtension}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        throw uploadError;
      }

      // Obter URL pública do arquivo
      const { data } = supabase.storage
        .from('client-documents')
        .getPublicUrl(filePath);
      
      // Inserir documento na tabela cliente_documentos
      const { error } = await (supabase as any)
        .from('cliente_documentos')
        .insert([{
          empresa_id: userProfile.empresa_id,
          cliente_id: clientId,
          nome: fileName,
          tipo_arquivo: selectedFile.type,
          tamanho: selectedFile.size,
          url_arquivo: data.publicUrl,
          created_by: userProfile.id
        }]);

      if (error) {
        console.error('Erro ao salvar documento:', error);
        throw error;
      }
      
      toast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso!",
      });

      setSelectedFile(null);
      setFileName("");
      onOpenChange(false);
      onDocumentAdded();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload do documento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Documento</Label>
            <Input
              id="nome"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Nome do documento"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="arquivo">Arquivo</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="arquivo" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {selectedFile ? selectedFile.name : "Clique para selecionar um arquivo"}
                  </span>
                  <input
                    id="arquivo"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#43B26D] hover:bg-[#37A05B]">
              {loading ? "Enviando..." : "Adicionar Documento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
