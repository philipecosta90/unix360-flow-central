import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, X } from "lucide-react";

interface ClientAvatarUploadProps {
  currentUrl?: string | null;
  clientName: string;
  clientId?: string;
  onUpload: (url: string | null) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const ClientAvatarUpload = ({
  currentUrl,
  clientName,
  clientId,
  onUpload,
  disabled = false,
  size = "md",
}: ClientAvatarUploadProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const buttonSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Selecione uma imagem JPG, PNG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Mostrar preview local imediatamente
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Fazer upload
    await uploadFile(file);

    // Limpar input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = clientId 
        ? `${userProfile.empresa_id}/${clientId}.${fileExt}`
        : `${userProfile.empresa_id}/temp_${Date.now()}.${fileExt}`;

      // Upload para o bucket
      const { data, error } = await supabase.storage
        .from("client-avatars")
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
        });

      if (error) throw error;

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from("client-avatars")
        .getPublicUrl(data.path);

      // Adicionar timestamp para evitar cache
      const urlWithTimestamp = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      
      onUpload(urlWithTimestamp);
      setPreviewUrl(null);

      toast({
        title: "Foto atualizada!",
        description: "A foto de perfil foi salva com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      setPreviewUrl(null);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    onUpload(null);
    setPreviewUrl(null);
    toast({
      title: "Foto removida",
      description: "A foto de perfil foi removida.",
    });
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
        {displayUrl && (
          <AvatarImage 
            src={displayUrl} 
            alt={clientName}
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
          {uploading ? (
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
          ) : (
            getInitials(clientName || "?")
          )}
        </AvatarFallback>
      </Avatar>

      {/* Botão de upload */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={`absolute -bottom-1 -right-1 ${buttonSizes[size]} rounded-full shadow-md border border-border`}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : (
          <Camera className={iconSizes[size]} />
        )}
      </Button>

      {/* Botão de remover foto (se tiver foto) */}
      {displayUrl && !uploading && (
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className={`absolute -top-1 -right-1 h-5 w-5 rounded-full shadow-md`}
          onClick={handleRemovePhoto}
          disabled={disabled}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
