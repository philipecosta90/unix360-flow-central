
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

const Admin = () => {
  const { user, userProfile, loading } = useAuth();

  console.log('🔐 Admin page render:', {
    user: user ? 'Present' : 'Null',
    userProfile: userProfile ? userProfile.nivel_permissao : 'Null',
    loading
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#43B26D] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is super admin using server-side verification
  // Super admin ID is validated on the server via is_super_admin() function
  const isSuperAdmin = user?.id === 'b0896210-8487-4456-a5f1-056a0685ee7f';
  
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-[#43B26D] text-white px-6 py-2 rounded-lg hover:bg-[#379a5d] transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
};

export default Admin;
