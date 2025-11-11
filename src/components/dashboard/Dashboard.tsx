
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Barra de Status da Assinatura no Topo */}
      <SubscriptionStatus />
      
      {/* Dashboard Overview */}
      <DashboardOverview />
    </div>
  );
};
