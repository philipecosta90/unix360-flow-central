import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateAndSanitize, signupSchema, sanitizeInput, sanitizeNameInput } from "@/utils/inputValidation";

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
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
    nomeEmpresa: ""
  });
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors([]);

    // Validate input using Zod
    const result = validateAndSanitize(signupForm, signupSchema);
    if (!result.success) {
      setValidationErrors(result.error.issues.map(err => err.message));
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setValidationErrors(["As senhas não coincidem"]);
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se já existe uma empresa suspensa com este e-mail
      const { data: existingCompany, error: companyError } = await supabase
        .from('empresas')
        .select(`
          id,
          nome,
          email,
          subscriptions!inner(
            status
          )
        `)
        .eq('email', signupForm.email)
        .single();

      if (!companyError && existingCompany) {
        const subscription = existingCompany.subscriptions[0];
        if (subscription?.status === 'suspended') {
          toast({
            title: "Conta Suspensa",
            description: "Existe uma conta suspensa associada a este e-mail. Entre em contato com o suporte para reativação.",
            variant: "destructive",
          });
          return;
        }
      }

      // Create user with signup
      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nome: signupForm.nome,
            nome_empresa: signupForm.nomeEmpresa
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Já existe uma conta com este email. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta. Seu trial de 7 dias começou!",
        });
        
        // Reset form
        setSignupForm({
          nome: "",
          email: "",
          password: "",
          confirmPassword: "",
          nomeEmpresa: ""
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof signupForm, value: string) => {
    let sanitizedValue = value;
    
    if (field === 'password' || field === 'confirmPassword') {
      sanitizedValue = value; // Don't sanitize passwords
    } else if (field === 'nome' || field === 'nomeEmpresa') {
      sanitizedValue = sanitizeNameInput(value); // Use specific sanitization for names
    } else {
      sanitizedValue = sanitizeInput(value); // Use general sanitization for other fields
    }
    
    setSignupForm(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation errors when user starts typing
    setValidationErrors([]);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome Completo</Label>
        <Input
          id="nome"
          type="text"
          placeholder="Maria da Silva"
          value={signupForm.nome}
          onChange={(e) => handleInputChange('nome', e.target.value)}
          disabled={isLoading}
          maxLength={100}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={signupForm.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={isLoading}
          maxLength={255}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
        <Input
          id="nomeEmpresa"
          type="text"
          placeholder="Empresa Exemplo Ltda"
          value={signupForm.nomeEmpresa}
          onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
          disabled={isLoading}
          maxLength={100}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={signupForm.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          disabled={isLoading}
          maxLength={128}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirme sua senha"
          value={signupForm.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          disabled={isLoading}
          maxLength={128}
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
        disabled={isLoading}
      >
        {isLoading ? "Criando conta..." : "Criar Conta e Iniciar Trial"}
      </Button>
      
      <div className="text-center">
        <p className="text-xs text-gray-600">
          Ao criar sua conta, você inicia automaticamente um trial gratuito de 7 dias.
        </p>
      </div>
    </form>
  );
};