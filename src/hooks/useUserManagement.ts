
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CreateUserData {
  nome: string;
  email: string;
  password: string;
  nivel_permissao: 'admin' | 'visualizacao' | 'operacional';
  nome_empresa: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useUserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();

  const createUser = async (data: CreateUserData) => {
    console.log('🚀 [FRONTEND] Iniciando criação de usuário e empresa...');
    
    if (!userProfile?.empresa_id) {
      console.error('❌ [FRONTEND] Empresa não encontrada');
      toast({
        title: "Erro",
        description: "Empresa não encontrada",
        variant: "destructive",
      });
      return false;
    }

    if (user?.id !== 'b0896210-8487-4456-a5f1-056a0685ee7f') {
      console.error('❌ [FRONTEND] Usuário não é super admin');
      toast({
        title: "Erro",
        description: "Apenas o super administrador pode criar usuários",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      console.log('📤 [FRONTEND] Enviando dados para edge function...');
      
      // Obter sessão atual
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Chamar a edge function
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          nome: data.nome,
          email: data.email,
          password: data.password,
          nivel_permissao: data.nivel_permissao,
          nome_empresa: data.nome_empresa
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        }
      });

      console.log('📥 [FRONTEND] Resposta recebida:', { result, error });

      if (error) {
        console.error('❌ [FRONTEND] Erro na edge function:', error);
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      if (!result?.success) {
        console.error('❌ [FRONTEND] Edge function retornou erro:', result?.error);
        
        // Verificar se é erro de usuário já existente
        if (result?.error?.includes('já existe') || result?.error?.includes('already exists')) {
          throw new Error('Já existe um usuário cadastrado com este email. Use um email diferente.');
        }
        
        throw new Error(result?.error || 'Erro ao criar usuário');
      }

      console.log('✅ [FRONTEND] Usuário e empresa criados com sucesso');

      toast({
        title: "Usuário criado com sucesso!",
        description: `O usuário ${data.nome} foi criado na empresa "${data.nome_empresa}" e pode fazer login com a senha fornecida.`,
      });

      return true;
      
    } catch (error: any) {
      console.error('💥 [FRONTEND] Erro inesperado:', error);
      
      let errorMessage = "Erro ao criar usuário";
      
      if (error.message?.includes('Já existe um usuário') || error.message?.includes('already exists') || error.message?.includes('já existe')) {
        errorMessage = "Email já está em uso. Escolha um email diferente ou verifique se o usuário já foi cadastrado anteriormente.";
      } else if (error.message?.includes('Apenas administradores')) {
        errorMessage = "Apenas administradores podem criar usuários";
      } else if (error.message?.includes('Sessão')) {
        errorMessage = "Sessão expirada. Faça login novamente";
      } else if (error.message?.includes('Token')) {
        errorMessage = "Sessão inválida. Faça login novamente";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return false;
    }

    if (data.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Usuário não encontrado');
      }

      // Verify current password by trying to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (verifyError) {
        toast({
          title: "Erro",
          description: "Senha atual incorreta",
          variant: "destructive",
        });
        return false;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) {
        console.error('Erro ao alterar senha:', updateError);
        toast({
          title: "Erro ao alterar senha",
          description: updateError.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Senha alterada com sucesso",
        description: "Sua senha foi alterada com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: error.message || "Ocorreu um erro ao alterar a senha",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createUser,
    changePassword,
    isLoading
  };
};
