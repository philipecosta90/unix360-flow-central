
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validateAndSanitize, signupFormSchema, sanitizeInput } from "@/utils/inputValidation";

interface SignupFormTabProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setValidationErrors: (errors: string[]) => void;
}

export const SignupFormTab = ({
  isLoading,
  setIsLoading,
  setValidationErrors
}: SignupFormTabProps) => {
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nome: "",
    nomeEmpresa: "",
    cnpj: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with proper type checking
    const validation = validateAndSanitize<typeof loginForm>(loginForm, loginFormSchema);
    if (!validation.success) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);

    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizeInput(signupForm.email),
        password: signupForm.password, // Don't sanitize password
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: sanitizeInput(signupForm.nome),
            nome_empresa: sanitizeInput(signupForm.nomeEmpresa),
            cnpj: sanitizeInput(signupForm.cnpj)
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está registrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: "Não foi possível criar a conta. Tente novamente.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
        if (data.session) {
          navigate("/dashboard", { replace: true });
        }
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
    const sanitizedValue = field === 'password' || field === 'confirmPassword' 
      ? value // Don't sanitize passwords
      : sanitizeInput(value);
    
    setSignupForm(prev => ({ ...prev, [field]: sanitizedValue }));
    setValidationErrors([]);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Seu nome completo"
          value={signupForm.nome}
          onChange={(e) => handleInputChange('nome', e.target.value)}
          maxLength={100}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nomeEmpresa">Nome da empresa</Label>
        <Input
          id="nomeEmpresa"
          type="text"
          placeholder="Nome da sua empresa"
          value={signupForm.nomeEmpresa}
          onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ (opcional)</Label>
        <Input
          id="cnpj"
          type="text"
          placeholder="00.000.000/0000-00"
          value={signupForm.cnpj}
          onChange={(e) => handleInputChange('cnpj', e.target.value)}
          maxLength={18}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupEmail">Email</Label>
        <Input
          id="signupEmail"
          type="email"
          placeholder="seu@email.com"
          value={signupForm.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          maxLength={255}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupPassword">Senha</Label>
        <Input
          id="signupPassword"
          type="password"
          placeholder="Crie uma senha forte"
          value={signupForm.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          maxLength={128}
          required
        />
        <PasswordStrength password={signupForm.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirme sua senha"
          value={signupForm.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          maxLength={128}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
        disabled={isLoading}
      >
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </Button>
    </form>
  );
};
