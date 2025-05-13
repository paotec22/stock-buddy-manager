
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import { Edit2, Trash } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface EditableCellProps {
  isEditing: boolean;
  value: number;
  onEdit: (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => void;
  onStartEdit: () => void;
  isCurrency?: boolean;
}

export function EditableCell({ isEditing, value, onEdit, onStartEdit, isCurrency = false }: EditableCellProps) {
  return (
    <div className="flex items-center space-x-2">
      {isEditing ? (
        <Input
          type="number"
          defaultValue={value}
          className="w-20 sm:w-24 text-sm sm:text-base h-8 px-2 py-1 rounded-md"
          autoFocus
          min="0"
          step={isCurrency ? "0.01" : "1"}
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
            {isCurrency ? formatCurrency(value) : value}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onStartEdit}
          >
            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
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
    <TableCell className="p-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        onClick={onDelete}
      >
        <Trash className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
        <span className="sr-only">Delete item</span>
      </Button>
    </TableCell>
  );
}
