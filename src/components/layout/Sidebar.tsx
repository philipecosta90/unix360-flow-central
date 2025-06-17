
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  folder, 
  folder-check,
  plus,
  check,
  mail,
} from "lucide-react";

interface SidebarProps {
  currentModule: string;
  onModuleChange: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: folder },
  { id: "crm", label: "CRM", icon: folder-check },
  { id: "clients", label: "Clientes", icon: User },
  { id: "financial", label: "Financeiro", icon: plus },
  { id: "tasks", label: "Tarefas", icon: check },
  { id: "contracts", label: "Contratos", icon: mail },
];

export const Sidebar = ({ currentModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) => {
  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#43B26D] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">X</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-900">UniX360</h1>
              <p className="text-xs text-gray-500">Gestão unificada</p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-8 px-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentModule === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  currentModule === item.id 
                    ? "bg-[#43B26D] text-white hover:bg-[#37A05B]" 
                    : "text-gray-700 hover:bg-gray-100",
                  collapsed && "px-3"
                )}
                onClick={() => onModuleChange(item.id)}
              >
                <IconComponent className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
