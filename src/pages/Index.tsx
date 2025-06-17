
import { AuthPage } from "@/components/auth/AuthPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#43B26D]/10 to-[#43B26D]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#43B26D] rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">X</span>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthPage onAuthSuccess={() => window.location.reload()} />;
  }

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  // Adaptar dados do perfil para o Dashboard
  const userData = {
    name: userProfile.nome,
    email: user.email,
    company: userProfile.empresas?.nome || 'Empresa',
    role: userProfile.nivel_permissao
  };

  return <Dashboard user={userData} onLogout={handleLogout} />;
};

export default Index;
