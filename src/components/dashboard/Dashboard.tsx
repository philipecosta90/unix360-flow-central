
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  return (
    <div className="space-y-6">
      <DashboardOverview />
    </div>
  );
};
