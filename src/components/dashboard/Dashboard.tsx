
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardOverview />
        </div>
        <div>
          <SubscriptionStatus />
        </div>
      </div>
    </div>
  );
};
