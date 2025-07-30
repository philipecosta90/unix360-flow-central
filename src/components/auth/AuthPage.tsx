
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ValidationErrors } from "./ValidationErrors";
import { LockoutWarning } from "./LockoutWarning";
import { LoginFormTab } from "./LoginFormTab";
import { SignupFormTab } from "./SignupFormTab";
import { AccessDeniedMessage } from "./AccessDeniedMessage";
import { CompanyLogo } from "@/components/layout/CompanyLogo";

export const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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
    <div className="min-h-screen bg-gradient-to-br from-[#43B26D]/10 to-[#43B26D]/5 flex items-center justify-center p-4">
      <AccessDeniedMessage />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center mb-4">
            <CompanyLogo className="w-[90px] h-auto mb-1" />
            <CardTitle className="text-2xl">UniX360</CardTitle>
          </div>
          <CardDescription>
            Entre ou crie sua conta para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValidationErrors errors={validationErrors} />
          <LockoutWarning isLockedOut={isLockedOut} />

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
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
            
            <TabsContent value="signup" className="mt-6">
              <SignupFormTab
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setValidationErrors={setValidationErrors}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
