import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { getStockStatus } from "./CatalogueTypes";
import {
  ImageOff,
  Copy,
  Check,
  MessageCircle,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface CatalogueQuickViewProps {
  item: InventoryItem | null;
  imageUrl: string | null;
  onClose: () => void;
}

export function CatalogueQuickView({
  item,
  imageUrl,
  onClose,
}: CatalogueQuickViewProps) {
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  if (!item) return null;

  const stock = getStockStatus(item.Quantity ?? 0);

  const handleCopyQuote = () => {
    const text = `*Puido Smart Solutions*\n📦 *Product:* ${item["Item Description"]}\n💰 *Price:* ${formatCurrency(
      item.Price || 0
    )}\n🏷️ *SKU:* #${item.id}\n📍 *Location:* ${item.location} Branch\n📊 *Status:* ${stock.label}\n\n_Contact us today to order or enquire!_`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success("WhatsApp sales quote copied to clipboard");
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const handleCopySku = () => {
    navigator.clipboard.writeText(`${item.id}`);
    setCopiedSku(true);
    toast.success(`SKU #${item.id} copied`);
    setTimeout(() => setCopiedSku(false), 1500);
  };

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[94vw] sm:max-w-[85vw] md:max-w-3xl p-0 overflow-hidden rounded-3xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 w-full max-h-[85vh] md:max-h-[72vh] overflow-y-auto md:overflow-hidden">
          {/* Left: Image Container */}
          <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center border-b md:border-b-0 md:border-r border-border/40">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item["Item Description"]}
                className="h-full w-full object-cover md:absolute md:inset-0"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-16">
                <ImageOff className="h-16 w-16 opacity-20 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground/60">
                  No image uploaded
                </span>
              </div>
            )}

            {/* Stock pill overlay */}
            <div className="absolute top-4 left-4 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-md backdrop-blur-md ${stock.badgeColor}`}
              >
                <span className={`h-2 w-2 rounded-full ${stock.dotColor}`} />
                {stock.label}
              </span>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="flex flex-col justify-between p-6 sm:p-7 md:p-8 space-y-6 md:overflow-y-auto h-full">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySku}
                    title="Click to copy SKU"
                    className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 border border-primary/15 px-2.5 py-1 rounded-full font-mono hover:bg-primary/20 transition-colors"
                  >
                    SKU #{item.id} {copiedSku ? "(Copied!)" : ""}
                  </button>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {item.location} Branch
                  </span>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground leading-snug tracking-tight">
                  {item["Item Description"]}
                </DialogTitle>
              </div>

              {/* Price & Quantity Grid Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70 block">
                    Unit Price
                  </span>
                  <strong className="text-lg sm:text-xl text-primary font-black tracking-tight mt-0.5 block font-mono">
                    {formatCurrency(item.Price || 0)}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/50">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Stock Available
                  </span>
                  <strong className="text-lg sm:text-xl text-foreground font-black tracking-tight mt-0.5 block font-mono">
                    {item.Quantity ?? 0}{" "}
                    <span className="text-xs font-medium text-muted-foreground font-sans">
                      units
                    </span>
                  </strong>
                </div>
              </div>

              {/* Product Features */}
              {item.features && item.features.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> Key Features
                  </h4>
                  <ul className="space-y-1.5">
                    {item.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-foreground/90 leading-relaxed"
                      >
                        <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground italic">
                    Genuine Puido Smart Solutions inventory product.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border/40 mt-auto">
              <Button
                variant="outline"
                className="flex-1 min-h-[42px] rounded-xl font-semibold border-border/70 hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2"
                onClick={handleCopyQuote}
              >
                {copiedQuote ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                )}
                <span>{copiedQuote ? "Quote Copied!" : "WhatsApp Quote"}</span>
              </Button>

              <Button
                variant="default"
                className="min-h-[42px] px-6 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
