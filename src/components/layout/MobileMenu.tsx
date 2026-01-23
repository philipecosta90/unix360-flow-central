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
  UserCheck, 
  Settings as SettingsIcon,
  Shield,
  Menu,
  CreditCard,
  MessageCircle,
  MessageSquare,
  Bot,
  Package,
  ClipboardList,
  Utensils,
  Dumbbell,
  FileSignature
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { MainLogo } from "./MainLogo";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileMenu = ({ isOpen, onOpenChange }: MobileMenuProps) => {
  const location = useLocation();
  const { userProfile } = useAuth();
  const { subscriptionStatus } = useSubscription();

  const CAKTO_PAYMENT_URL = 'https://pay.cakto.com.br/chho9do_565429';

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "CRM", path: "/crm" },
    { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
    { icon: Package, label: "Serviços", path: "/servicos" },
    { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: ClipboardList, label: "Anamnese", path: "/anamnese" },
    { icon: Utensils, label: "Dieta (beta)", path: "/dieta" },
    { icon: Dumbbell, label: "Treino (beta)", path: "/treino" },
    { icon: UserCheck, label: "Sucesso do Cliente", path: "/cs" },
    { icon: MessageCircle, label: "Conectar WhatsApp", path: "/whatsapp" },
    { icon: MessageSquare, label: "Mensagens", path: "/mensagens" },
    { icon: Bot, label: "Agentes (beta)", path: "/agentes" },
    { icon: FileSignature, label: "Contratos & Notas (beta)", path: "/contratos" },
    { icon: SettingsIcon, label: "Configurações", path: "/configuracoes" },
  ];

  // Add admin menu item if user is admin
  if (userProfile?.nivel_permissao === 'admin') {
    menuItems.push({ icon: Shield, label: "Admin", path: "/admin" });
  }

  // Determina se deve mostrar botão e qual texto
  const getSubscriptionButton = () => {
    if (!subscriptionStatus) return null;
    
    const status = subscriptionStatus.status;
    
    // Durante trial: mostrar "ASSINE JÁ"
    if (status === 'trial') {
      return {
        text: 'ASSINE JÁ',
        className: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
      };
    }
    
    // Expirado ou cancelado: mostrar "RENOVE SEU PLANO"
    if (status === 'expired' || status === 'canceled' || !subscriptionStatus.hasActiveSubscription) {
      return {
        text: 'RENOVE SEU PLANO',
        className: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
      };
    }
    
    // Assinatura ativa: não mostrar botão
    return null;
  };

  const buttonConfig = getSubscriptionButton();

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
          <DrawerTitle className="flex items-center justify-center">
            <MainLogo className="h-10 w-[150px]" />
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          {/* Botão de assinatura mobile */}
          {buttonConfig && (
            <Button 
              onClick={() => {
                window.open(CAKTO_PAYMENT_URL, '_blank');
                onOpenChange(false);
              }}
              className={`${buttonConfig.className} text-white font-semibold w-full mb-4 shadow-lg`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {buttonConfig.text}
            </Button>
          )}
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
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
