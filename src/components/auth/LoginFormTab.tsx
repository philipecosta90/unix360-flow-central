import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validateAndSanitize, loginSchema, sanitizeInput } from "@/utils/inputValidation";
import { Mail, RefreshCw, Trash2, Wand2, ArrowLeft, KeyRound } from "lucide-react";
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
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [isLoadingOAuth, setIsLoadingOAuth] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const MAX_LOGIN_ATTEMPTS = 5;

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setIsLoadingOAuth(provider);
    
    const providerNames = {
      google: 'Google',
      apple: 'Apple'
    };
    
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
          description: `Não foi possível conectar com ${providerNames[provider]}. Tente novamente.`,
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

  const handleForgotPassword = async () => {
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

  const handleMagicLinkFromRecovery = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, insira seu email.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMagicLink(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: sanitizeInput(resetEmail),
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
        setShowForgotPassword(false);
        setResetEmail("");
        return;
      }

      toast({
        title: "Link de acesso enviado!",
        description: "Verifique sua caixa de entrada e clique no link para entrar. O link expira em 60 minutos.",
      });
      
      setShowForgotPassword(false);
      setResetEmail("");
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

  // Forgot Password / Recovery form
  if (showForgotPassword) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Recuperar Acesso</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Digite seu email para recuperar o acesso à sua conta
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="seu@email.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(sanitizeInput(e.target.value))}
            disabled={isResettingPassword || isSendingMagicLink}
            maxLength={255}
            required
          />
        </div>

        {/* Duas opções de recuperação */}
        <div className="space-y-3 pt-2">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Opção 1: Redefinir Senha
            </p>
            <p className="text-xs text-muted-foreground">
              Receba um link para criar uma nova senha
            </p>
            <Button
              type="button"
              onClick={handleForgotPassword}
              disabled={isResettingPassword || isSendingMagicLink || !resetEmail.trim()}
              className="w-full"
              variant="default"
            >
              {isResettingPassword ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Link de Recuperação"
              )}
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              ou
            </span>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Opção 2: Acesso Direto (sem senha)
            </p>
            <p className="text-xs text-muted-foreground">
              Receba um link que faz login automático. Depois, altere sua senha nas configurações
            </p>
            <Button
              type="button"
              onClick={handleMagicLinkFromRecovery}
              disabled={isResettingPassword || isSendingMagicLink || !resetEmail.trim()}
              className="w-full"
              variant="outline"
            >
              {isSendingMagicLink ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Link de Acesso Direto"
              )}
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setShowForgotPassword(false);
            setResetEmail("");
          }}
          disabled={isResettingPassword || isSendingMagicLink}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Login
        </Button>
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

      </div>

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
