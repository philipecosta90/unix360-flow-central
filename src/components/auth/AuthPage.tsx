import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ValidationErrors } from "./ValidationErrors";
import { LockoutWarning } from "./LockoutWarning";
import { LoginFormTab } from "./LoginFormTab";
import { SignupFormTab } from "./SignupFormTab";
import { CompanyLogo } from "@/components/layout/CompanyLogo";
import { Shield, Sparkles } from "lucide-react";

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{ 
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '50px 50px' 
        }} 
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Decorative badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-scale-in">
            <Sparkles className="w-4 h-4" />
            <span>Gestão Inteligente</span>
          </div>
        </div>

        <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center mb-4 animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
                <CompanyLogo className="relative w-[100px] h-auto mb-2 drop-shadow-lg" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                UniX360
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {activeTab === "login" 
                ? "Bem-vindo de volta! Entre na sua conta" 
                : "Crie sua conta e comece agora"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-2">
            <ValidationErrors errors={validationErrors} />
            <LockoutWarning isLockedOut={isLockedOut} />

            <Tabs 
              defaultValue="login" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
                >
                  Criar Conta
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0 animate-fade-in">
                <LoginFormTab
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  loginAttempts={loginAttempts}
                  setLoginAttempts={setLoginAttempts}
                  isLockedOut={isLockedOut}
                  setValidationErrors={setValidationErrors}
                  onAccountLockout={handleAccountLockout}
                />
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0 animate-fade-in">
                <SignupFormTab
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  setValidationErrors={setValidationErrors}
                />
              </TabsContent>
            </Tabs>

            {/* Security badge */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
                <span>Conexão segura com criptografia SSL</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          © {new Date().getFullYear()} UniX360. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
