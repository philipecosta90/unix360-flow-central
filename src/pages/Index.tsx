
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { CRMModule } from "@/components/crm/CRMModule";
import { FinancialModule } from "@/components/financial/FinancialModule";
import { TasksModule } from "@/components/tasks/TasksModule";
import { ClientsModule } from "@/components/clients/ClientsModule";
import { ContractsModule } from "@/components/contracts/ContractsModule";
import { CSModule } from "@/components/cs/CSModule";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  console.log('📄 Index component render:', {
    user: user ? 'Present' : 'Null',
    loading,
    pathname: location.pathname
  });

  if (loading) {
    console.log('⏳ Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#43B26D] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('👤 No user, showing AuthPage');
    return <AuthPage />;
  }

  console.log('✅ User authenticated, rendering dashboard');

  const renderContent = () => {
    switch (location.pathname) {
      case '/crm':
        return <CRMModule />;
      case '/financeiro':
        return <FinancialModule />;
      case '/tarefas':
        return <TasksModule />;
      case '/clientes':
        return <ClientsModule />;
      case '/contratos':
        return <ContractsModule />;
      case '/cs':
        return <CSModule />;
      case '/sucesso-cliente':
        return <CSModule />;
      case '/dashboard':
      case '/':
      default:
        return <Dashboard user={user} onLogout={signOut} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          user={user} 
          onLogout={signOut}
          onToggleSidebar={() => {}}
        />
        <main className="p-6 flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
