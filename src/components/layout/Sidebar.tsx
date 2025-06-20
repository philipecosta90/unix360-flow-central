import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  CheckSquare, 
  UserCheck, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Heart,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialTasks } from "@/hooks/useFinancialTasks";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Buscar tarefas vencidas para mostrar badge
  const { stats } = useFinancialTasks();
  const overdueCount = stats?.overdue || 0;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
      isActive: location.pathname === "/" || location.pathname === "/dashboard",
    },
    {
      icon: Users,
      label: "CRM",
      path: "/crm",
      isActive: location.pathname === "/crm",
    },
    {
      icon: DollarSign,
      label: "Financeiro",
      path: "/financeiro",
      isActive: location.pathname === "/financeiro",
    },
    {
      icon: CheckSquare,
      label: "Tarefas & Agenda",
      path: "/tarefas",
      isActive: location.pathname === "/tarefas",
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      icon: UserCheck,
      label: "Clientes",
      path: "/clientes",
      isActive: location.pathname === "/clientes",
    },
    {
      icon: FileText,
      label: "Contratos",
      path: "/contratos",
      isActive: location.pathname === "/contratos",
    },
    {
      icon: Heart,
      label: "Sucesso do Cliente",
      path: "/cs",
      isActive: location.pathname === "/cs",
    },
    {
      icon: Settings,
      label: "Configurações",
      path: "/configuracoes",
      isActive: location.pathname === "/configuracoes",
    },
  ];

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-[#43B26D] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-lg font-semibold text-gray-800">UniX360</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  item.isActive
                    ? 'bg-[#43B26D] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#43B26D] text-white">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || 'Usuário'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
