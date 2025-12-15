
import { useState } from "react";
import { Bell, ChevronDown, User, LogOut, Settings, Moon, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { MainLogo } from "./MainLogo";
import { MobileMenu } from "./MobileMenu";
import { NotificationsPanel } from "./NotificationsPanel";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { useNotifications } from "@/hooks/useNotifications";
import { useSubscription } from "@/hooks/useSubscription";

export const Header = () => {
  const { user, userProfile } = useAuth();
  const { subscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

  const CAKTO_PAYMENT_URL = 'https://pay.cakto.com.br/chho9do_565429';

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-background shadow-sm border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile menu and company name */}
        <div className="flex items-center space-x-4">
          <div className="lg:hidden">
            <MobileMenu isOpen={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} />
          </div>
          <div className="text-2xl font-bold text-primary">
            UniX360
          </div>
        </div>

        {/* User menu and notifications */}
        <div className="flex items-center space-x-4">
          {/* Botão de assinatura - aparece apenas em trial ou expirado */}
          {buttonConfig && (
            <Button 
              onClick={() => window.open(CAKTO_PAYMENT_URL, '_blank')}
              className={`${buttonConfig.className} text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hidden sm:flex`}
              size="sm"
            >
              {buttonConfig.text}
            </Button>
          )}
          
          <FeedbackDialog />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {userProfile?.nome || user?.email?.split('@')[0] || 'Usuário'}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>Modo {theme === "dark" ? "Claro" : "Noturno"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <NotificationsPanel 
        open={showNotifications} 
        onOpenChange={setShowNotifications} 
      />
    </header>
  );
};
