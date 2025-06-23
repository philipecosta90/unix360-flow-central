import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  CheckSquare, 
  FileText, 
  UserCheck, 
  Settings,
  Shield  // New import for admin icon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Sidebar = () => {
  const location = useLocation();
  const { userProfile } = useAuth(); // Add this to get user profile

  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "CRM", path: "/crm" },
    { icon: DollarSign, label: "Financeiro", path: "/financeiro" },
    { icon: CheckSquare, label: "Tarefas", path: "/tarefas" },
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: FileText, label: "Contratos", path: "/contratos" },
    { icon: UserCheck, label: "Sucesso do Cliente", path: "/cs" },
    { icon: Settings, label: "Configurações", path: "/configuracoes" },
  ];

  // Add admin menu item if user is admin
  if (userProfile?.nivel_permissao === 'admin') {
    menuItems.push({ icon: Shield, label: "Admin", path: "/admin" });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-64 p-6 flex flex-col">
        <SheetHeader className="mb-6 pl-0">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navegue pelas opções do sistema.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center space-x-2 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors duration-200 ${location.pathname === item.path ? 'bg-gray-100 font-semibold' : ''}`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <SheetHeader className="mt-auto mb-2 pl-0">
          <SheetTitle>Minha Conta</SheetTitle>
        </SheetHeader>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-0 justify-start w-full font-normal">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <span>{userProfile?.nome || 'Carregando...'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SheetContent>
    </Sheet>
  );
};
