
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Eye, EyeOff, Building2 } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/hooks/useAuth";

export const CreateUserForm = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: 'TempPassword123!',
    nivel_permissao: 'operacional' as 'admin' | 'visualizacao' | 'operacional',
    nome_empresa: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const { createUser, isLoading } = useUserManagement();
  const { user, userProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📋 [FORM] Formulário enviado');
    
    if (!formData.nome.trim() || !formData.email.trim() || !formData.password.trim() || !formData.nome_empresa.trim()) {
      console.error('❌ [FORM] Campos obrigatórios não preenchidos');
      return;
    }

    if (!userProfile) {
      console.error('❌ [FORM] Usuário não autenticado');
      return;
    }

    if (user?.id !== 'b0896210-8487-4456-a5f1-056a0685ee7f') {
      console.error('❌ [FORM] Usuário não é super admin');
      return;
    }

    console.log('📤 [FORM] Enviando dados:', {
      nome: formData.nome,
      email: formData.email,
      nivel_permissao: formData.nivel_permissao,
      nome_empresa: formData.nome_empresa,
      password: '***'
    });

    const success = await createUser(formData);
    
    if (success) {
      console.log('✅ [FORM] Usuário criado com sucesso, limpando formulário');
      setFormData({
        nome: '',
        email: '',
        password: 'TempPassword123!',
        nivel_permissao: 'operacional',
        nome_empresa: ''
      });
    }
  };

  const isFormValid = formData.nome.trim() !== '' && 
                     formData.email.trim() !== '' && 
                     formData.password.trim() !== '' &&
                     formData.nome_empresa.trim() !== '';

  const canCreateUsers = user?.id === 'b0896210-8487-4456-a5f1-056a0685ee7f';

  if (!canCreateUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Apenas administradores podem cadastrar novos usuários.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Cadastrar Novo Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_empresa">Nome da Empresa</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="nome_empresa"
                type="text"
                value={formData.nome_empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_empresa: e.target.value }))}
                placeholder="Nome da empresa do cliente"
                className="pl-10"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo do usuário"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Provisória</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Senha inicial para o usuário"
                disabled={isLoading}
                minLength={6}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel_permissao">Nível de Permissão</Label>
            <Select
              value={formData.nivel_permissao}
              onValueChange={(value) => setFormData(prev => ({ ...prev, nivel_permissao: value as 'admin' | 'visualizacao' | 'operacional' }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador - Acesso total</SelectItem>
                <SelectItem value="operacional">Operacional - Gerencia clientes e tarefas</SelectItem>
                <SelectItem value="visualizacao">Visualização - Apenas consulta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Informações importantes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Uma nova empresa será criada com o nome informado</li>
              <li>• O usuário será vinculado à sua própria empresa (dados isolados)</li>
              <li>• O usuário poderá fazer login imediatamente com o email e senha fornecidos</li>
              <li>• Recomende que o usuário altere a senha no primeiro acesso</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !isFormValid}
            className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
          >
            {isLoading ? (
              <>
                <UserPlus className="h-4 w-4 mr-2 animate-spin" />
                Criando usuário e empresa...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Criar Usuário e Empresa
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
