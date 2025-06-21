
import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
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

      console.log='Perfil carregado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      return null;
    }
  };

  const createDefaultProfile = async (userId: string) => {
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

  useEffect(() => {
    console.log('Configurando listener de autenticação...');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid blocking auth state changes
          setTimeout(async () => {
            const profile = await fetchUserProfile(session.user.id);
            setUserProfile(profile);
            setLoading(false);
          }, 100); // Small delay to prevent blocking
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão existente encontrada:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          setUserProfile(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('Removendo listener de autenticação');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw new Error('Erro ao fazer logout');
      }
      console.log('Logout realizado com sucesso');
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
