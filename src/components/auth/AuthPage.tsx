
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ValidationErrors } from "./ValidationErrors";
import { LockoutWarning } from "./LockoutWarning";
import { LoginFormTab } from "./LoginFormTab";

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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#43B26D] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">X</span>
          </div>
          <CardTitle className="text-2xl">UniX360</CardTitle>
          <CardDescription>
            Acesso restrito por convite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ValidationErrors errors={validationErrors} />
          <LockoutWarning isLockedOut={isLockedOut} />

          <div className="w-full">
            <LoginFormTab
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              loginAttempts={loginAttempts}
              setLoginAttempts={setLoginAttempts}
              isLockedOut={isLockedOut}
              setValidationErrors={setValidationErrors}
              onAccountLockout={handleAccountLockout}
            />
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não possui acesso? Entre em contato com o administrador.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
