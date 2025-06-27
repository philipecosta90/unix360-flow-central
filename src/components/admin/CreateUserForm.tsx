
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useUserManagement } from "@/hooks/useUserManagement";

export const CreateUserForm = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    nivel_permissao: 'visualizacao' as 'admin' | 'visualizacao' | 'operacional'
  });

  const { createUser, isLoading } = useUserManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.password) {
      return;
    }

    const success = await createUser(formData);
    if (success) {
      setFormData({
        nome: '',
        email: '',
        password: '',
        nivel_permissao: 'visualizacao'
      });
    }
  };

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
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo do usuário"
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha Provisória</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Senha inicial para o usuário"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel_permissao">Nível de Permissão</Label>
            <Select
              value={formData.nivel_permissao}
              onValueChange={(value) => setFormData(prev => ({ ...prev, nivel_permissao: value as 'admin' | 'visualizacao' | 'operacional' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
                <SelectItem value="visualizacao">Visualização</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Criando usuário..." : "Criar Usuário"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
