import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validateAndSanitize, loginSchema, sanitizeInput } from "@/utils/inputValidation";

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
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          onAccountLockout();
          return;
        }

        toast({
          title: "Erro no login",
          description: `Credenciais inválidas. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - newAttempts}`,
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
    
    // Clear validation errors when user starts typing
    setValidationErrors([]);
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
        toast({
          title: "Erro ao enviar email",
          description: "Não foi possível enviar o email de recuperação. Verifique o endereço informado.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
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
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading || isLockedOut}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};
