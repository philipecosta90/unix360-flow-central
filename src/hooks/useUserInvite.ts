
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
      console.log('🚀 Iniciando processo de convite:', inviteForm);

      // Verificar se o usuário está autenticado e obter o token JWT
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Erro ao obter sessão:', sessionError);
        throw new Error('Erro ao verificar autenticação');
      }

      if (!session || !session.access_token) {
        console.error('❌ Usuário não autenticado ou token não encontrado');
        throw new Error('Você precisa estar logado para enviar convites. Faça login novamente.');
      }

      console.log('✅ Usuário autenticado, token obtido');

      // Preparar o corpo da requisição exatamente como esperado pela função
      const requestBody = {
        email: inviteForm.email.trim(),
        nome: inviteForm.nome.trim(),
        nivel_permissao: inviteForm.nivel_permissao
      };

      console.log('📦 Enviando dados:', requestBody);

      // Chamar a edge function com POST, JSON correto e headers adequados
      const { data, error } = await supabase.functions.invoke('invite-user', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Resposta da edge function:', { data, error });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(error.message || 'Erro ao chamar função de convite');
      }

      if (!data?.success) {
        console.error('❌ Função retornou erro:', data?.error);
        throw new Error(data?.error || 'Erro desconhecido na função de convite');
      }

      console.log('✅ Convite enviado com sucesso');

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
      console.error('💥 Erro no processo de convite:', error);
      
      let errorMessage = "Não foi possível enviar o convite.";
      
      if (error.message?.includes('estar logado') || error.message?.includes('Faça login novamente')) {
        errorMessage = "Você precisa estar logado para enviar convites. Faça login novamente.";
      } else if (error.message?.includes('Admin permission required')) {
        errorMessage = "Apenas administradores podem enviar convites.";
      } else if (error.message?.includes('Invalid or expired authentication')) {
        errorMessage = "Sua sessão expirou. Faça login novamente.";
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = "Todos os campos são obrigatórios.";
      } else if (error.message?.includes('Invalid JSON')) {
        errorMessage = "Erro interno no envio dos dados. Tente novamente.";
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

  return {
    inviteForm,
    setInviteForm,
    isLoading,
    handleInviteUser
  };
};
