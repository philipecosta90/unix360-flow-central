
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateUserForm {
  email: string;
  nome: string;
  senha: string;
  nivel_permissao: "admin" | "editor" | "visualizacao" | "operacional";
}

interface ChangePasswordForm {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

export const useUserManagement = () => {
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: "",
    nome: "",
    senha: "",
    nivel_permissao: "operacional"
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.email || !createForm.nome || !createForm.senha) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    if (createForm.senha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obter informações da empresa do admin atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: adminProfile } = await supabase
        .from('perfis')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (!adminProfile) throw new Error('Perfil do admin não encontrado');

      // Criar o usuário no Supabase Auth usando admin client
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: createForm.email,
        password: createForm.senha,
        email_confirm: true,
        user_metadata: {
          nome: createForm.nome
        }
      });

      if (createError) throw createError;
      if (!newUser.user) throw new Error('Erro ao criar usuário');

      // Criar perfil do usuário
      const { error: profileError } = await supabase
        .from('perfis')
        .insert({
          user_id: newUser.user.id,
          empresa_id: adminProfile.empresa_id,
          nome: createForm.nome,
          nivel_permissao: createForm.nivel_permissao
        });

      if (profileError) throw profileError;

      toast({
        title: "Usuário criado com sucesso!",
        description: `${createForm.nome} foi cadastrado e já pode fazer login.`,
      });

      // Limpar formulário
      setCreateForm({
        email: "",
        nome: "",
        senha: "",
        nivel_permissao: "operacional"
      });

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = "Não foi possível criar o usuário.";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este email já está cadastrado no sistema.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.senhaAtual || !passwordForm.novaSenha || !passwordForm.confirmarSenha) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.novaSenha.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Atualizar senha no Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.novaSenha
      });

      if (error) throw error;

      toast({
        title: "Senha alterada com sucesso!",
        description: "Sua senha foi atualizada.",
      });

      // Limpar formulário
      setPasswordForm({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: ""
      });

    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = "Não foi possível alterar a senha.";
      
      if (error.message?.includes('Invalid credentials')) {
        errorMessage = "Senha atual incorreta.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao alterar senha",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createForm,
    setCreateForm,
    passwordForm,
    setPasswordForm,
    isLoading,
    handleCreateUser,
    handleChangePassword
  };
};
