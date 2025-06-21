
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { validateAndSanitize, loginFormSchema, sanitizeInput } from "@/utils/inputValidation";

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

    // Validate input with proper type checking
    const validation = validateAndSanitize(loginForm, loginFormSchema);
    if (!validation.success) {
      setValidationErrors(validation.error.errors.map(err => err.message);
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);

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
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao UniX360!",
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: sanitizeInput(value) }));
    setValidationErrors([]);
  };

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
          disabled={isLockedOut}
          maxLength={255}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Sua senha"
          value={loginForm.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          disabled={isLockedOut}
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
        className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
        disabled={isLoading || isLockedOut}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};
