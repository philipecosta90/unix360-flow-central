import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface FinancialFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClearFilters: () => void;
}
export const FinancialFilters = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters
}: FinancialFiltersProps) => {
  return <div className="p-4 rounded-lg border bg-card">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data Inicial</Label>
          <Input id="startDate" type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} className="w-40" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Data Final</Label>
          <Input id="endDate" type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} className="w-40" />
        </div>

        <Button variant="outline" onClick={onClearFilters} className="h-10">
          Limpar Filtros
        </Button>
      </div>
    </div>;
};