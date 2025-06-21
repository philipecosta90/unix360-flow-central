
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PasswordStrength } from "@/components/ui/password-strength";
import { validateAndSanitize, loginFormSchema, signupFormSchema, sanitizeInput } from "@/utils/inputValidation";

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nome: "",
    nomeEmpresa: "",
    cnpj: ""
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  const handleAccountLockout = () => {
    setIsLockedOut(true);
    setTimeout(() => {
      setIsLockedOut(false);
      setLoginAttempts(0);
    }, LOCKOUT_DURATION);
    
    toast({
      title: "Conta temporariamente bloqueada",
      description: `Muitas tentativas de login. Tente novamente em 15 minutos.`,
      variant: "destructive",
    });
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

    // Validate input
    const validation = validateAndSanitize(loginForm, loginFormSchema);
    if (!validation.success) {
      setValidationErrors(validation.errors);
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
        setLoginAttempts(prev => prev + 1);
        
        if (loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
          handleAccountLockout();
          return;
        }

        toast({
          title: "Erro no login",
          description: `Credenciais inválidas. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - loginAttempts - 1}`,
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = validateAndSanitize(signupForm, signupFormSchema);
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

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: sanitizeInput(value) }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSignupInputChange = (field: string, value: string) => {
    const sanitizedValue = field === 'password' || field === 'confirmPassword' 
      ? value // Don't sanitize passwords
      : sanitizeInput(value);
    
    setSignupForm(prev => ({ ...prev, [field]: sanitizedValue }));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#43B26D]/10 to-[#43B26D]/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#43B26D] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">X</span>
          </div>
          <CardTitle className="text-2xl">UniX360</CardTitle>
          <CardDescription>
            Plataforma de gestão empresarial unificada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="text-sm text-red-600 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {isLockedOut && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-600">
                Conta temporariamente bloqueada devido a muitas tentativas de login.
              </p>
            </div>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginForm.email}
                    onChange={(e) => handleLoginInputChange('email', e.target.value)}
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
                    onChange={(e) => handleLoginInputChange('password', e.target.value)}
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
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={signupForm.nome}
                    onChange={(e) => handleSignupInputChange('nome', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('nomeEmpresa', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('cnpj', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('email', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('password', e.target.value)}
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
                    onChange={(e) => handleSignupInputChange('confirmPassword', e.target.value)}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
