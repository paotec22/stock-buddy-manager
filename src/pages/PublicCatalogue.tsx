import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";
import { ImageOff, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LOCATIONS = ["All", "Ikeja", "Cement", "Uyo"];

interface PublicItem {
  id: number;
  description: string;
  price: number | null;
  location: string;
  image: string | null;
}

export default function PublicCatalogue() {
  const [location, setLocation] = useState("All");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase.functions
      .invoke("public-catalogue", {
        method: "GET",
        headers: {},
        body: undefined,
        // @ts-expect-error - query is supported at runtime
        query: location !== "All" ? { location } : undefined,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setItems([]);
        } else {
          setItems((data?.items as PublicItem[]) ?? []);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [location]);

  const filtered = useMemo(
    () =>
      items.filter((it) =>
        search.trim()
          ? it.description?.toLowerCase().includes(search.toLowerCase())
          : true
      ),
    [items, search]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Product Catalogue</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Browse our available products
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
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
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading catalogue...</div>
        ) : error ? (
          <Card>
            <CardContent className="p-10 text-center text-destructive">
              Could not load catalogue. {error}
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No products to display.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <Card
                key={`${item.location}-${item.id}`}
                className="overflow-hidden group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.description}
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
                    {item.description}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                  <p className="text-lg font-bold text-primary pt-1">
                    {formatCurrency(item.price || 0)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
