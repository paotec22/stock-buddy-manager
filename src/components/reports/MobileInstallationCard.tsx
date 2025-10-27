import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X, Trash2, Edit, ChevronRight } from "lucide-react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { formatCurrency } from "@/utils/formatters";

interface Installation {
  id: number;
  description: string;
  amount: number;
  installation_date: string;
  user_id: string;
  created_at: string;
}

interface MobileInstallationCardProps {
  installation: Installation;
  date: string;
  onEdit: (installation: Installation) => void;
  onSave: (id: number, values: Partial<Installation>) => void;
  onCancel: () => void;
  onDelete: (id: number) => void;
  isEditing: boolean;
  editValues: Partial<Installation>;
  onEditValuesChange: (values: Partial<Installation>) => void;
}

export function MobileInstallationCard({
  installation,
  date,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  isEditing,
  editValues,
  onEditValuesChange,
}: MobileInstallationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["rgba(239, 68, 68, 0.1)", "transparent", "rgba(34, 197, 94, 0.1)"]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      setShowActions(true);
    } else if (info.offset.x > 50) {
      onEdit(installation);
    } else {
      setShowActions(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-card border rounded-lg p-4 space-y-3 shadow-sm">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <Input
            value={editValues.description || ''}
            onChange={(e) => onEditValuesChange({ ...editValues, description: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Amount</label>
          <Input
            type="number"
            value={editValues.amount || ''}
            onChange={(e) => onEditValuesChange({ ...editValues, amount: parseFloat(e.target.value) })}
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="default" onClick={() => onSave(installation.id, editValues)} className="flex-1 h-11">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="h-11 min-w-11">
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(installation.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 min-w-11"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, background }}
        className="bg-card border rounded-lg p-4 shadow-sm touch-pan-y"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{installation.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{date}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-primary">{formatCurrency(installation.amount)}</p>
          </div>
        </div>

        {showActions ? (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onEdit(installation);
                setShowActions(false);
              }}
              className="flex-1 h-11"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onDelete(installation.id);
                setShowActions(false);
              }}
              className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 h-11"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              Swipe for actions
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
