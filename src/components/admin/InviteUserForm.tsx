
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { getPermissionIcon, getPermissionDescription } from "@/utils/permissionUtils";
import { sanitizeNameInput } from "@/utils/inputValidation";

interface InviteForm {
  email: string;
  nome: string;
  nivel_permissao: "admin" | "editor" | "visualizacao" | "operacional";
}

interface InviteUserFormProps {
  inviteForm: InviteForm;
  setInviteForm: React.Dispatch<React.SetStateAction<InviteForm>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const permissionLevels = ['admin', 'operacional', 'visualizacao'] as const;

export const InviteUserForm = ({ inviteForm, setInviteForm, isLoading, onSubmit }: InviteUserFormProps) => {
  // Verificar se todos os campos obrigatórios estão preenchidos
  const isFormValid = inviteForm.email.trim() !== '' && 
                     inviteForm.nome.trim() !== '' && 
                     inviteForm.nivel_permissao;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email do usuário</Label>
        <Input
          id="email"
          type="email"
          placeholder="usuario@exemplo.com"
          value={inviteForm.email}
          onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          type="text"
          placeholder="João da Silva Santos"
          value={inviteForm.nome}
          onChange={(e) => setInviteForm(prev => ({ ...prev, nome: sanitizeNameInput(e.target.value) }))}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nivel_permissao">Nível de permissão</Label>
        <Select
          value={inviteForm.nivel_permissao}
          onValueChange={(value: "admin" | "operacional" | "visualizacao") => 
            setInviteForm(prev => ({ ...prev, nivel_permissao: value }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {permissionLevels.map((level) => {
              const IconComponent = getPermissionIcon(level);
              return (
                <SelectItem key={level} value={level}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" />
                    <div>
                      <div className="font-medium">
                        {level === 'admin' && 'Administrador'}
                        {level === 'operacional' && 'Operacional'}
                        {level === 'visualizacao' && 'Visualização'}
                      </div>
                      <div className="text-sm text-gray-500">{getPermissionDescription(level)}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-[#43B26D] hover:bg-[#37A05B]"
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <>
            <UserPlus className="h-4 w-4 mr-2 animate-spin" />
            Criando usuário...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Usuário
          </>
        )}
      </Button>
    </form>
  );
};
