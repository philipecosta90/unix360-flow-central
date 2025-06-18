
import { CRMCardSkeleton } from "./CRMCardSkeleton";

export const CRMKanbanLoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <CRMCardSkeleton />
          <CRMCardSkeleton />
        </div>
      ))}
    </div>
  );
};
