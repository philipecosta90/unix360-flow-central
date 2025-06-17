
import { AuthPage } from "@/components/auth/AuthPage";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle authentication state changes
  useEffect(() => {
    console.log('Auth state:', { user: !!user, userProfile: !!userProfile, loading });
    
    // If user is authenticated but no profile, stay on loading
    if (user && !userProfile && !loading) {
      console.log('User authenticated but no profile found');
    }
    
    // If user is authenticated and has profile, ensure we're on the main page
    if (user && userProfile) {
      console.log('User fully authenticated with profile');
    }
  }, [user, userProfile, loading]);

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
    return <AuthPage />;
  }

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/", { replace: true });
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
