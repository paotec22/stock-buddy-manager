import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { getStockStatus, ViewMode } from "./CatalogueTypes";
import { Eye, ImageOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

// ─── Skeletons ─────────────────────────────────────────────────────────────
export function SkeletonCard({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-border/50 bg-card/60 animate-pulse">
        <div className="h-14 w-14 rounded-xl bg-muted/80 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted/80 rounded w-2/3" />
          <div className="h-3 bg-muted/60 rounded w-1/3" />
        </div>
        <div className="h-6 bg-muted/80 rounded w-24" />
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-muted/80" />
        <div className="p-2.5 space-y-1.5">
          <div className="h-3.5 bg-muted/80 rounded w-4/5" />
          <div className="h-4 bg-muted/60 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted/80" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-4 bg-muted/80 rounded w-5/6" />
        <div className="h-3 bg-muted/60 rounded w-1/2" />
        <div className="h-5 bg-muted/80 rounded w-1/3 pt-1" />
      </div>
    </div>
  );
}

// ─── Standard Grid Card ─────────────────────────────────────────────────────
export function GridCard({
  item,
  url,
  onClick,
}: {
  item: InventoryItem;
  url: string | null;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${item["Item Description"]} — ${formatCurrency(item.Price || 0)} (SKU #${item.id})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Product info copied for sharing");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Media Container */}
        <div className="aspect-square bg-slate-100 dark:bg-slate-900/40 relative overflow-hidden flex items-center justify-center">
          {url ? (
            <>
              <img
                src={url}
                alt={item["Item Description"]}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
                width={400}
                height={400}
              />
              <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-background/95 text-foreground shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  Quick View
                </span>
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1.5 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
              <ImageOff className="h-8 w-8 opacity-25 text-primary" />
              <span className="text-[10px] font-medium text-muted-foreground/60">No image</span>
            </div>
          )}

          {/* Stock status badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs backdrop-blur-md ${stock.badgeColor}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${stock.dotColor}`} />
              {stock.label}
            </span>
          </div>

          {/* Quick Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy details to clipboard"
            className="absolute top-2.5 right-2.5 z-10 h-7 w-7 rounded-full bg-background/90 text-muted-foreground hover:text-foreground hover:bg-background shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-3.5 space-y-2">
          <h3 className="font-semibold text-xs leading-snug line-clamp-2 min-h-[2.25rem] group-hover:text-primary transition-colors text-foreground">
            {item["Item Description"]}
          </h3>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-mono bg-muted/60 text-muted-foreground border border-border/40 px-1.5 py-0.5 rounded text-[10px]">
              #{item.id}
            </span>
            <span className="font-medium text-[11px]">
              Qty: <strong className="text-foreground">{item.Quantity ?? 0}</strong>
            </span>
          </div>
        </CardContent>
      </div>

      {/* Footer Price */}
      <div className="px-3.5 pb-3.5 pt-2 border-t border-border/40 flex items-center justify-between mt-auto">
        <span className="text-sm font-black text-primary tracking-tight font-mono">
          {formatCurrency(item.Price || 0)}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
          View Details &rarr;
        </span>
      </div>
    </Card>
  );
}

// ─── Compact Grid Card (Higher Density) ─────────────────────────────────────
export function CompactCard({
  item,
  url,
  onClick,
}: {
  item: InventoryItem;
  url: string | null;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900/40 relative overflow-hidden flex items-center justify-center">
        {url ? (
          <img
            src={url}
            alt={item["Item Description"]}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={240}
            height={180}
          />
        ) : (
          <ImageOff className="h-6 w-6 opacity-25 text-primary" />
        )}

        <div className="absolute top-2 left-2 z-10">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border backdrop-blur-md ${stock.badgeColor}`}>
            <span className={`h-1 w-1 rounded-full ${stock.dotColor}`} />
            {item.Quantity ?? 0} left
          </span>
        </div>
      </div>

      <div className="p-2.5 space-y-1">
        <h4 className="font-semibold text-xs leading-tight line-clamp-1 group-hover:text-primary transition-colors text-foreground">
          {item["Item Description"]}
        </h4>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1">
          <span className="font-bold text-xs text-primary">
            {formatCurrency(item.Price || 0)}
          </span>
          <span>#{item.id}</span>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ───────────────────────────────────────────────────────────────
export function ListRow({
  item,
  url,
  onClick,
}: {
  item: InventoryItem;
  url: string | null;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${item["Item Description"]} — ${formatCurrency(item.Price || 0)} (SKU #${item.id})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Product info copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3.5 p-3 rounded-2xl border border-border/70 bg-card hover:bg-card/90 hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-900/40 overflow-hidden shrink-0 relative flex items-center justify-center border border-border/40">
        {url ? (
          <img
            src={url}
            alt={item["Item Description"]}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={56}
            height={56}
          />
        ) : (
          <ImageOff className="h-5 w-5 opacity-25 text-primary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
          {item["Item Description"]}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[10px]">
          <span className="text-muted-foreground font-mono bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded">
            SKU #{item.id}
          </span>
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full border ${stock.badgeColor}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stock.dotColor}`} />
            {stock.label}
          </span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="flex items-center gap-3 shrink-0 text-right pr-1">
        <div>
          <div className="font-black text-sm sm:text-base text-primary font-mono">
            {formatCurrency(item.Price || 0)}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Stock: <strong className="text-foreground">{item.Quantity ?? 0}</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          title="Copy details"
          className="h-8 w-8 rounded-xl border border-border/60 bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors active:scale-95"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
