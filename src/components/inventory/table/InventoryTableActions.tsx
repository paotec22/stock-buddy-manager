import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface InventoryTableActionsProps {
  selectedItems: number[];
  onBulkDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function InventoryTableActions({ selectedItems, onBulkDelete, isDeleting }: InventoryTableActionsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-muted p-2 rounded-md">
      <span className="text-sm sm:text-base">{selectedItems.length} items selected</span>
      <Button
        variant="destructive"
        size="sm"
        className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-4"
        onClick={onBulkDelete}
        disabled={isDeleting}
      >
        <div className="flex items-center gap-2">
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{isDeleting ? "Deleting..." : "Delete Selected"}</span>
        </div>
      </Button>
    </div>
  );
}