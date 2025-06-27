import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenu } from "./MobileMenu";
import { CompanyLogo } from "./CompanyLogo";
import { MainLogo } from "./MainLogo";

interface HeaderProps {
  user: any;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export const Header = ({ user, onLogout, onToggleSidebar }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const safeName = (user?.name ?? "").toString();
  const safeEmail = (user?.email ?? "").toString();
  const safeCompany = (user?.company ?? "").toString();
  
  // Função para obter saudação personalizada
  const getWelcomeMessage = () => {
    if (safeName.trim()) {
      return `Bem-vindo, ${safeName}`;
    }
    return "Bem-vindo!";
  };
  
  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <MobileMenu 
            isOpen={mobileMenuOpen} 
            onOpenChange={setMobileMenuOpen} 
          />
          
          {/* Logomarca no mobile - 120px conforme solicitado */}
          <div className="block md:hidden">
            <MainLogo className="h-8 w-30" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {getWelcomeMessage()}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{safeCompany || "Empresa"}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-[#43B26D] text-white text-sm">
                  {safeName.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{safeName || "Usuário"}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {safeEmail || "email@exemplo.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
