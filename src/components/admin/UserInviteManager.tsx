
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useUserInvite } from "@/hooks/useUserInvite";
import { InviteUserForm } from "./InviteUserForm";
import { InviteInfoSection } from "./InviteInfoSection";

export const UserInviteManager = () => {
  const { inviteForm, setInviteForm, isLoading, handleInviteUser } = useUserInvite();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Convidar Novo Usuário
        </CardTitle>
        <CardDescription>
          Envie um convite por email para um novo usuário acessar o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InviteUserForm
          inviteForm={inviteForm}
          setInviteForm={setInviteForm}
          isLoading={isLoading}
          onSubmit={handleInviteUser}
        />
        <InviteInfoSection />
      </CardContent>
    </Card>
  );
};
