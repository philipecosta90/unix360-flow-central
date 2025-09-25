import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    console.log('🔍 Iniciando busca do perfil para usuário:', userId);
    console.log('🔍 Cliente Supabase inicializado:', !!supabase);
    
    // Log da sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔍 Sessão atual:', session ? 'Ativa' : 'Inativa', sessionError ? `Erro: ${sessionError.message}` : '');
    
    // Use maybeSingle() instead of single() to avoid PGRST116 error when no data exists
    console.log('🔍 Executando query no Supabase...');
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
      .eq('ativo', true) // Só buscar perfis ativos
      .maybeSingle();

    console.log('🔍 Resposta da query:', { data, error });

    if (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      return null;
    }

    if (!data) {
      console.log('⚠️ Perfil ativo não encontrado. Tentando criar automaticamente...');
      // Try to create a profile automatically if none exists
      const success = await createDefaultProfile(userId);
      if (!success) {
        console.error('❌ Falha ao criar perfil padrão');
        return null;
      }
      
      // Try to fetch again after creating
      console.log('🔄 Tentando buscar perfil novamente após criação...');
      const { data: newData, error: newError } = await supabase
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
        .eq('ativo', true) // Só buscar perfis ativos
        .maybeSingle();
      
      console.log('🔍 Segunda tentativa:', { data: newData, error: newError });
      
      if (newError) {
        console.error('❌ Erro na segunda tentativa:', newError);
        return null;
      }
      
      return newData as UserProfile;
    }

    console.log('✅ Perfil ativo carregado com sucesso:', data);
    return data as UserProfile;
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar perfil:', error);
    return null;
  }
};

export const createDefaultProfile = async (userId: string): Promise<boolean> => {
  try {
    console.log('🏗️ Criando perfil padrão para usuário:', userId);
    
    // Get user info from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('🔍 Dados do usuário auth:', user ? 'Encontrado' : 'Não encontrado', userError);
    
    if (!user) {
      console.error('❌ Usuário não encontrado no auth');
      return false;
    }

    // Check if default company exists, if not create one
    console.log('🏢 Verificando empresa padrão...');
    let { data: defaultCompany, error: companyError } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .maybeSingle();

    console.log('🏢 Empresa padrão:', defaultCompany, companyError);

    if (!defaultCompany) {
      console.log('🏗️ Criando empresa padrão...');
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('empresas')
        .insert({
          nome: 'Empresa Padrão',
          email: user.email || 'contato@empresa.com'
        })
        .select('id')
        .single();
      
      console.log('🏢 Nova empresa criada:', newCompany, createCompanyError);
      
      if (createCompanyError) {
        console.error('❌ Erro ao criar empresa:', createCompanyError);
        return false;
      }
      
      defaultCompany = newCompany;
    }

    if (defaultCompany) {
    // Definir dados do trial
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 7); // 7 dias de trial

    // Create profile for user
    console.log('👤 Criando perfil do usuário...');
    const profileData = {
      user_id: userId,
      empresa_id: defaultCompany.id,
      nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
      email: user.email || 'usuario@email.com',
      nivel_permissao: 'admin' as const,
      ativo: true, // Criar perfil como ativo por padrão
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      subscription_status: 'trial',
      subscription_plan: 'free'
    };
      
      console.log('👤 Dados do perfil a ser criado:', profileData);
      
      const { error: profileError } = await supabase
        .from('perfis')
        .insert(profileData);

      if (profileError) {
        console.error('❌ Erro ao criar perfil padrão:', profileError);
        return false;
      } else {
        console.log('✅ Perfil padrão criado com sucesso');
        return true;
      }
    }
    
    console.error('❌ Não foi possível obter empresa padrão');
    return false;
  } catch (error) {
    console.error('💥 Erro inesperado ao criar perfil padrão:', error);
    return false;
  }
};