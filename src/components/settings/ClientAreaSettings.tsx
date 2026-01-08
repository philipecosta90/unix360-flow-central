import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload, Palette, Eye, Building2 } from "lucide-react";

interface EmpresaConfig {
  nome: string;
  nome_exibicao: string | null;
  logo_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
}

export const ClientAreaSettings = () => {
  const { userProfile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<EmpresaConfig>({
    nome: "",
    nome_exibicao: null,
    logo_url: null,
    cor_primaria: "#43B26D",
    cor_secundaria: "#37A05B",
  });

  // Carregar configurações atuais
  useEffect(() => {
    const fetchConfig = async () => {
      if (!userProfile?.empresa_id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("empresas")
          .select("nome, nome_exibicao, logo_url, cor_primaria, cor_secundaria")
          .eq("id", userProfile.empresa_id)
          .single();

        if (error) throw error;
        
        setConfig({
          nome: data.nome || "",
          nome_exibicao: data.nome_exibicao,
          logo_url: data.logo_url,
          cor_primaria: data.cor_primaria || "#43B26D",
          cor_secundaria: data.cor_secundaria || "#37A05B",
        });
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
        toast.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [userProfile?.empresa_id]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.empresa_id) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userProfile.empresa_id}/logo.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      // Adicionar timestamp para evitar cache
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from("empresas")
        .update({ logo_url: logoUrl })
        .eq("id", userProfile.empresa_id);

      if (updateError) {
        console.error("Erro ao atualizar logo no banco:", updateError);
        toast.error("Erro ao salvar logo. Verifique suas permissões.");
        return;
      }

      setConfig(prev => ({ ...prev, logo_url: logoUrl }));
      toast.success("Logo atualizada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao fazer upload:", err);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile?.empresa_id) {
      toast.error("Perfil não encontrado. Faça login novamente.");
      return;
    }

    setSaving(true);
    try {
      const { error, data } = await supabase
        .from("empresas")
        .update({
          nome_exibicao: config.nome_exibicao || null,
          cor_primaria: config.cor_primaria,
          cor_secundaria: config.cor_secundaria,
        })
        .eq("id", userProfile.empresa_id)
        .select("nome_exibicao, cor_primaria, cor_secundaria")
        .single();

      if (error) {
        console.error("Erro RLS ao salvar:", error);
        toast.error("Erro ao salvar. Verifique suas permissões de administrador.");
        return;
      }

      // Atualizar estado com dados confirmados do banco
      if (data) {
        setConfig(prev => ({
          ...prev,
          nome_exibicao: data.nome_exibicao,
          cor_primaria: data.cor_primaria || "#43B26D",
          cor_secundaria: data.cor_secundaria || "#37A05B",
        }));
      }
      
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const displayName = config.nome_exibicao || config.nome;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map(n => n[0])
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Área do Cliente</h2>
        <p className="text-muted-foreground">
          Personalize a aparência das páginas que seus clientes veem ao preencher anamneses e check-ins
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configurações */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Logo / Foto de Perfil
              </CardTitle>
              <CardDescription>
                Esta imagem será exibida nas páginas de anamnese e check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={config.logo_url || undefined} alt="Logo" />
                  <AvatarFallback 
                    className="text-xl font-semibold"
                    style={{ backgroundColor: config.cor_primaria, color: "white" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Alterar imagem"
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP. Máximo 2MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nome de Exibição */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nome de Exibição
              </CardTitle>
              <CardDescription>
                Nome que será mostrado aos seus clientes (deixe vazio para usar o nome da empresa)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={config.nome_exibicao || ""}
                onChange={(e) => setConfig(prev => ({ ...prev, nome_exibicao: e.target.value }))}
                placeholder={config.nome}
              />
            </CardContent>
          </Card>

          {/* Cores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cores do Tema
              </CardTitle>
              <CardDescription>
                Personalize as cores que aparecem nas páginas públicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.cor_primaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, cor_primaria: e.target.value }))}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.cor_primaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, cor_primaria: e.target.value }))}
                      className="flex-1"
                      placeholder="#43B26D"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.cor_secundaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                      className="h-10 w-14 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.cor_secundaria}
                      onChange={(e) => setConfig(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                      className="flex-1"
                      placeholder="#37A05B"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configurações"
            )}
          </Button>
        </div>

        {/* Preview */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pré-visualização
            </CardTitle>
            <CardDescription>
              Veja como seus clientes verão as páginas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg overflow-hidden border"
              style={{ 
                background: `linear-gradient(135deg, ${config.cor_primaria}15, ${config.cor_secundaria}10)` 
              }}
            >
              {/* Header Preview */}
              <div className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage src={config.logo_url || undefined} alt="Logo" />
                    <AvatarFallback 
                      className="text-lg font-semibold"
                      style={{ backgroundColor: config.cor_primaria, color: "white" }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="font-bold text-lg">{displayName}</h3>
              </div>

              {/* Content Preview */}
              <div className="bg-white p-4 space-y-3">
                <div 
                  className="h-3 rounded-full w-3/4 mx-auto"
                  style={{ backgroundColor: config.cor_primaria + "30" }}
                />
                <div 
                  className="h-3 rounded-full w-1/2 mx-auto"
                  style={{ backgroundColor: config.cor_primaria + "20" }}
                />
                
                <div className="pt-4">
                  <button
                    className="w-full py-3 px-4 rounded-lg text-white font-medium text-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${config.cor_primaria}, ${config.cor_secundaria})` 
                    }}
                  >
                    Enviar Respostas
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};