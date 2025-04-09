
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InventoryTableActionsProps {
  selectedItems: number[];
  onBulkDelete: () => Promise<void>;
  isDeleting: boolean;
}

export function InventoryTableActions({ selectedItems, onBulkDelete, isDeleting }: InventoryTableActionsProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between bg-destructive/5 p-4 rounded-lg border border-destructive/10">
      <span className="text-sm sm:text-base font-medium">
        {selectedItems.length} items selected
      </span>
      <Button
        variant="destructive"
        size="sm"
        className="h-9 hover-scale"
        onClick={onBulkDelete}
        disabled={isDeleting}
      >
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span>{isDeleting ? "Deleting..." : "Delete Selected"}</span>
        </div>
      </Button>
    </div>
  );
}
