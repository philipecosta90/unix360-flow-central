import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";

interface ProfileData {
  nome: string;
  sobrenome: string;
  telefone: string;
  cargo: string;
  email: string;
}

export function ProfileSettings() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    nome: "",
    sobrenome: "",
    telefone: "",
    cargo: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("perfis")
        .select("nome, sobrenome, telefone, cargo, email")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          nome: data.nome || "",
          sobrenome: data.sobrenome || "",
          telefone: data.telefone || "",
          cargo: data.cargo || "",
          email: data.email || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.nome.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({
          nome: profile.nome.trim(),
          sobrenome: profile.sobrenome?.trim() || null,
          telefone: profile.telefone?.trim() || null,
          cargo: profile.cargo?.trim() || null,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <CardTitle>Meu Perfil</CardTitle>
        </div>
        <CardDescription>
          Atualize suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={profile.nome}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              placeholder="Seu nome"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sobrenome">Sobrenome</Label>
            <Input
              id="sobrenome"
              value={profile.sobrenome}
              onChange={(e) => setProfile({ ...profile, sobrenome: e.target.value })}
              placeholder="Seu sobrenome"
              maxLength={100}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            O email não pode ser alterado
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={profile.cargo}
              onChange={(e) => setProfile({ ...profile, cargo: e.target.value })}
              placeholder="Ex: Personal Trainer, Nutricionista"
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
