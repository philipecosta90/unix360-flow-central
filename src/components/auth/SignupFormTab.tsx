
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Shield } from "lucide-react";

export const SignupFormTab = () => {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-gray-400" />
        </div>
        <CardTitle className="text-xl">Acesso Restrito</CardTitle>
        <CardDescription>
          O cadastro público foi desabilitado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Sistema por Convite</h4>
              <p className="text-sm text-blue-700 mt-1">
                O acesso ao UniX360 é restrito e controlado por administradores.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">Como obter acesso?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Entre em contato com um administrador para solicitar um convite.
                Você receberá um email com instruções para criar sua conta.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Já possui uma conta? Use a aba "Entrar" para fazer login.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
