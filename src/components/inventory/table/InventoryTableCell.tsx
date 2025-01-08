import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import { Edit2, Trash } from "lucide-react";
import { InventoryItem } from "@/utils/inventoryUtils";

interface EditableCellProps {
  isEditing: boolean;
  value: number;
  onEdit: (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  onStartEdit: () => void;
}

export function EditableCell({ isEditing, value, onEdit, onStartEdit }: EditableCellProps) {
  return (
    <div className="flex items-center space-x-2">
      {isEditing ? (
        <Input
          type="number"
          defaultValue={value}
          className="w-20 sm:w-24 text-sm sm:text-base"
          autoFocus
          onBlur={onEdit}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onEdit(e);
            }
          }}
        />
      ) : (
        <>
          <span className={`text-sm sm:text-base ${value === 0 ? 'dark:text-red-400 text-red-600 font-semibold' : ''}`}>
            {value}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-8 sm:w-8"
            onClick={onStartEdit}
          >
            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </>
      )}
    </div>
  );
}

interface DeleteCellProps {
  onDelete: () => void;
}

export function DeleteCell({ onDelete }: DeleteCellProps) {
  return (
    <TableCell>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 sm:h-8 sm:w-8"
        onClick={onDelete}
      >
        <Trash className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
        <span className="sr-only">Delete item</span>
      </Button>
    </TableCell>
  );
}