import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import { getInventoryImageUrls, optimizeExistingInventoryImage } from "@/lib/inventoryImages";
import { formatCurrency } from "@/utils/formatters";
import { ImageOff, Printer, Search, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";


const LOCATIONS = ["All", "Ikeja", "Cement", "Uyo"];

export default function Catalogue() {
  const [location, setLocation] = useState("All");
  const [search, setSearch] = useState("");
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [signed, setSigned] = useState<Record<string, string>>({});

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalogue", location],
    queryFn: async () => {
      let query = supabase.from("inventory list").select("*");
      if (location !== "All") query = query.eq("location", location);
      const { data, error } = await query.order("Item Description", { ascending: true });
      if (error) throw error;
      return (data as InventoryItem[]) || [];
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

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Browse your inventory as a visual catalogue you can share with customers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print / PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="md:w-48">
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Loading catalogue...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No products to display. Add images to inventory items to build your catalogue.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const url = item.image_url ? signed[item.image_url] : null;
            return (
              <Card key={`${item.location}-${item.id}`} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {url ? (
                    <img
                      src={url}
                      alt={item["Item Description"]}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={400}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-1">
                  <h3 className="font-semibold leading-tight line-clamp-2">
                    {item["Item Description"]}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                  <p className="text-lg font-bold text-primary pt-1">
                    {formatCurrency(item.Price || 0)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
