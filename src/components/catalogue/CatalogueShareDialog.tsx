import React, { useState, useMemo, useEffect } from "react";
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
import {
  Copy,
  Check,
  Share2,
  Search,
  X,
  QrCode,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Package,
  Layers,
  Download,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  PRODUCT_CATEGORIES,
  getProductCategory,
  CategoryId,
} from "@/utils/catalogueCategories";
import QRCode from "qrcode";

interface CatalogueShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  initialSelectedIds?: number[];
}

type ShareMode = "presets" | "custom" | "qrcode";

export function CatalogueShareDialog({
  open,
  onOpenChange,
  items,
  initialSelectedIds = [],
}: CatalogueShareDialogProps) {
  // Tab Mode
  const [activeTab, setActiveTab] = useState<ShareMode>("presets");

  // Selection scope
  const [selectedPreset, setSelectedPreset] = useState<string>("all");
  const [shareIds, setShareIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // Link customization options
  const [proposalTitle, setProposalTitle] = useState("");
  const [hidePrices, setHidePrices] = useState(false);
  const [targetCurrency, setTargetCurrency] = useState<"NGN" | "USD" | "EUR" | "GBP">("NGN");

  // QR Code State
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [generatingQr, setGeneratingQr] = useState(false);

  // Initialize or update selection if initialSelectedIds provided
  useEffect(() => {
    if (initialSelectedIds && initialSelectedIds.length > 0) {
      setShareIds(initialSelectedIds);
      setActiveTab("custom");
      setSelectedPreset("custom");
    } else {
      setSelectedPreset("all");
    }
  }, [initialSelectedIds, open]);

  // Compute active effective IDs based on preset or custom mode
  const effectiveIds = useMemo(() => {
    if (activeTab === "custom" || selectedPreset === "custom") {
      return shareIds;
    }

    if (selectedPreset === "all") {
      return []; // empty means full catalogue
    }

    if (selectedPreset === "in_stock") {
      return items.filter((i) => (i.Quantity ?? 0) > 0).map((i) => i.id);
    }

    // Category preset
    const matching = items.filter(
      (i) => getProductCategory(i).id === selectedPreset
    );
    return matching.map((i) => i.id);
  }, [activeTab, selectedPreset, shareIds, items]);

  // Compute final share link with options
  const shareLink = useMemo(() => {
    const base = `${window.location.origin}/share/catalogue`;
    const params = new URLSearchParams();

    if (effectiveIds.length > 0) {
      params.set("ids", effectiveIds.join(","));
    }

    if (proposalTitle.trim()) {
      params.set("title", proposalTitle.trim());
    }

    if (hidePrices) {
      params.set("hidePrice", "1");
    }

    if (targetCurrency !== "NGN") {
      params.set("curr", targetCurrency);
    }

    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [effectiveIds, proposalTitle, hidePrices, targetCurrency]);

  // Generate QR code whenever shareLink changes
  useEffect(() => {
    let active = true;
    setGeneratingQr(true);
    QRCode.toDataURL(shareLink, {
      width: 400,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
          setGeneratingQr(false);
        }
      })
      .catch(() => {
        if (active) setGeneratingQr(false);
      });

    return () => {
      active = false;
    };
  }, [shareLink]);

  // Filter items in custom picker
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (it) =>
        it["Item Description"]?.toLowerCase().includes(q) ||
        String(it.id).includes(q)
    );
  }, [items, search]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    try {
      const shareTitle = proposalTitle.trim() || "Puido Smart Solutions — Product Catalogue";
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `Explore our verified inventory & showroom collection:\n${shareTitle}`,
          url: shareLink,
        });
      } else {
        await handleCopyLink();
      }
    } catch {
      await handleCopyLink();
    }
  };

  const handleOpenWhatsAppShare = () => {
    const titleText = proposalTitle.trim()
      ? `📋 *${proposalTitle.trim().toUpperCase()}*\n`
      : "";
    const itemsCountText =
      effectiveIds.length > 0
        ? `(${effectiveIds.length} curated product${effectiveIds.length === 1 ? "" : "s"})`
        : `(${items.length} showroom products)`;

    const msg = `*PUIDO SMART SOLUTIONS — PRODUCT SHOWROOM*\n${titleText}Hello! Here is the official interactive product catalogue ${itemsCountText}:\n\n🔗 ${shareLink}\n\n✨ Browse specifications, high-resolution imagery, and place orders directly with our sales team.`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `puido-catalogue-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code image downloaded");
  };

  const activeItemsCount =
    effectiveIds.length === 0 ? items.length : effectiveIds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl rounded-3xl border border-border/70 bg-card/95 backdrop-blur-md shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Share2 className="h-4 w-4" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                Share Product Showroom
              </DialogTitle>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Verified Public Link
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Generate an interactive, high-converting showroom link for clients, WhatsApp pitches, or in-store QR scanning.
          </DialogDescription>
        </DialogHeader>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 mt-3">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "presets"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Curated Collections</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("custom");
              setSelectedPreset("custom");
            }}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "custom"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Hand-picked ({shareIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("qrcode")}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "qrcode"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-3.5 w-3.5 text-primary" />
            <span>Scan QR Code</span>
          </button>
        </div>

        {/* Tab 1: Presets & Collections */}
        {activeTab === "presets" && (
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Select Catalogue Scope</span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {activeItemsCount} items included
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Full Showroom */}
              <button
                type="button"
                onClick={() => setSelectedPreset("all")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === "all"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/60 bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-foreground">
                    Entire Showroom
                  </strong>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {items.length} items
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Complete product directory with all categories and active stock.
                </p>
              </button>

              {/* In-stock Only */}
              <button
                type="button"
                onClick={() => setSelectedPreset("in_stock")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedPreset === "in_stock"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/60 bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    In-Stock Items Only
                  </strong>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {items.filter((i) => (i.Quantity ?? 0) > 0).length} items
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Filters out out-of-stock items for immediate order fulfillment.
                </p>
              </button>

              {/* Category-based presets */}
              {PRODUCT_CATEGORIES.map((cat) => {
                const count = items.filter(
                  (i) => getProductCategory(i).id === cat.id
                ).length;
                if (count === 0) return null;
                const Icon = cat.icon;
                const isSelected = selectedPreset === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPreset(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/60 bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-muted text-foreground shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground block truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {cat.shortName} collection
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 ml-2">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Custom Hand-picked Picker */}
        {activeTab === "custom" && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search products to include in proposal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl bg-background/80"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                className="h-9 text-xs rounded-xl shrink-0"
              >
                {shareIds.length === items.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Quick Category Multi-Select Row */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-muted-foreground font-semibold shrink-0 text-[10px] uppercase tracking-wider mr-1">
                Pick Category:
              </span>
              {PRODUCT_CATEGORIES.map((cat) => {
                const catItems = items.filter(
                  (i) => getProductCategory(i).id === cat.id
                );
                if (catItems.length === 0) return null;
                const catIds = catItems.map((i) => i.id);
                const allSelected = catIds.every((id) => shareIds.includes(id));

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (allSelected) {
                        setShareIds((prev) =>
                          prev.filter((id) => !catIds.includes(id))
                        );
                      } else {
                        setShareIds((prev) =>
                          Array.from(new Set([...prev, ...catIds]))
                        );
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors shrink-0 whitespace-nowrap ${
                      allSelected
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
                    }`}
                  >
                    {cat.shortName} ({catItems.length})
                  </button>
                );
              })}
            </div>

            {/* Scrollable Item Checklist */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/40 bg-card/40">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No products matched your search.
                </div>
              ) : (
                filteredItems.map((it) => {
                  const isChecked = shareIds.includes(it.id);
                  const isOut = (it.Quantity ?? 0) <= 0;
                  return (
                    <label
                      key={it.id}
                      className={`flex items-center gap-3 px-3 py-2 text-xs cursor-pointer transition-colors ${
                        isChecked ? "bg-primary/5" : "hover:bg-muted/40"
                      }`}
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
                        className="h-4 w-4 rounded accent-primary text-primary cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {it["Item Description"]}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="font-mono">#{it.id}</span>
                          <span>·</span>
                          <span className={isOut ? "text-rose-500 font-semibold" : ""}>
                            Qty: {it.Quantity ?? 0}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-foreground shrink-0">
                        {formatCurrency(it.Price || 0)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                <strong className="text-foreground">{shareIds.length}</strong> of{" "}
                {items.length} products selected
              </span>
              {shareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShareIds([])}
                  className="text-primary hover:underline font-semibold"
                >
                  Reset selection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Live QR Code Presentation */}
        {activeTab === "qrcode" && (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-4 bg-muted/20 rounded-2xl border border-border/50 text-center">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              {generatingQr ? (
                <div className="h-48 w-48 flex items-center justify-center text-xs text-muted-foreground">
                  Generating QR...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Catalogue QR Code"
                  className="h-48 w-48 object-contain"
                />
              ) : null}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                In-Store Customer QR Scanner
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Customers can point their phone camera to instantly browse this exact collection on their device.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                className="h-9 text-xs rounded-xl gap-1.5 font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                Download QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-9 text-xs rounded-xl gap-1.5 font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Link Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Link Customization & Settings ─────────────────────────────── */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              Proposal Settings &amp; Personalization
            </span>
            <span className="text-[11px] text-muted-foreground">Optional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Proposal Title */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Proposal / Client Title (Appears as header)
              </label>
              <Input
                placeholder="e.g. Smart Security Package for Villa Ikoyi"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="h-8.5 text-xs rounded-xl bg-background/80"
              />
            </div>

            {/* Currency */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Display Currency
              </label>
              <select
                value={targetCurrency}
                onChange={(e) =>
                  setTargetCurrency(e.target.value as "NGN" | "USD" | "EUR" | "GBP")
                }
                className="h-8.5 w-full text-xs rounded-xl bg-background/80 border border-border/70 px-2.5 font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="NGN">NGN (₦) - Naira</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          {/* Pricing Toggle Option */}
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              {hidePrices ? (
                <EyeOff className="h-4 w-4 text-amber-500" />
              ) : (
                <Eye className="h-4 w-4 text-primary" />
              )}
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  {hidePrices ? "Prices Hidden on Public Page" : "Show Retail Prices"}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {hidePrices
                    ? "Items will show 'Price on Request / Consultation' (ideal for B2B/wholesale)"
                    : "Standard showroom unit prices will be visible to customer"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHidePrices(!hidePrices)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                hidePrices
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  : "bg-background text-foreground border-border/70"
              }`}
            >
              {hidePrices ? "Prices Hidden" : "Prices Visible"}
            </button>
          </div>
        </div>

        {/* ── Generated Share Link Preview ─────────────────────────────── */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Public URL</span>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <ExternalLink className="h-3 w-3" />
              Preview as Customer
            </a>
          </div>
          <div className="rounded-xl bg-muted/60 border border-border/50 p-2.5 text-xs font-mono break-all text-foreground select-all">
            {shareLink}
          </div>
        </div>

        {/* ── Action Buttons Hub ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          {/* Copy Link */}
          <Button
            variant="outline"
            className="rounded-xl font-semibold min-h-[42px] border-border/70 hover:bg-muted"
            disabled={activeTab === "custom" && shareIds.length === 0}
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="h-4 w-4 mr-1.5 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            {copied ? "Link Copied!" : "Copy Link"}
          </Button>

          {/* WhatsApp Direct Share */}
          <Button
            className="rounded-xl font-semibold min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            disabled={activeTab === "custom" && shareIds.length === 0}
            onClick={handleOpenWhatsAppShare}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Send to WhatsApp
          </Button>

          {/* Native Share / Done */}
          <Button
            className="rounded-xl font-semibold min-h-[42px] bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={activeTab === "custom" && shareIds.length === 0}
            onClick={() => {
              handleNativeShare();
            }}
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share Proposal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
