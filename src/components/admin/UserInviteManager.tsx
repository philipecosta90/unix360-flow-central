import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, Shield, Eye, Edit, Wrench } from "lucide-react";

export const UserInviteManager = () => {
  const [inviteForm, setInviteForm] = useState({
    email: "",
    nome: "",
    nivel_permissao: "operacional" as "admin" | "editor" | "visualizacao" | "operacional"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Sending invite request:', inviteForm);

      // Verify user is authenticated before making the request
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Você precisa estar logado para enviar convites');
      }

      console.log('User session found, calling invite function...');

      // Call the edge function to invite user
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteForm.email,
          nome: inviteForm.nome,
          nivel_permissao: inviteForm.nivel_permissao
        }
      });

      console.log('Invite response:', { data, error });

      if (error) {
        console.error('Error calling invite function:', error);
        throw new Error(error.message || 'Failed to call invite function');
      }

      if (!data?.success) {
        console.error('Invite function returned error:', data?.error);
        throw new Error(data?.error || 'Unknown error from invite function');
      }

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${inviteForm.email}. O usuário receberá um email para definir a senha.`,
      });

      // Limpar formulário
      setInviteForm({
        email: "",
        nome: "",
        nivel_permissao: "operacional"
      });

    } catch (error: any) {
      console.error('Error inviting user:', error);
      
      let errorMessage = "Não foi possível enviar o convite.";
      
      if (error.message?.includes('estar logado')) {
        errorMessage = "Você precisa estar logado para enviar convites.";
      } else if (error.message?.includes('Admin permission required')) {
        errorMessage = "Apenas administradores podem enviar convites.";
      } else if (error.message?.includes('Invalid or expired authentication')) {
        errorMessage = "Sua sessão expirou. Faça login novamente.";
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = "Todos os campos são obrigatórios.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao enviar convite",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'visualizacao':
        return <Eye className="h-4 w-4" />;
      case 'operacional':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  const getPermissionDescription = (level: string) => {
    switch (level) {
      case 'admin':
        return 'Acesso total ao sistema';
      case 'editor':
        return 'Pode editar dados e configurações';
      case 'visualizacao':
        return 'Apenas visualização de dados';
      case 'operacional':
        return 'Acesso operacional básico';
      default:
        return 'Acesso operacional básico';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Convidar Novo Usuário
        </CardTitle>
        <CardDescription>
          Envie um convite por email para um novo usuário acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do usuário</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Nome do usuário"
              value={inviteForm.nome}
              onChange={(e) => setInviteForm(prev => ({ ...prev, nome: e.target.value }))}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel_permissao">Nível de permissão</Label>
            <Select
              value={inviteForm.nivel_permissao}
              onValueChange={(value: "admin" | "editor" | "visualizacao" | "operacional") => 
                setInviteForm(prev => ({ ...prev, nivel_permissao: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('admin')}
                    <div>
                      <div className="font-medium">Administrador</div>
                      <div className="text-sm text-gray-500">{getPermissionDescription('admin')}</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('editor')}
                    <div>
                      <div className="font-medium">Editor</div>
                      <div className="text-sm text-gray-500">{getPermissionDescription('editor')}</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="visualizacao">
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('visualizacao')}
                    <div>
                      <div className="font-medium">Visualização</div>
                      <div className="text-sm text-gray-500">{getPermissionDescription('visualizacao')}</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="operacional">
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('operacional')}
                    <div>
                      <div className="font-medium">Operacional</div>
                      <div className="text-sm text-gray-500">{getPermissionDescription('operacional')}</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Mail className="h-4 w-4 mr-2 animate-spin" />
                Enviando convite...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Convite
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• O usuário receberá um email com link para definir a senha</li>
            <li>• Após definir a senha, poderá fazer login normalmente</li>
            <li>• O nível de permissão define o que o usuário pode acessar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
