
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
  );
}
