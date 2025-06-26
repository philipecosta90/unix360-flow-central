
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserManagement } from "@/hooks/useUserManagement";
import { KeyRound } from "lucide-react";

export const ChangePasswordForm = () => {
  const { passwordForm, setPasswordForm, isLoading, handleChangePassword } = useUserManagement();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha Atual</Label>
            <Input
              id="senhaAtual"
              type="password"
              value={passwordForm.senhaAtual}
              onChange={(e) => setPasswordForm({ ...passwordForm, senhaAtual: e.target.value })}
              placeholder="Digite sua senha atual"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha</Label>
            <Input
              id="novaSenha"
              type="password"
              value={passwordForm.novaSenha}
              onChange={(e) => setPasswordForm({ ...passwordForm, novaSenha: e.target.value })}
              placeholder="Digite a nova senha (mín. 6 caracteres)"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
            <Input
              id="confirmarSenha"
              type="password"
              value={passwordForm.confirmarSenha}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmarSenha: e.target.value })}
              placeholder="Confirme a nova senha"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Alterando senha..." : "Alterar Senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
