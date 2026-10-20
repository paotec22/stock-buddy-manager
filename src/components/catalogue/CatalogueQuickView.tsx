import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { getStockStatus } from "./CatalogueTypes";
import { getProductCategory } from "@/utils/catalogueCategories";
import {
  ImageOff,
  Copy,
  Check,
  MessageCircle,
  Package,
  Layers,
  Sparkles,
  Share2,
  ExternalLink,
  Wrench,
  Plus,
  Minus,
  Calculator,
  ShieldCheck,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

interface CatalogueQuickViewProps {
  item: InventoryItem | null;
  imageUrl: string | null;
  onClose: () => void;
  onShareItem?: (itemId: number) => void;
}

export function CatalogueQuickView({
  item,
  imageUrl,
  onClose,
  onShareItem,
}: CatalogueQuickViewProps) {
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  // Quick Quotation Calculator State
  const [calcQty, setCalcQty] = useState(1);
  const [includeInstallation, setIncludeInstallation] = useState(false);
  const installationFeePerUnit = 15000; // Standard professional installation fee

  if (!item) return null;

  const stock = getStockStatus(item.Quantity ?? 0);
  const category = getProductCategory(item);
  const CategoryIcon = category.icon;

  const unitPrice = item.Price || 0;
  const itemsSubtotal = unitPrice * calcQty;
  const installationTotal = includeInstallation ? installationFeePerUnit * calcQty : 0;
  const grandTotal = itemsSubtotal + installationTotal;

  const publicItemLink = `${window.location.origin}/share/catalogue?ids=${item.id}`;

  const handleCopyQuote = () => {
    let text = `*PUIDO SMART SOLUTIONS — PRODUCT QUOTATION*\n`;
    text += `📦 *Product:* ${item["Item Description"]}\n`;
    text += `🏷️ *SKU:* #${item.id}\n`;
    text += `📍 *Location:* ${item.location} Showroom\n`;
    text += `💰 *Unit Price:* ${formatCurrency(unitPrice)}\n`;
    if (calcQty > 1) {
      text += `🔢 *Quantity:* ${calcQty} units\n`;
      text += `💵 *Subtotal:* ${formatCurrency(itemsSubtotal)}\n`;
    }
    if (includeInstallation) {
      text += `🔧 *Professional Installation:* ${formatCurrency(installationTotal)} (${formatCurrency(installationFeePerUnit)}/unit)\n`;
      text += `⭐ *Grand Total:* ${formatCurrency(grandTotal)}\n`;
    }
    text += `📊 *Status:* ${stock.label}\n\n`;

    if (item.features && item.features.length > 0) {
      text += `*Key Features:*\n`;
      item.features.slice(0, 4).forEach((f) => {
        text += `• ${f}\n`;
      });
      text += `\n`;
    }

    text += `🔗 *View in Showroom:* ${publicItemLink}\n\n`;
    text += `_Contact us to confirm order or schedule delivery & installation!_`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    toast.success("Detailed customer quotation copied to clipboard");
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicItemLink);
    setCopiedLink(true);
    toast.success("Public product link copied to clipboard");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppSend = () => {
    let text = `*PUIDO SMART SOLUTIONS — PRODUCT ENQUIRY*\n`;
    text += `📦 *Product:* ${item["Item Description"]}\n`;
    text += `💰 *Unit Price:* ${formatCurrency(unitPrice)}\n`;
    if (calcQty > 1) {
      text += `🔢 *Qty:* ${calcQty} units = ${formatCurrency(itemsSubtotal)}\n`;
    }
    if (includeInstallation) {
      text += `🔧 *With Installation:* ${formatCurrency(grandTotal)}\n`;
    }
    text += `🔗 ${publicItemLink}\n\n`;
    text += `Hello, I'd like to share this verified product with you.`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handleCopySku = () => {
    navigator.clipboard.writeText(`${item.id}`);
    setCopiedSku(true);
    toast.success(`SKU #${item.id} copied`);
    setTimeout(() => setCopiedSku(false), 1500);
  };

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl p-0 overflow-hidden rounded-3xl border border-border/70 bg-card/95 backdrop-blur-md shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 w-full max-h-[88vh] md:max-h-[78vh] overflow-y-auto md:overflow-hidden">
          {/* Left: Image Container */}
          <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-slate-100 dark:bg-slate-900/40 flex items-center justify-center border-b md:border-b-0 md:border-r border-border/40 p-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item["Item Description"]}
                className="max-h-full max-w-full object-contain md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
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

            {/* Verified badge overlay */}
            <div className="absolute bottom-4 left-4 z-10 hidden md:block">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-foreground/80 bg-background/90 px-2.5 py-1 rounded-lg border border-border/50 backdrop-blur-md shadow-xs">
                <ShieldCheck className="h-3 w-3 text-emerald-500" /> Genuine Puido Product
              </span>
            </div>
          </div>

          {/* Right: Info Panel & Calculator */}
          <div className="flex flex-col justify-between p-5 sm:p-6 md:p-7 space-y-4 md:overflow-y-auto h-full">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${category.badgeClass}`}
                  >
                    <CategoryIcon className="h-3 w-3" />
                    {category.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySku}
                    title="Click to copy SKU"
                    className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-mono hover:bg-primary/20 transition-colors"
                  >
                    SKU #{item.id} {copiedSku ? "(Copied!)" : ""}
                  </button>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {item.location} Showroom
                  </span>
                </div>

                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground leading-snug tracking-tight">
                  {item["Item Description"]}
                </DialogTitle>
              </div>

              {/* Price & Stock Card */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/15">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70 block">
                    Unit Price
                  </span>
                  <strong className="text-lg sm:text-xl text-primary font-black tracking-tight mt-0.5 block font-mono">
                    {formatCurrency(unitPrice)}
                  </strong>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Available Stock
                  </span>
                  <strong className="text-lg sm:text-xl text-foreground font-black tracking-tight mt-0.5 block font-mono">
                    {item.Quantity ?? 0}{" "}
                    <span className="text-xs font-normal text-muted-foreground font-sans">
                      units
                    </span>
                  </strong>
                </div>
              </div>

              {/* Live Quotation & Installation Calculator */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-card space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-primary" />
                    Instant Client Quote Calculator
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Order Quantity:</span>
                  <div className="inline-flex items-center rounded-lg border border-border/70 bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => setCalcQty((q) => Math.max(1, q - 1))}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs">
                      {calcQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalcQty((q) => q + 1)}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Installation Toggle */}
                <label className="flex items-center justify-between pt-1 border-t border-border/40 text-xs cursor-pointer select-none">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Wrench className="h-3.5 w-3.5 text-amber-500" />
                    Add Standard Installation (+₦15k/unit)
                  </span>
                  <input
                    type="checkbox"
                    checked={includeInstallation}
                    onChange={(e) => setIncludeInstallation(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary text-primary"
                  />
                </label>
              </div>

              {/* Product Features */}
              {item.features && item.features.length > 0 ? (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> Key Specifications
                  </h4>
                  <ul className="space-y-1">
                    {item.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-foreground/90 leading-tight"
                      >
                        <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Quick Actions Footer */}
            <div className="space-y-2 pt-3 border-t border-border/40 mt-auto">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs font-semibold border-border/70 gap-1.5"
                  onClick={handleCopyQuote}
                >
                  {copiedQuote ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedQuote ? "Quote Copied" : "Copy WhatsApp Quote"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs font-semibold border-border/70 gap-1.5"
                  onClick={handleCopyLink}
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedLink ? "Link Copied" : "Copy Item Link"}</span>
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 h-9.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                  onClick={handleWhatsAppSend}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send Product via WhatsApp</span>
                </Button>

                <Button
                  variant="secondary"
                  className="h-9.5 px-4 rounded-xl text-xs font-semibold"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
