import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { RenewPlanDialog } from "./RenewPlanDialog";

interface RenewPlanButtonProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export const RenewPlanButton = ({ clientId, clientName, onSuccess }: RenewPlanButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-primary hover:text-primary/80 hover:bg-primary/10"
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
      >
        <RefreshCw className="w-4 h-4 mr-1" />
        Renovar
      </Button>
      <RenewPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clientId={clientId}
        clientName={clientName}
        onSuccess={onSuccess}
      />
    </>
  );
};
