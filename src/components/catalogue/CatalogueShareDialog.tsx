import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { Copy, Check, Share2, Search, X } from "lucide-react";
import { toast } from "sonner";

interface CatalogueShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
}

export function CatalogueShareDialog({
  open,
  onOpenChange,
  items,
}: CatalogueShareDialogProps) {
  const [shareAll, setShareAll] = useState(true);
  const [shareIds, setShareIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(() => {
    const base = `${window.location.origin}/share/catalogue`;
    if (shareAll || shareIds.length === 0) return base;
    return `${base}?ids=${shareIds.join(",")}`;
  }, [shareAll, shareIds]);

  const filteredSelection = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (it) =>
        it["Item Description"]?.toLowerCase().includes(q) ||
        String(it.id).includes(q)
    );
  }, [items, search]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Public catalogue link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Puido Smart Solutions — Product Catalogue",
          text: "Check out our latest product inventory and catalogue:",
          url: shareLink,
        });
      } else {
        await handleCopyLink();
      }
    } catch {
      await handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] sm:max-w-lg rounded-3xl border border-border/70 bg-card/95 backdrop-blur-md shadow-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-bold text-foreground">
            Share Product Catalogue
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate an interactive public link for customers to browse your products without requiring a login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Scope switch */}
          <div className="flex gap-2 p-1 bg-muted/60 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setShareAll(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                shareAll
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Full Catalogue ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setShareAll(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !shareAll
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Custom Selection ({shareIds.length})
            </button>
          </div>

          {/* Custom Selection Picker */}
          {!shareAll && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search products to include..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-background/60"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShareIds(
                      shareIds.length === items.length
                        ? []
                        : items.map((i) => i.id)
                    )
                  }
                  className="h-9 text-xs rounded-xl"
                >
                  {shareIds.length === items.length ? "Clear" : "Select All"}
                </Button>
              </div>

              {/* List */}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/40 bg-background/40">
                {filteredSelection.map((it) => {
                  const isChecked = shareIds.includes(it.id);
                  return (
                    <label
                      key={it.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setShareIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== it.id)
                              : [...prev, it.id]
                          )
                        }
                        className="h-4 w-4 rounded accent-primary text-primary"
                      />
                      <span className="flex-1 truncate font-medium text-foreground">
                        {it["Item Description"]}
                      </span>
                      <span className="font-mono text-muted-foreground shrink-0">
                        {formatCurrency(it.Price || 0)}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>
                  {shareIds.length} item{shareIds.length !== 1 ? "s" : ""} selected
                </span>
                {shareIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShareIds([])}
                    className="text-primary hover:underline"
                  >
                    Reset selection
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Generated Link URL Box */}
          <div className="rounded-xl bg-muted/70 border border-border/50 p-2.5 text-xs font-mono break-all text-muted-foreground">
            {shareLink}
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-semibold min-h-[42px]"
              disabled={!shareAll && shareIds.length === 0}
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 mr-1.5" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>

            <Button
              className="flex-1 rounded-xl font-semibold min-h-[42px] bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!shareAll && shareIds.length === 0}
              onClick={() => {
                handleNativeShare();
                onOpenChange(false);
              }}
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
