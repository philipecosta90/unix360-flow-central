
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CreateUserData {
  nome: string;
  email: string;
  password: string;
  nivel_permissao: 'admin' | 'visualizacao' | 'operacional';
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useUserManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  const createUser = async (data: CreateUserData) => {
    if (!userProfile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Chamando edge function create-user...');
      
      // Get the current session to send proper auth header
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Usuário não autenticado');
      }
      
      // Call the edge function to create user with proper auth context
      // NÃO enviamos empresa_id - a função identifica automaticamente
      const { data: result, error } = await supabase.functions.invoke('create-user', {
        body: {
          nome: data.nome,
          email: data.email,
          password: data.password,
          nivel_permissao: data.nivel_permissao
          // empresa_id é identificado automaticamente via sessão do admin
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        }
      });

      if (error) {
        console.error('❌ Erro na edge function:', error);
        
        if (error.message?.includes('Já existe um usuário')) {
          throw new Error('Já existe um usuário com este email');
        }
        
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      if (!result?.success) {
        console.error('❌ Edge function retornou erro:', result?.error);
        
        if (result?.error?.includes('Já existe um usuário')) {
          throw new Error('Já existe um usuário com este email');
        }
        
        throw new Error(result?.error || 'Erro ao criar usuário');
      }

      console.log('✅ Usuário criado com sucesso:', result);

      toast({
        title: "Usuário criado com sucesso!",
        description: `O usuário ${data.nome} foi criado e pode fazer login com a senha fornecida.`,
      });

      return true;
    } catch (error: any) {
      console.error('💥 Erro inesperado:', error);
      
      let errorMessage = "Ocorreu um erro ao criar usuário, tente novamente";
      
      if (error.message?.includes('Já existe um usuário com este email')) {
        errorMessage = "Já existe um usuário com este email";
      } else if (error.message?.includes('Apenas administradores podem criar usuários')) {
        errorMessage = "Apenas administradores podem criar usuários";
      } else if (error.message?.includes('Authorization header is required') || 
                 error.message?.includes('Invalid authentication token')) {
        errorMessage = "Sessão expirada. Faça login novamente";
      } else if (error.message?.includes('Usuário não autenticado')) {
        errorMessage = "Faça login para continuar";
      } else if (error.message?.includes('Token de autenticação inválido')) {
        errorMessage = "Sessão expirada. Faça login novamente";
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
