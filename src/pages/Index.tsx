
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { AuthPage } from "@/components/auth/AuthPage";
import { Header } from "@/components/layout/Header";
import { CompanyLogo } from "@/components/layout/CompanyLogo";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { CRMModule } from "@/components/crm/CRMModule";
import { FinancialModule } from "@/components/financial/FinancialModule";
import { TasksModule } from "@/components/tasks/TasksModule";
import { ClientsModule } from "@/components/clients/ClientsModule";
import { ContractsModule } from "@/components/contracts/ContractsModule";
import { CSModule } from "@/components/cs/CSModule";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import Settings from "./Settings";
import Admin from "./Admin";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  CheckSquare, 
  FileText, 
  UserCheck, 
  Settings as SettingsIcon,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { MainLogo } from "@/components/layout/MainLogo";

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const location = useLocation();

  console.log('📄 Index component render:', {
    user: user ? 'Present' : 'Null',
    loading,
    pathname: location.pathname
  });

  if (loading) {
    console.log('⏳ Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
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

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "CRM", path: "/crm" },
    { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
    { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: FileText, label: "Contratos", path: "/contratos" },
    { icon: UserCheck, label: "Sucesso do Cliente", path: "/cs" },
    { icon: SettingsIcon, label: "Configurações", path: "/configuracoes" },
  ];

  // Add admin menu item if user is admin
  if (userProfile?.nivel_permissao === 'admin') {
    menuItems.push({ icon: Shield, label: "Admin", path: "/admin" });
  }

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
      case '/admin':
        return <Admin />;
      case '/configuracoes':
        return <Settings />;
      case '/dashboard':
      case '/':
      default:
        return <Dashboard user={user} onLogout={signOut} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row w-full">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex items-center flex-shrink-0 px-4">
            <MainLogo className="h-12 w-40" />
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-[#43B26D] text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 ${
                      location.pathname === item.path
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-64 min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-3 sm:p-4 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
