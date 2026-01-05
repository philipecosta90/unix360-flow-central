
import { useAuth } from "@/hooks/useAuth";
import { useUserValidation } from "@/hooks/useUserValidation";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocation } from "react-router-dom";
import { logger } from "@/utils/logger";
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
import { AnamneseModule } from "@/components/anamnese/AnamneseModule";
import { WhatsAppModule } from "@/components/whatsapp/WhatsAppModule";
import { MessagesModule } from "@/components/messages/MessagesModule";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SubscriptionExpiredDialog } from "@/components/subscription/SubscriptionExpiredDialog";
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
  Shield,
  ClipboardList,
  MessageCircle,
  MessageSquare,
  Bot
} from "lucide-react";
import { Link } from "react-router-dom";
import { MainLogo } from "@/components/layout/MainLogo";
import { BuildVersion } from "@/components/layout/BuildVersion";
import { AgentsModule } from "@/components/agents/AgentsModule";

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();
  const { subscriptionStatus } = useSubscription();
  const location = useLocation();
  
  // Ativar validação periódica de usuário ativo
  useUserValidation();

  // Verificar se o plano está expirado
  const isExpired = subscriptionStatus?.status === 'expired' || 
    (subscriptionStatus && !subscriptionStatus.hasActiveSubscription && subscriptionStatus.status !== 'trial');

  logger.debug('Index component render', {
    user: user ? 'Present' : 'Null',
    loading,
    pathname: location.pathname
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "CRM", path: "/crm" },
    { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
    { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: ClipboardList, label: "Anamnese", path: "/anamnese" },
    { icon: FileText, label: "Contratos", path: "/contratos" },
    { icon: UserCheck, label: "Sucesso do Cliente", path: "/cs" },
    { icon: MessageCircle, label: "Conectar WhatsApp", path: "/whatsapp" },
    { icon: MessageSquare, label: "Mensagens", path: "/mensagens" },
    { icon: Bot, label: "Agentes (teste)", path: "/agentes" },
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
      case '/anamnese':
        return <AnamneseModule />;
      case '/contratos':
        return <ContractsModule />;
      case '/cs':
        return <CSModule />;
      case '/sucesso-cliente':
        return <CSModule />;
      case '/whatsapp':
        return <WhatsAppModule />;
      case '/mensagens':
        return <MessagesModule />;
      case '/agentes':
        return <AgentsModule />;
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
    <div className="min-h-screen bg-background flex flex-col lg:flex-row w-full">
      {/* Overlay de bloqueio quando plano expirado */}
      {isExpired && (
        <div className="fixed inset-0 bg-black/50 z-40 pointer-events-none" />
      )}
      
      {/* Dialog de renovação obrigatória */}
      <SubscriptionExpiredDialog />
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-sidebar border-r border-sidebar-border">
          <div className="flex items-center flex-shrink-0 px-4">
            <MainLogo className="h-16 w-48" />
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 ${
                      location.pathname === item.path
                        ? 'text-sidebar-primary-foreground'
                        : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'
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
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-3 sm:p-4 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
      
      {/* Indicador de versão para debug */}
      <BuildVersion />
    </div>
  );
};

export default Index;
