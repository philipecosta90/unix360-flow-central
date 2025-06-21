
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('Buscando perfil para usuário:', userId);
    
    // Use maybeSingle() instead of single() to avoid PGRST116 error when no data exists
    const { data, error } = await supabase
      .from('perfis')
      .select(`
        *,
        empresas (
          id,
          nome,
          cnpj,
          email,
          telefone,
          endereco,
          configuracoes_nicho
        )
      `)
      .eq('user_id', userId)
      .maybeSingle(); // This prevents the PGRST116 error

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    if (!data) {
      console.log('Perfil não encontrado para o usuário. Tentando criar automaticamente...');
      // Try to create a profile automatically if none exists
      await createDefaultProfile(userId);
      // Try to fetch again after creating
      const { data: newData } = await supabase
        .from('perfis')
        .select(`
          *,
          empresas (
            id,
            nome,
            cnpj,
            email,
            telefone,
            endereco,
            configuracoes_nicho
          )
        `)
        .eq('user_id', userId)
        .maybeSingle();
      
      return newData;
    }

    console.log('Perfil carregado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro inesperado ao buscar perfil:', error);
    return null;
  }
};

export const createDefaultProfile = async (userId: string): Promise<void> => {
  try {
    // Get user info from auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if default company exists, if not create one
    let { data: defaultCompany } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!defaultCompany) {
      const { data: newCompany } = await supabase
        .from('empresas')
        .insert({
          nome: 'Empresa Padrão',
          email: user.email || 'contato@empresa.com'
        })
        .select('id')
        .single();
      
      defaultCompany = newCompany;
    }

    if (defaultCompany) {
      // Create profile for user
      const { error: profileError } = await supabase
        .from('perfis')
        .insert({
          user_id: userId,
          empresa_id: defaultCompany.id,
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
          nivel_permissao: 'admin'
        });

      if (profileError) {
        console.error('Erro ao criar perfil padrão:', profileError);
      } else {
        console.log('Perfil padrão criado com sucesso');
      }
    }
  } catch (error) {
    console.error('Erro ao criar perfil padrão:', error);
  }
};
