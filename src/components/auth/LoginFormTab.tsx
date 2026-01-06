import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validateAndSanitize, loginSchema, sanitizeInput } from "@/utils/inputValidation";
import { Mail, RefreshCw, Trash2, Wand2, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LoginFormTabProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loginAttempts: number;
  setLoginAttempts: (attempts: number) => void;
  isLockedOut: boolean;
  setValidationErrors: (errors: string[]) => void;
  onAccountLockout: () => void;
}

export const LoginFormTab = ({
  isLoading,
  setIsLoading,
  loginAttempts,
  setLoginAttempts,
  isLockedOut,
  setValidationErrors,
  onAccountLockout
}: LoginFormTabProps) => {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [isLoadingOAuth, setIsLoadingOAuth] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const MAX_LOGIN_ATTEMPTS = 5;

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoadingOAuth(provider);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error(`${provider} OAuth error:`, error);
        toast({
          title: "Erro no login",
          description: `Não foi possível conectar com ${provider === 'google' ? 'Google' : 'GitHub'}. Tente novamente.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`${provider} OAuth error:`, error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingOAuth(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      toast({
        title: "Conta bloqueada",
        description: "Aguarde antes de tentar novamente.",
        variant: "destructive",
      });
      return;
    }

    // Clear previous validation errors
    setValidationErrors([]);

    // Validate input using Zod's SafeParseReturnType
    const result = validateAndSanitize(loginForm, loginSchema);
    if (!result.success) {
      setValidationErrors(result.error.issues.map(err => err.message));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeInput(loginForm.email),
        password: loginForm.password, // Don't sanitize password
      });

      if (error) {
        // Detectar erro específico de email não confirmado
        const isEmailNotConfirmed = 
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('email_not_confirmed') ||
          error.code === 'email_not_confirmed';

        if (isEmailNotConfirmed) {
          setShowEmailNotConfirmed(true);
          toast({
            title: "Email não confirmado",
            description: "Verifique sua caixa de entrada ou clique para reenviar o email de confirmação.",
            variant: "destructive",
          });
          return;
        }

        // Outros erros de login (credenciais inválidas)
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          onAccountLockout();
          return;
        }

        toast({
          title: "Erro no login",
          description: `Email ou senha incorretos. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - newAttempts}`,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        setLoginAttempts(0); // Reset on successful login
        setValidationErrors([]); // Clear validation errors on success
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao UniX360!",
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof loginForm, value: string) => {
    const sanitizedValue = field === 'password' 
      ? value // Don't sanitize passwords
      : sanitizeInput(value);
    
    setLoginForm(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation errors and email not confirmed state when user starts typing
    setValidationErrors([]);
    setShowEmailNotConfirmed(false);
  };

  const handleResendConfirmation = async () => {
    if (!loginForm.email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsResendingConfirmation(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: loginForm.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        if (error.message.includes('rate_limit') || error.message.includes('For security purposes')) {
          toast({
            title: "Aguarde um momento",
            description: "Por segurança, aguarde alguns segundos antes de solicitar um novo email.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Erro ao reenviar",
          description: "Não foi possível reenviar o email. Tente novamente mais tarde.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada e spam. Clique no link para confirmar.",
      });
      setShowEmailNotConfirmed(false);
    } catch (error) {
      console.error('Resend confirmation error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // Tratamento mais específico de erros
        if (error.message.includes('rate_limit') || error.message.includes('For security purposes') || error.status === 429) {
          toast({
            title: "Muitas tentativas",
            description: "Por segurança, aguarde 60 segundos antes de solicitar um novo link.",
            variant: "destructive",
          });
          return;
        }
        
        // Por segurança, não revelamos se o email existe ou não
        // Mas informamos que enviamos (mesmo que o email não exista)
        toast({
          title: "Email enviado!",
          description: "Se este email estiver cadastrado, você receberá as instruções em breve. Verifique também a pasta de spam.",
        });
        setShowForgotPassword(false);
        setResetEmail("");
        return;
      }

      toast({
        title: "Email enviado com sucesso!",
        description: "Verifique sua caixa de entrada e spam. O link expira em 60 minutos. Clique no link IMEDIATAMENTE após receber.",
      });
      
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleClearCacheAndRetry = async () => {
    try {
      // Limpar storage local relacionado a auth
      localStorage.removeItem('sb-hfqzbljiwkrksmjyfdiy-auth-token');
      sessionStorage.clear();
      
      // Fazer signOut forçado
      await supabase.auth.signOut();
      
      toast({
        title: "Cache limpo!",
        description: "Tente fazer login novamente com suas credenciais.",
      });
      
      // Recarregar a página para limpar qualquer estado
      window.location.reload();
    } catch (error) {
      console.error('Clear cache error:', error);
      window.location.reload();
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!magicLinkEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email para receber o link de acesso.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMagicLink(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: sanitizeInput(magicLinkEmail),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('Magic link error:', error);
        
        if (error.message.includes('rate_limit') || error.message.includes('For security purposes') || error.status === 429) {
          toast({
            title: "Muitas tentativas",
            description: "Por segurança, aguarde 60 segundos antes de solicitar um novo link.",
            variant: "destructive",
          });
          return;
        }
        
        // Por segurança, não revelamos se o email existe
        toast({
          title: "Link enviado!",
          description: "Se este email estiver cadastrado, você receberá um link de acesso. Verifique também a pasta de spam.",
        });
        setShowMagicLink(false);
        setMagicLinkEmail("");
        return;
      }

      toast({
        title: "Link de acesso enviado!",
        description: "Verifique sua caixa de entrada e clique no link para entrar. O link expira em 60 minutos.",
      });
      
      setShowMagicLink(false);
      setMagicLinkEmail("");
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  // Magic Link form
  if (showMagicLink) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Wand2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Login sem Senha</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Receba um link mágico no seu email para entrar sem digitar senha
          </p>
        </div>
        
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              type="email"
              placeholder="seu@email.com"
              value={magicLinkEmail}
              onChange={(e) => setMagicLinkEmail(sanitizeInput(e.target.value))}
              disabled={isSendingMagicLink}
              maxLength={255}
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isSendingMagicLink}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSendingMagicLink ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Link de Acesso
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowMagicLink(false);
                setMagicLinkEmail("");
              }}
              disabled={isSendingMagicLink}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Login com Senha
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium">Recuperar Senha</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Digite seu email para receber as instruções de recuperação
          </p>
        </div>
        
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="seu@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(sanitizeInput(e.target.value))}
              disabled={isResettingPassword}
              maxLength={255}
              required
            />
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail("");
              }}
              disabled={isResettingPassword}
              className="w-full xs:w-auto"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={isResettingPassword}
              className="w-full xs:flex-1 bg-primary hover:bg-primary/90"
            >
              {isResettingPassword ? "Enviando..." : "Enviar Email"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={loginForm.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={isLockedOut || isLoading}
          maxLength={255}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
            disabled={isLockedOut || isLoading}
          >
            Esqueci minha senha
          </button>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          value={loginForm.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          disabled={isLockedOut || isLoading}
          maxLength={128}
          required
        />
      </div>
      {loginAttempts > 0 && !isLockedOut && (
        <p className="text-sm text-orange-600">
          Tentativas restantes: {MAX_LOGIN_ATTEMPTS - loginAttempts}
        </p>
      )}

      {showEmailNotConfirmed && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Email não confirmado
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Verifique sua caixa de entrada e spam. Se não encontrar o email, clique abaixo para reenviar.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResendConfirmation}
            disabled={isResendingConfirmation}
            className="w-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            {isResendingConfirmation ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Reenviar email de confirmação
              </>
            )}
          </Button>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading || isLockedOut}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="relative my-4">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
          ou continue com
        </span>
      </div>

      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin('google')}
          disabled={isLockedOut || isLoading || isLoadingOAuth !== null}
          className="w-full"
        >
          {isLoadingOAuth === 'google' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin('github')}
          disabled={isLockedOut || isLoading || isLoadingOAuth !== null}
          className="w-full"
        >
          {isLoadingOAuth === 'github' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </>
          )}
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowMagicLink(true)}
        disabled={isLockedOut || isLoading || isLoadingOAuth !== null}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Entrar com Link Mágico (sem senha)
      </Button>

      {/* Botão de limpar cache para problemas persistentes */}
      <button
        type="button"
        onClick={handleClearCacheAndRetry}
        className="w-full text-xs text-muted-foreground hover:text-foreground hover:underline mt-1 flex items-center justify-center gap-1"
      >
        <Trash2 className="h-3 w-3" />
        Problemas para entrar? Limpar cache
      </button>
    </form>
  );
};
