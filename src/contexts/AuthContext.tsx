
import { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContextType, UserProfile } from "@/types/auth";
import { fetchUserProfile } from "@/services/profileService";
import { securityMonitor } from "@/utils/securityMonitor";
import { logger } from "@/utils/logger";

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
      logger.error('Erro ao fazer logout forçado:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    logger.debug('Inicializando AuthProvider...');
    
    let isMounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth(`Auth state changed: ${event}`, { hasSession: !!session });
        
        if (!isMounted) {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Log successful login (but don't await to avoid blocking)
          securityMonitor.logLoginAttempt(session.user.email || '', true).catch(logger.error);
          
        // Use setTimeout to defer profile fetching and avoid blocking auth flow
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            const profile = await fetchUserProfile(session.user.id);
            
            // Complete signup process if needed (new user without profile)
            if (!profile && session.user.user_metadata?.nome) {
              try {
                logger.business('Completing signup process...');
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
                logger.error('Erro ao completar cadastro:', error);
              }
            }
            
            if (isMounted) {
              // Verificar se o perfil existe
              if (!profile) {
                logger.warn('Perfil não encontrado, fazendo logout...');
                await handleUserAccessDenied('Perfil não encontrado. Entre em contato com o administrador.');
                return;
              }
              
              setUserProfile(profile);
              setLoading(false);
            }
          } catch (error) {
            logger.error('Error loading profile:', error);
            if (isMounted) {
              setUserProfile(null);
              setLoading(false);
            }
          }
        }, 0);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Error in initial session check:', error);
      }
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        
        // Use setTimeout to avoid blocking initial render
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            const profile = await fetchUserProfile(session.user.id);
            
            if (isMounted) {
              // Verificar se o perfil existe
              if (!profile) {
                logger.warn('Perfil não encontrado na verificação inicial, fazendo logout...');
                await handleUserAccessDenied('Perfil não encontrado. Entre em contato com o administrador.');
                return;
              }
                
                setUserProfile(profile);
                setLoading(false);
              }
            } catch (error) {
              logger.error('Error loading initial profile:', error);
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
      logger.error('Error checking initial session:', error);
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
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
      
      logger.auth('Signed out successfully');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  };

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        logger.warn('Loading took too long, forcing completion');
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
