import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateAndSanitize, signupSchema, sanitizeInput, sanitizeNameInput, sanitizeNameInputOnChange } from "@/utils/inputValidation";

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
      // Apply final sanitization before submitting
      const sanitizedForm = {
        ...signupForm,
        nome: sanitizeNameInput(signupForm.nome),
        nomeEmpresa: sanitizeNameInput(signupForm.nomeEmpresa)
      };
      
      console.log('🚀 [SIGNUP] Iniciando processo de cadastro...', {
        nome: sanitizedForm.nome,
        email: sanitizedForm.email,
        nomeEmpresa: sanitizedForm.nomeEmpresa
      });

      // Verificar se já existe uma empresa com este e-mail
      const { data: existingCompany, error: companyError } = await supabase
        .from('empresas')
        .select('id, nome, email')
        .eq('email', sanitizedForm.email)
        .single();

      if (!companyError && existingCompany) {
        console.log('⚠️ [SIGNUP] Empresa já existe com este email');
        toast({
          title: "Email já cadastrado",
          description: "Já existe uma empresa com este email. Tente fazer login ou entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      // Create user with signup
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedForm.email,
        password: sanitizedForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nome: sanitizedForm.nome,
            nome_empresa: sanitizedForm.nomeEmpresa
          }
        }
      });

      if (error) {
        console.error('❌ [SIGNUP] Erro no cadastro:', error);
        
        if (error.message.includes("User already registered") || error.message.includes("already been registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Já existe uma conta com este email. Tente fazer login ou use um email diferente.",
            variant: "destructive",
          });
        } else if (error.message.includes("Invalid email")) {
          toast({
            title: "Email inválido",
            description: "Por favor, digite um email válido.",
            variant: "destructive",
          });
        } else if (error.message.includes("Password")) {
          toast({
            title: "Senha inválida",
            description: "A senha deve ter pelo menos 6 caracteres.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: `Erro: ${error.message}. Tente novamente.`,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        console.log('✅ [SIGNUP] Cadastro realizado com sucesso!', data.user.id);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta e ativar o acesso ao sistema.",
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
      sanitizedValue = sanitizeNameInputOnChange(value); // Use onChange-specific sanitization for names
    } else {
      sanitizedValue = sanitizeInput(value); // Use general sanitization for other fields
    }
    
    setSignupForm(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear validation errors when user starts typing
    setValidationErrors([]);
  };

  const handleInputBlur = (field: keyof typeof signupForm) => {
    if (field === 'nome' || field === 'nomeEmpresa') {
      setSignupForm(prev => ({ 
        ...prev, 
        [field]: sanitizeNameInput(prev[field]) // Apply full sanitization (with trim) on blur
      }));
    }
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
          onBlur={() => handleInputBlur('nome')}
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
          onBlur={() => handleInputBlur('nomeEmpresa')}
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
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isLoading}
      >
        {isLoading ? "Criando conta..." : "Criar Conta"}
      </Button>
      
      <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Ao criar sua conta, você terá acesso completo ao sistema.
          </p>
      </div>
    </form>
  );
};