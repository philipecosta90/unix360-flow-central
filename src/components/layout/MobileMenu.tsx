
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  CheckSquare, 
  FileText, 
  UserCheck, 
  Settings as SettingsIcon,
  Shield,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileMenu = ({ isOpen, onOpenChange }: MobileMenuProps) => {
  const location = useLocation();
  const { userProfile } = useAuth();

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

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>UniX360 - Menu</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-[#43B26D] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
