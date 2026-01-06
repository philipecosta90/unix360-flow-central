import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validateAndSanitize, loginSchema, sanitizeInput } from "@/utils/inputValidation";
import { Mail, RefreshCw, Trash2 } from "lucide-react";

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
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showEmailNotConfirmed, setShowEmailNotConfirmed] = useState(false);
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const MAX_LOGIN_ATTEMPTS = 5;

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

      {/* Botão de limpar cache para problemas persistentes */}
      <button
        type="button"
        onClick={handleClearCacheAndRetry}
        className="w-full text-xs text-muted-foreground hover:text-foreground hover:underline mt-3 flex items-center justify-center gap-1"
      >
        <Trash2 className="h-3 w-3" />
        Problemas para entrar? Limpar cache
      </button>
    </form>
  );
};
