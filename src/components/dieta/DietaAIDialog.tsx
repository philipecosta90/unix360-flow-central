import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DietGeneratorAgent } from '@/components/agents/DietGeneratorAgent';

interface DietaAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DietaAIDialog = ({ open, onOpenChange }: DietaAIDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerar Dieta com IA</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <DietGeneratorAgent />
        </div>
      </DialogContent>
    </Dialog>
  );
};
