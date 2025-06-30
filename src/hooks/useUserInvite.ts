
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InviteForm {
  email: string;
  nome: string;
  nivel_permissao: "admin" | "editor" | "visualizacao" | "operacional";
}

export const useUserInvite = () => {
  const [inviteForm, setInviteForm] = useState<InviteForm>({
    email: "",
    nome: "",
    nivel_permissao: "operacional"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!inviteForm.email || !inviteForm.nome || !inviteForm.nivel_permissao) {
      toast({
        title: "Erro de validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🚀 Chamando função create-user diretamente:', inviteForm);

      // Chamar a função create-user em vez de invite-user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          nome: inviteForm.nome.trim(),
          email: inviteForm.email.trim(),
          password: 'TempPassword123!',
          nivel_permissao: inviteForm.nivel_permissao
        }
      });

      console.log('📡 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      if (!data?.success) {
        console.error('❌ Função retornou erro:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido na criação do usuário');
      }

      console.log('✅ Usuário criado com sucesso');

      toast({
        title: "Usuário criado com sucesso!",
        description: `Usuário ${inviteForm.nome} criado. Senha temporária: TempPassword123!`,
      });

      // Limpar formulário
      setInviteForm({
        email: "",
        nome: "",
        nivel_permissao: "operacional"
      });

    } catch (error: any) {
      console.error('💥 Erro no processo de criação:', error);
      
      let errorMessage = "Não foi possível criar o usuário.";
      
      if (error.message?.includes('estar logado') || error.message?.includes('Faça login novamente')) {
        errorMessage = "Você precisa estar logado para criar usuários. Faça login novamente.";
      } else if (error.message?.includes('Admin permission required')) {
        errorMessage = "Apenas administradores podem criar usuários.";
      } else if (error.message?.includes('User profile not found')) {
        errorMessage = "Perfil de usuário não encontrado. Verifique suas permissões.";
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

  return {
    inviteForm,
    setInviteForm,
    isLoading,
    handleInviteUser
  };
};
