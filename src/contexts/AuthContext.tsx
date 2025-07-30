
import { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType, UserProfile } from "@/types/auth";
import { fetchUserProfile } from "@/services/profileService";
import { securityMonitor } from "@/utils/securityMonitor";

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to handle user access denial
  const handleUserAccessDenied = async (message: string) => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      // Mostrar mensagem de erro
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          const event = new CustomEvent('show-access-denied', { detail: { message } });
          window.dispatchEvent(event);
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao fazer logout forçado:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log('🚀 Inicializando AuthProvider...');
    
    let isMounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        if (!isMounted) {
          console.log('🚫 Component unmounted, ignoring auth change');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User logged in, fetching profile...');
          
          // Log successful login (but don't await to avoid blocking)
          securityMonitor.logLoginAttempt(session.user.email || '', true).catch(console.error);
          
        // Use setTimeout to defer profile fetching and avoid blocking auth flow
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            console.log('🔍 Fetching user profile...');
            const profile = await fetchUserProfile(session.user.id);
            
            // Complete signup process if needed (new user without profile)
            if (!profile && session.user.user_metadata?.nome) {
              try {
                console.log('🚀 Completing signup process...');
                const { error } = await supabase.functions.invoke('signup-complete');
                if (!error) {
                  // Refresh profile after completion
                  setTimeout(async () => {
                    if (!isMounted) return;
                    const newProfile = await fetchUserProfile(session.user.id);
                    if (isMounted) {
                      setUserProfile(newProfile);
                      setLoading(false);
                    }
                  }, 1000);
                  return;
                }
              } catch (error) {
                console.error('Erro ao completar cadastro:', error);
              }
            }
            
            if (isMounted) {
              console.log('👤 Profile loaded:', profile ? 'Success' : 'Failed');
              
              // Verificar se o perfil existe e se o usuário pode acessar o sistema
              if (!profile) {
                console.warn('🚫 Perfil não encontrado, fazendo logout...');
                await handleUserAccessDenied('Perfil não encontrado. Entre em contato com o administrador.');
                return;
              }
              
                // Verificar acesso completo do sistema usando função do banco
                try {
                  const { data: accessCheck, error: accessError } = await supabase.rpc('can_user_access_system', {
                    user_uuid: session.user.id
                  });
                  
                  if (accessError) {
                    console.error('Erro ao verificar acesso:', accessError);
                    await handleUserAccessDenied('Erro interno. Tente novamente mais tarde.');
                    return;
                  }
                  
                  const accessData = accessCheck as any; // Type assertion para contornar tipo Json
                  if (!accessData?.can_access) {
                    console.warn('🚫 Acesso negado:', accessData?.reason);
                    await handleUserAccessDenied(accessData?.message || 'Acesso negado');
                    return;
                  }
                  
                  console.log('✅ Acesso autorizado:', accessData?.reason);
                } catch (error) {
                  console.error('Erro ao verificar acesso do sistema:', error);
                  await handleUserAccessDenied('Erro interno. Tente novamente mais tarde.');
                  return;
                }
              
              setUserProfile(profile);
              setLoading(false);
            }
          } catch (error) {
            console.error('💥 Error loading profile:', error);
            if (isMounted) {
              setUserProfile(null);
              setLoading(false);
            }
          }
        }, 0);
        } else {
          console.log('👋 User logged out');
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    console.log('🔍 Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Initial session check:', session ? 'Found' : 'Not found', error);
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 Existing user found, fetching profile...');
        
        // Use setTimeout to avoid blocking initial render
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            const profile = await fetchUserProfile(session.user.id);
            
            if (isMounted) {
              // Verificar se o perfil existe e se o usuário pode acessar o sistema
              if (!profile) {
                console.warn('🚫 Perfil não encontrado na verificação inicial, fazendo logout...');
                await handleUserAccessDenied('Perfil não encontrado. Entre em contato com o administrador.');
                return;
              }
              
                // Verificar acesso completo do sistema usando função do banco
                try {
                  const { data: accessCheck, error: accessError } = await supabase.rpc('can_user_access_system', {
                    user_uuid: session.user.id
                  });
                  
                  if (accessError) {
                    console.error('Erro ao verificar acesso inicial:', accessError);
                    await handleUserAccessDenied('Erro interno. Tente novamente mais tarde.');
                    return;
                  }
                  
                  const accessData = accessCheck as any; // Type assertion para contornar tipo Json
                  if (!accessData?.can_access) {
                    console.warn('🚫 Acesso negado na verificação inicial:', accessData?.reason);
                    await handleUserAccessDenied(accessData?.message || 'Acesso negado');
                    return;
                  }
                  
                  console.log('✅ Acesso autorizado na verificação inicial:', accessData?.reason);
                } catch (error) {
                  console.error('Erro ao verificar acesso inicial do sistema:', error);
                  await handleUserAccessDenied('Erro interno. Tente novamente mais tarde.');
                  return;
                }
                
                setUserProfile(profile);
                setLoading(false);
              }
            } catch (error) {
              console.error('💥 Error loading initial profile:', error);
              if (isMounted) {
                setUserProfile(null);
                setLoading(false);
              }
            }
        }, 0);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error('💥 Error checking initial session:', error);
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up AuthProvider...');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error('Erro ao fazer logout');
      }
      
      // Clear sensitive data from localStorage
      localStorage.removeItem('security_events');
      
      // Reset state
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('💥 Error signing out:', error);
      throw error;
    }
  };

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⏰ Loading took too long, forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

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

export { AuthContext };
