import { useState, useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import {
  ScanBarcode,
  Search,
  Package,
  ShoppingCart,
  Boxes,
  ArrowRight,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
} from "lucide-react";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodeScannerModal({ open, onOpenChange }: BarcodeScannerModalProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoElementId = useId();

  // Search items in Supabase inventory
  const { data: matchedItems = [], isFetching } = useQuery({
    queryKey: ["barcode-search", searchTerm],
    queryFn: async () => {
      const trimmed = searchTerm.trim();
      if (!trimmed) return [];

      const { data, error } = await supabase
        .from("inventory list")
        .select(`id, "Item Description", "Location", "Quantity Available", "Actual Price", "Cost Price", "Category"`)
        .or(`"Item Description".ilike.%${trimmed}%,"Location".ilike.%${trimmed}%,"Category".ilike.%${trimmed}%`)
        .limit(8);

      if (error) return [];
      return data || [];
    },
    enabled: searchTerm.trim().length > 1,
    staleTime: 1000 * 30,
  });

  // Camera mock/live scanner handler
  const handleStartCamera = async () => {
    setCameraError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setCameraActive(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const videoEl = document.getElementById(videoElementId) as HTMLVideoElement;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play();
        }
      } else {
        setCameraError("Camera access not supported on this browser device.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Camera permission denied or camera not found";
      setCameraError(message);
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    const videoEl = document.getElementById(videoElementId) as HTMLVideoElement;
    if (videoEl && videoEl.srcObject) {
      const stream = videoEl.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
    }
    setCameraActive(false);
  };

  // Close camera on modal close
  useEffect(() => {
    if (!open) {
      handleStopCamera();
      setSearchTerm("");
    }
  }, [open]);

  // Sample barcode presets for instant testing
  const testBarcodes = [
    { label: "Solar Inverter", query: "Inverter" },
    { label: "Smart Switch", query: "Switch" },
    { label: "Battery Unit", query: "Battery" },
    { label: "CCTV Camera", query: "Camera" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/80 bg-gradient-to-r from-primary/10 via-card to-background">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <ScanBarcode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Smart Barcode &amp; SKU Scanner
              </DialogTitle>
              <DialogDescription className="text-xs">
                Scan product barcodes, QR codes, or enter item SKUs for instant stock verification and sale dispatch.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Search & Camera Toolbar */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Scan or enter Barcode, SKU, or Product Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="pl-9 pr-9 h-11 text-sm font-medium bg-background"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!cameraActive ? (
                <Button
                  type="button"
                  onClick={handleStartCamera}
                  variant="outline"
                  className="h-11 px-3.5 gap-2 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Live Camera</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleStopCamera}
                  variant="destructive"
                  className="h-11 px-3.5 gap-1.5"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Stop Camera</span>
                </Button>
              )}
            </div>

            {/* Quick barcode simulation buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Quick SKU Simulators:
              </span>
              {testBarcodes.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearchTerm(item.query)}
                  className="text-[11px] bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md border border-border/60 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Viewfinder (if active) */}
          {cameraActive && (
            <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-primary/60 bg-black aspect-video flex items-center justify-center">
              <video
                id={videoElementId}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-emerald-400 rounded-lg bg-emerald-400/10 pointer-events-none flex items-center justify-center animate-pulse">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider bg-black/60 px-2 py-0.5 rounded">
                  Align Barcode or QR Code Inside Frame
                </span>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{cameraError} - You can search manually using the input above.</span>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
              <span>{searchTerm ? `Matching Products (${matchedItems.length})` : "Ready to scan"}</span>
              {isFetching && <span className="animate-pulse">Searching inventory...</span>}
            </div>

            {searchTerm && matchedItems.length === 0 && !isFetching && (
              <div className="p-6 text-center border border-dashed rounded-xl space-y-1.5 bg-muted/20">
                <Package className="h-7 w-7 text-muted-foreground mx-auto" />
                <p className="text-xs font-semibold text-foreground">No items found for &ldquo;{searchTerm}&rdquo;</p>
                <p className="text-[11px] text-muted-foreground">
                  Check the barcode number or SKU and try searching again.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {matchedItems.map((item) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const raw = item as any;
                const qty = Number(raw["Quantity Available"] ?? 0);
                const isOutOfStock = qty <= 0;
                const salePrice = Number(raw["Actual Price"] ?? 0);
                const costPrice = Number(raw["Cost Price"] ?? 0);
                const margin = salePrice > 0 ? Math.round(((salePrice - costPrice) / salePrice) * 100) : 0;

                return (
                  <Card key={raw.id} className="border-border hover:border-primary/40 transition-colors shadow-2xs">
                    <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {raw["Item Description"]}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            SKU-{raw.id}
                          </Badge>
                          <Badge
                            variant={isOutOfStock ? "destructive" : qty <= 5 ? "secondary" : "default"}
                            className="text-[10px]"
                          >
                            {isOutOfStock ? "Out of Stock" : `${qty} in stock`}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>Location: <strong className="text-foreground">{raw["Location"] || "Main Warehouse"}</strong></span>
                          <span>Category: <strong className="text-foreground">{raw["Category"] || "General"}</strong></span>
                          {salePrice > 0 && (
                            <span>Price: <strong className="text-primary font-mono">{formatCurrency(salePrice)}</strong></span>
                          )}
                          {margin > 0 && (
                            <span className="text-emerald-600 font-semibold">{margin}% margin</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/inventory?search=${encodeURIComponent(raw["Item Description"])}`);
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          <Boxes className="h-3.5 w-3.5" />
                          <span>View Stock</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/sales?item=${raw.id}`);
                          }}
                          className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>Record Sale</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-border/80 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Fast Barcode Scanner Ready</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
