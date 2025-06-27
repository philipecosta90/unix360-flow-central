
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Image, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const LogoSettings = () => {
  const [logo, setLogo] = useState<string | null>(
    localStorage.getItem('company_logo')
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { userProfile } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione apenas arquivos de imagem");
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setIsUploading(true);

    try {
      // Converter para base64 para armazenar no localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        localStorage.setItem('company_logo', base64String);
        setLogo(base64String);
        toast.success("Logomarca carregada com sucesso!");
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Erro ao processar a imagem");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error);
      toast.error("Erro ao carregar a logomarca");
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    localStorage.removeItem('company_logo');
    setLogo(null);
    toast.success("Logomarca removida");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logomarca da Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Logomarca atual</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {logo ? (
              <div className="space-y-3">
                <img
                  src={logo}
                  alt="Logomarca"
                  className="h-16 mx-auto object-contain"
                />
                <p className="text-sm text-gray-600">Logomarca carregada</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Image className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">Nenhuma logomarca carregada</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Especificações recomendadas:</Label>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Formato: PNG, JPG ou SVG</li>
            <li>• Tamanho máximo: 2MB</li>
            <li>• Dimensões recomendadas: 400x100px</li>
            <li>• Fundo transparente (PNG) para melhor resultado</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {logo ? 'Alterar Logomarca' : 'Carregar Logomarca'}
              </>
            )}
          </Button>

          {logo && (
            <Button
              variant="outline"
              onClick={handleRemoveLogo}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
