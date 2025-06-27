
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
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          nome: data.nome,
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);
        toast({
          title: "Erro ao criar usuário",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      if (!authData.user) {
        toast({
          title: "Erro",
          description: "Falha ao criar usuário",
          variant: "destructive",
        });
        return false;
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('perfis')
        .insert({
          user_id: authData.user.id,
          empresa_id: userProfile.empresa_id,
          nome: data.nome,
          nivel_permissao: data.nivel_permissao,
          ativo: true
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        toast({
          title: "Erro ao criar perfil",
          description: profileError.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Usuário criado com sucesso",
        description: `O usuário ${data.nome} foi criado e pode fazer login com a senha fornecida.`,
      });

      return true;
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao criar o usuário",
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
      // Verify current password by trying to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
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
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao alterar a senha",
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
