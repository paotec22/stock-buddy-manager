import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import { getInventoryImageUrls, optimizeExistingInventoryImage } from "@/lib/inventoryImages";
import { formatCurrency } from "@/utils/formatters";
import { ImageOff, Printer, Search, Sparkles, Loader2, Share2, PackageSearch, MapPin } from "lucide-react";
import { toast } from "sonner";


const LOCATIONS = ["Ikeja"];

export default function Catalogue() {
  const [location, setLocation] = useState("Ikeja");
  const [search, setSearch] = useState("");
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState({ done: 0, total: 0 });
  const [selected, setSelected] = useState<InventoryItem | null>(null);


  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalogue", location],
    queryFn: async () => {
      let query = supabase.from("inventory list").select("*");
      if (location !== "All") {
        query = query.eq("location", location);
      } else {
        query = query.neq("location", "Not to carry");
      }
      const { data, error } = await query.order("Item Description", { ascending: true });
      if (error) throw error;
      const fetchedItems = (data as InventoryItem[]) || [];
      return fetchedItems.filter(item => item.location?.toLowerCase() !== "not to carry");
    },
  });

  useEffect(() => {
    const paths = items.map((i) => i.image_url).filter(Boolean) as string[];
    if (paths.length === 0) {
      setSigned({});
      return;
    }
    getInventoryImageUrls(paths).then(setSigned);
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (onlyWithImages && !it.image_url) return false;
      if (search.trim() && !it["Item Description"]?.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [items, search, onlyWithImages]);

  const handleOptimizeImages = async () => {
    const targets = items.filter((i) => i.image_url) as (InventoryItem & { image_url: string })[];
    if (targets.length === 0) {
      toast.info("No images to optimize");
      return;
    }
    if (!window.confirm(`Optimize ${targets.length} existing image(s)? This may take a minute.`)) return;

    setOptimizing(true);
    setOptimizeProgress({ done: 0, total: targets.length });
    let saved = 0;
    let optimized = 0;
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      try {
        const result = await optimizeExistingInventoryImage(item.image_url, item.id);
        if (result) {
          const { error } = await supabase
            .from("inventory list")
            .update({ image_url: result.newPath } as never)
            .eq("id", item.id)
            .eq("location", item.location);
          if (!error) {
            optimized++;
            saved += result.oldSize - result.newSize;
          }
        }
      } catch (e) {
        console.error("optimize failed for", item.id, e);
      }
      setOptimizeProgress({ done: i + 1, total: targets.length });
    }
    setOptimizing(false);
    const kb = Math.round(saved / 1024);
    toast.success(`Optimized ${optimized} image(s). Saved ~${kb} KB.`);
    const paths = items.map((i) => i.image_url).filter(Boolean) as string[];
    setSigned(await getInventoryImageUrls(paths));
  };

  const selectedUrl = selected?.image_url ? signed[selected.image_url] : null;

  return (
    <div className="space-y-6 fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 p-6 md:p-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">Showroom</Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Product Catalogue</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              A curated visual showcase of your inventory. Share with customers, print, or browse in style.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={handleOptimizeImages} disabled={optimizing}>
              {optimizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing {optimizeProgress.done}/{optimizeProgress.total}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Optimize images
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const link = `${window.location.origin}/share/catalogue`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: "Product Catalogue", url: link });
                  } else {
                    await navigator.clipboard.writeText(link);
                    toast.success("Share link copied to clipboard");
                  }
                } catch {
                  await navigator.clipboard.writeText(link);
                  toast.success("Share link copied to clipboard");
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" /> Share catalogue
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky glass filter bar */}
      <div className="sticky top-16 z-20 print:hidden">
        <div className="rounded-xl border border-border/60 bg-background/70 backdrop-blur-xl shadow-sm p-3 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/60"
            />
          </div>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="md:w-48 bg-background/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={onlyWithImages ? "default" : "outline"}
            onClick={() => setOnlyWithImages((v) => !v)}
          >
            With images only
          </Button>
          <div className="hidden md:block text-xs text-muted-foreground pl-2 whitespace-nowrap">
            {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <PackageSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No products found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting your search or filters. Add images to your inventory items to build a beautiful catalogue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {filtered.map((item) => {
            const url = item.image_url ? signed[item.image_url] : null;
            return (
              <Card
                key={`${item.location}-${item.id}`}
                onClick={() => setSelected(item)}
                className="overflow-hidden group cursor-pointer border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {url ? (
                    <img
                      src={url}
                      alt={item["Item Description"]}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out [image-rendering:auto]"
                      loading="lazy"
                      decoding="async"
                      width={800}
                      height={800}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                      <ImageOff className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item["Item Description"]}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </div>
                  <p className="text-xl font-bold text-primary pt-1 tracking-tight">
                    {formatCurrency(item.Price || 0)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selected && (
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-muted relative">
                {selectedUrl ? (
                  <img
                    src={selectedUrl}
                    alt={selected["Item Description"]}
                    className="h-full w-full object-contain bg-muted p-2"
                    decoding="async"
                  />

                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ImageOff className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl leading-tight">
                    {selected["Item Description"]}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" /> {selected.location}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Price</div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(selected.Price || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
