import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/formatters";
import { DollarSign, Percent, AlertCircle } from "lucide-react";
import type { ProductProfitRow } from "@/utils/profitUtils";

interface SetCostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductProfitRow | null;
  onSaveCost: (params: {
    product: ProductProfitRow;
    newCost: number;
    applyToPastSales: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}

export function SetCostModal({
  open,
  onOpenChange,
  product,
  onSaveCost,
  isSaving,
}: SetCostModalProps) {
  const [costInput, setCostInput] = useState<string>("");
  const [applyToPastSales, setApplyToPastSales] = useState<boolean>(true);

  useEffect(() => {
    if (product) {
      setCostInput(product.unitCost > 0 ? String(product.unitCost) : "");
      setApplyToPastSales(true);
    }
  }, [product]);

  if (!product) return null;

  const parsedCost = parseFloat(costInput) || 0;
  const unitProfit = product.avgSalePrice - parsedCost;
  const marginPct =
    product.avgSalePrice > 0 ? (unitProfit / product.avgSalePrice) * 100 : 0;
  const totalEstimatedProfit = unitProfit * product.totalQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedCost) || parsedCost < 0) return;
    await onSaveCost({
      product,
      newCost: parsedCost,
      applyToPastSales,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Set Purchase Cost Price
            </DialogTitle>
            <DialogDescription>
              Enter the true unit procurement or cost price for this item to
              correctly calculate gross margins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product summary pill */}
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-1.5 text-sm">
              <div className="font-semibold text-foreground">
                {product.itemName}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Location: <strong className="text-foreground">{product.location}</strong>
                </span>
                <span>
                  Sold in Period:{" "}
                  <strong className="text-foreground font-mono">{product.totalQuantity} units</strong>
                </span>
                <span>
                  Avg Sale Price:{" "}
                  <strong className="text-foreground font-mono">
                    {formatCurrency(product.avgSalePrice)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Input for Unit Cost */}
            <div className="space-y-1.5">
              <Label htmlFor="unitCost" className="text-sm font-medium">
                Unit Purchase Cost (₦)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                  ₦
                </span>
                <Input
                  id="unitCost"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 45000"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="pl-8 font-mono text-base rounded-xl h-11"
                  autoFocus
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                What did the business pay per unit to purchase or produce this item?
              </p>
            </div>

            {/* Live Profit Preview */}
            {parsedCost > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5" /> Margin Projection
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Profit per unit:</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        unitProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {formatCurrency(unitProfit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Gross Margin:</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        marginPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-primary/10 text-xs text-muted-foreground flex justify-between">
                  <span>Projected total profit on {product.totalQuantity} units:</span>
                  <span className="font-semibold font-mono text-foreground">
                    {formatCurrency(totalEstimatedProfit)}
                  </span>
                </div>
              </div>
            )}

            {/* Checkbox: apply to past sales */}
            <div className="flex items-start space-y-0 space-x-2.5 pt-1">
              <Checkbox
                id="applyPast"
                checked={applyToPastSales}
                onCheckedChange={(checked) => setApplyToPastSales(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="grid gap-1 leading-none">
                <label
                  htmlFor="applyPast"
                  className="text-xs font-medium cursor-pointer leading-tight"
                >
                  Apply this purchase cost to all past sales for this product ({product.saleIds.length} records)
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Updates previous sales records and stores this cost as default for future sales.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isNaN(parsedCost) || parsedCost < 0}
              className="rounded-xl"
            >
              {isSaving ? "Saving..." : "Save Cost Price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
