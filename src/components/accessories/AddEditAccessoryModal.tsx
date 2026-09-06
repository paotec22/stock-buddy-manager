import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccessoryItem, ACCESSORY_CATEGORIES, NewAccessoryItem } from "@/types/accessories";
import { toast } from "sonner";
import { Wrench, Sparkles, HelpCircle } from "lucide-react";

interface AddEditAccessoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: NewAccessoryItem) => Promise<void>;
  editingItem?: AccessoryItem | null;
  defaultLocation?: string;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];
const UNITS = ["pcs", "sets", "pairs", "meters", "packs", "rolls"];
const CONDITIONS: AccessoryItem["condition"][] = ["New", "Refurbished", "Salvaged", "OEM"];

export function AddEditAccessoryModal({
  open,
  onOpenChange,
  onSave,
  editingItem,
  defaultLocation = "Ikeja",
}: AddEditAccessoryModalProps) {
  const [name, setName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [category, setCategory] = useState<string>("General Spares");
  const [compatibleWith, setCompatibleWith] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState<string>("pcs");
  const [isUnpriced, setIsUnpriced] = useState<boolean>(true); // default unpriced for spare parts
  const [price, setPrice] = useState<string>("");
  const [location, setLocation] = useState<string>(defaultLocation);
  const [condition, setCondition] = useState<AccessoryItem["condition"]>("New");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form state when modal opens or editingItem changes
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || "");
      setPartNumber(editingItem.part_number || "");
      setCategory(editingItem.category || "General Spares");
      setCompatibleWith(editingItem.compatible_with || "");
      setQuantity(String(editingItem.quantity ?? 0));
      setUnit(editingItem.unit || "pcs");
      if (editingItem.price !== null && editingItem.price !== undefined && editingItem.price > 0) {
        setIsUnpriced(false);
        setPrice(String(editingItem.price));
      } else {
        setIsUnpriced(true);
        setPrice("");
      }
      setLocation(editingItem.location || defaultLocation);
      setCondition(editingItem.condition || "New");
      setNotes(editingItem.notes || "");
    } else {
      setName("");
      setPartNumber("");
      setCategory("General Spares");
      setCompatibleWith("");
      setQuantity("1");
      setUnit("pcs");
      setIsUnpriced(true);
      setPrice("");
      setLocation(defaultLocation === "All Locations" ? "Ikeja" : defaultLocation);
      setCondition("New");
      setNotes("");
    }
  }, [editingItem, open, defaultLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the spare part / accessory name");
      return;
    }

    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast.error("Please enter a valid stock quantity (0 or greater)");
      return;
    }

    let finalPrice: number | null = null;
    if (!isUnpriced && price.trim() !== "") {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        toast.error("Please enter a valid positive price or check 'No specific price'");
        return;
      }
      finalPrice = parsedPrice;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        part_number: partNumber.trim() || null,
        category: category || "General Spares",
        compatible_with: compatibleWith.trim() || null,
        quantity: qtyNum,
        unit: unit || "pcs",
        price: finalPrice,
        location: location || "Ikeja",
        condition,
        notes: notes.trim() || null,
      });

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save spare part");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Wrench className="h-4 w-4" />
            </div>
            <span>{editingItem ? "Edit Spare Part / Accessory" : "Add Spare Part to Inventory"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Part Name */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-name" className="text-xs font-semibold">
              Part Name / Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Curtain Motor Drive Pulley, 12V Battery Pack..."
              required
            />
          </div>

          {/* Part Number & Compatibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-part-no" className="text-xs font-semibold">
                Part # / SKU <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="acc-part-no"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. MOT-PL-01"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-compat" className="text-xs font-semibold">
                Compatible Equipment <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input
                id="acc-compat"
                value={compatibleWith}
                onChange={(e) => setCompatibleWith(e.target.value)}
                placeholder="e.g. Tuya Motors, Telescopic Tracks"
              />
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-category" className="text-xs font-semibold">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="acc-category">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {ACCESSORY_CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-condition" className="text-xs font-semibold">
                Condition
              </Label>
              <Select value={condition} onValueChange={(val: any) => setCondition(val)}>
                <SelectTrigger id="acc-condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity & Unit & Location */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-quantity" className="text-xs font-semibold">
                Stock Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="acc-quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-unit" className="text-xs font-semibold">
                Unit
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="acc-unit">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="acc-location" className="text-xs font-semibold">
                Location
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="acc-location">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Section (Core Requirement: spare parts may not have a specific price) */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="acc-unpriced"
                checked={isUnpriced}
                onCheckedChange={(checked) => {
                  setIsUnpriced(Boolean(checked));
                  if (checked) setPrice("");
                }}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="acc-unpriced" className="text-xs font-semibold cursor-pointer">
                  No specific price (Variable / On Request / Service part)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Check this if this spare part does not have a fixed sales price, or is priced on demand or provided under warranty.
                </p>
              </div>
            </div>

            {!isUnpriced && (
              <div className="space-y-1.5 pt-1 pl-6">
                <Label htmlFor="acc-price" className="text-xs font-semibold">
                  Estimated / Standard Unit Price (₦)
                </Label>
                <Input
                  id="acc-price"
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 4500"
                  className="bg-background"
                />
              </div>
            )}
          </div>

          {/* Notes & Bin Location */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-notes" className="text-xs font-semibold">
              Notes & Shelf/Bin Location <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="acc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stored in shelf B3; test with multimeter before dispatch; fits 2024 curtain tracks"
              rows={2}
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary">
              {isSubmitting
                ? "Saving..."
                : editingItem
                ? "Save Changes"
                : "Add to Spare Parts Inventory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
