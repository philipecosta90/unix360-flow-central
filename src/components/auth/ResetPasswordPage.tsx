import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { sanitizeInput } from "@/utils/inputValidation";
import { PasswordStrength } from "@/components/ui/password-strength";

export const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for error parameters in URL
    const params = new URLSearchParams(window.location.hash.substring(1));
    const error = params.get('error');
    const errorCode = params.get('error_code');

    if (error || errorCode) {
      setHasError(true);
      if (errorCode === 'otp_expired') {
        setErrorMessage('O link de recuperação expirou. Por favor, solicite um novo link.');
      } else if (error === 'access_denied') {
        setErrorMessage('Link inválido ou expirado. Solicite um novo link de recuperação.');
      } else {
        setErrorMessage('Ocorreu um erro. Por favor, solicite um novo link de recuperação.');
      }
    }
  }, []);

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: "A senha deve ter no mínimo 8 caracteres" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos uma letra maiúscula" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos uma letra minúscula" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "A senha deve conter pelo menos um número" };
    }
    return { valid: true };
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasError) {
      toast({
        title: "Link inválido",
        description: "Por favor, solicite um novo link de recuperação.",
        variant: "destructive",
      });
      return;
    }

    // Validate password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      toast({
        title: "Senha inválida",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, certifique-se de que as senhas são idênticas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        toast({
          title: "Erro ao redefinir senha",
          description: error.message || "Não foi possível atualizar sua senha. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Senha redefinida com sucesso!",
        description: "Você será redirecionado para fazer login.",
      });

      // Sign out the user to force a fresh login
      await supabase.auth.signOut();

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate("/", { replace: true });
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Link Expirado ou Inválido</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRequestNewLink} 
              className="w-full"
            >
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Sua senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e números.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                maxLength={128}
                required
              />
              {newPassword && <PasswordStrength password={newPassword} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                maxLength={128}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>

            <Button 
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleRequestNewLink}
              disabled={isLoading}
            >
              Voltar para Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
