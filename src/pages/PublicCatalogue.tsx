import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import {
  ImageOff,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Package,
  X,
  Camera,
  TrendingUp,
} from "lucide-react";

const SUPABASE_URL = "https://itycbazttpidqlgmmrot.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o";

const PAGE_SIZE = 20;
const VIEW_KEY = "pub_catalogue_view_mode";

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc";
type ViewMode = "grid" | "list";

interface PublicItem {
  id: number;
  description: string;
  price: number | null;
  location: string;
  image: string | null;
  quantity?: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStockStatus(qty?: number | null) {
  if (qty == null || qty <= 0)
    return {
      label: "Out of Stock",
      color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    };
  if (qty <= 10)
    return {
      label: "Low Stock",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    };
  return {
    label: "In Stock",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card/60 animate-pulse">
        <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-6 bg-muted rounded w-20" />
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card/60 overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({ item }: { item: PublicItem }) {
  const stock = getStockStatus(item.quantity);
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {item.image ? (
          <>
            <img
              src={item.image}
              alt={item.description}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
            />
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageOff className="h-8 w-8 opacity-40" />
            <span className="text-xs opacity-50">No image</span>
          </div>
        )}
        {/* Stock badge */}
        <span
          className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${stock.color}`}
        >
          {stock.label}
        </span>
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.4rem]">
          {item.description}
        </h3>
        {item.quantity != null && (
          <p className="text-[11px] text-muted-foreground">
            Qty:{" "}
            <span className="font-medium text-foreground">{item.quantity}</span>
          </p>
        )}
        <div className="pt-0.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-primary/10 text-primary">
            {formatCurrency(item.price || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ item }: { item: PublicItem }) {
  const stock = getStockStatus(item.quantity);
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors group">
      <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.description}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={64}
            height={64}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-5 w-5 opacity-40" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stock.color}`}
          >
            {stock.label}
          </span>
          {item.quantity != null && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Qty:{" "}
              <span className="font-medium text-foreground">
                {item.quantity}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-sm text-primary">
          {formatCurrency(item.price || 0)}
        </p>
        {item.quantity != null && (
          <p className="text-[11px] text-muted-foreground sm:hidden">
            Qty: {item.quantity}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PublicCatalogue() {
  const location = "Ikeja";

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid";
    } catch {
      return "grid";
    }
  });
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}
    setPage(1);
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, sort, minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = `?location=${encodeURIComponent(location)}`;
    fetch(`${SUPABASE_URL}/functions/v1/public-catalogue${qs}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error || `Request failed (${res.status})`);
          setItems([]);
        } else {
          setItems((json.items as PublicItem[]) ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [location]);

  // Stats
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const prices = items.map((i) => i.price || 0).filter((p) => p > 0);
    return {
      total: items.length,
      withImages: items.filter((i) => i.image).length,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let out = items.filter((it) => {
      if (
        search.trim() &&
        !it.description?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && (it.price || 0) < min) return false;
      if (!isNaN(max) && (it.price || 0) > max) return false;
      return true;
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return (a.description ?? "").localeCompare(b.description ?? "");
        case "name_desc":
          return (b.description ?? "").localeCompare(a.description ?? "");
        case "price_asc":
          return (a.price || 0) - (b.price || 0);
        case "price_desc":
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return out;
  }, [items, search, sort, minPrice, maxPrice]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;
  const hasActiveFilters = search || minPrice || maxPrice || sort !== "name_asc";

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("name_asc");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header (hidden when printing) */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold tracking-tight">
              Product Catalogue
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
              Browse our available products
            </p>
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              id="pub-view-grid-btn"
              title="Grid view"
              onClick={() => setView("grid")}
              className={`px-3 py-2 transition-colors ${
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              id="pub-view-list-btn"
              title="List view"
              onClick={() => setView("list")}
              className={`px-3 py-2 transition-colors ${
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Print-only header */}
      <div className="hidden print:block px-8 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Product Catalogue</h1>
        <p className="text-sm text-muted-foreground mt-1">{location}</p>
        <hr className="mt-3 border-gray-300" />
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 pb-10">
        {/* Stats (hidden when printing) */}
        {stats && !loading && (
          <div className="grid grid-cols-3 gap-2 md:gap-3 print:hidden">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-none">
                  Products
                </p>
                <p className="text-sm md:text-base font-bold mt-0.5">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Camera className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-none">
                  Shown
                </p>
                <p className="text-sm md:text-base font-bold mt-0.5">
                  {stats.withImages}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-none">
                  Max
                </p>
                <p className="text-xs md:text-sm font-bold mt-0.5 truncate">
                  {formatCurrency(stats.maxPrice)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter bar (hidden when printing) */}
        <div className="space-y-2 print:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="pub-catalogue-search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              id="pub-toggle-filters-btn"
              variant="outline"
              size="icon"
              onClick={() => setFiltersOpen((v) => !v)}
              className="relative flex-shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </div>

          {/* Collapsible filters */}
          {filtersOpen && (
            <div className="rounded-xl border border-border/70 bg-card p-3 space-y-3 animate-[fadeIn_0.2s_ease-out]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Sort by
                  </label>
                  <Select
                    value={sort}
                    onValueChange={(v) => setSort(v as SortKey)}
                  >
                    <SelectTrigger id="pub-sort-select" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name: A → Z</SelectItem>
                      <SelectItem value="name_desc">Name: Z → A</SelectItem>
                      <SelectItem value="price_asc">
                        Price: Low → High
                      </SelectItem>
                      <SelectItem value="price_desc">
                        Price: High → Low
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Min price
                  </label>
                  <Input
                    id="pub-min-price"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Max price
                  </label>
                  <Input
                    id="pub-max-price"
                    type="number"
                    min={0}
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    id="pub-clear-filters-btn"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground h-7"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {!loading && (
            <p className="text-xs text-muted-foreground px-0.5">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min(paginated.length, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              product{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
          view === "grid" ? (
            <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} view="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} view="list" />
              ))}
            </div>
          )
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Package className="h-7 w-7 text-destructive opacity-60" />
            </div>
            <div>
              <p className="font-semibold">Could not load catalogue</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-semibold">No products found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "No products are available right now."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Screen view — paginated */}
            {view === "grid" ? (
              <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
                {paginated.map((item) => (
                  <GridCard key={`${item.location}-${item.id}`} item={item} />
                ))}
              </div>
            ) : (
              <div className="space-y-2 print:hidden">
                {paginated.map((item) => (
                  <ListRow key={`${item.location}-${item.id}`} item={item} />
                ))}
              </div>
            )}

            {/* Print-only view — all items, 3-column grid */}
            <div className="hidden print:grid print:gap-4 print:grid-cols-3">
              {filtered.map((item) => (
                <GridCard
                  key={`print-${item.location}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          </>
        )}

        {/* Show more (hidden when printing) */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-2 print:hidden">
            <Button
              id="pub-show-more-btn"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="w-full sm:w-auto"
            >
              Show more ({filtered.length - paginated.length} remaining)
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
