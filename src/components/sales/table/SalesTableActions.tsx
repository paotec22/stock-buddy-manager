import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SalesTableActionsProps {
  selectedItems: string[];
  onBulkDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function SalesTableActions({ selectedItems, onBulkDelete, isDeleting }: SalesTableActionsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <Button
      variant="destructive"
      size="sm"
      className="h-9 hover-scale"
      onClick={onBulkDelete}
      disabled={isDeleting}
    >
      <div className="flex items-center gap-2">
        <Trash2 className="h-4 w-4" />
        <span>{isDeleting ? "Deleting..." : `Delete Selected (${selectedItems.length})`}</span>
      </div>
    </Button>
  );
}
