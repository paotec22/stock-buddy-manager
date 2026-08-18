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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Eye,
  Copy,
  Check,
  MessageCircle,
  Phone,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://itycbazttpidqlgmmrot.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o";

const PAGE_SIZE = 20;
const VIEW_KEY = "pub_catalogue_view_mode";

// Business contact — powers the enquiry CTAs on the public page
const BUSINESS_PHONE = "07035339641";
const WHATSAPP_NUMBER = "2347035339641";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello! I just viewed your product catalogue online and would like to make an enquiry."
)}`;

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc";
type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortKey; label: string; short: string }[] = [
  { value: "name_asc", label: "Name: A → Z", short: "A → Z" },
  { value: "name_desc", label: "Name: Z → A", short: "Z → A" },
  { value: "price_asc", label: "Price: Low → High", short: "Price ↑" },
  { value: "price_desc", label: "Price: High → Low", short: "Price ↓" },
];

interface PublicItem {
  id: number;
  description: string;
  price: number | null;
  location: string;
  image: string | null;
  features?: string[] | null;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-3 rounded-xl border bg-card/60 animate-pulse">
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
    <div className="rounded-2xl border bg-card/60 overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({
  item,
  onClick,
}: {
  item: PublicItem;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-border/60 bg-card overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-primary/40"
    >
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
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/95 text-slate-900 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Eye className="h-3 w-3 text-primary" /> Quick View
              </span>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <ImageOff className="h-7 w-7 opacity-30 text-primary" />
            <span className="text-[10px] opacity-50">No image</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-3.5 space-y-1.5">
        <h3 className="font-semibold text-[13px] sm:text-sm leading-snug line-clamp-2 min-h-[2.1rem] group-hover:text-primary transition-colors">
          {item.description}
        </h3>
        <div className="pt-0.5">
          <span className="text-base sm:text-lg font-bold text-primary tracking-tight">
            {formatCurrency(item.price || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({
  item,
  onClick,
}: {
  item: PublicItem;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all cursor-pointer group hover:border-primary/30"
    >
      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.description}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={48}
            height={48}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-4 w-4 opacity-30" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] sm:text-sm truncate group-hover:text-primary transition-colors">
          {item.description}
        </p>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-sm sm:text-base text-primary">
          {formatCurrency(item.price || 0)}
        </p>
      </div>
    </div>
  );
}

// ─── Print-Only Card Component ────────────────────────────────────────────────
function PrintCard({ item }: { item: PublicItem }) {
  return (
    <div className="print-card-item rounded-lg border border-slate-300 bg-white overflow-hidden p-0 flex flex-col justify-between text-slate-900 shadow-none">
      <div>
        <div className="aspect-square bg-slate-100 relative overflow-hidden border-b border-slate-200 flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.description}
              className="h-full w-full object-cover"
              decoding="sync"
            />
          ) : (
            <div className="flex flex-col items-center gap-0.5 text-slate-400">
              <ImageOff className="h-6 w-6" />
              <span className="text-[9px]">No image</span>
            </div>
          )}
        </div>

        <div className="p-2 space-y-1">
          <h4 className="font-bold text-[11px] leading-tight line-clamp-2 text-slate-900">
            {item.description}
          </h4>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span className="text-[9px] uppercase font-bold text-slate-400">Price</span>
        <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          {formatCurrency(item.price || 0)}
        </span>
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<PublicItem | null>(null);

  const [view, setView] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid";
    } catch {
      return "grid";
    }
  });
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch { }
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
  }, [location, retryCount]);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (sort !== "name_asc") count++;
    return count;
  }, [search, minPrice, maxPrice, sort]);

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("name_asc");
  };

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Per-product WhatsApp enquiry link
  const enquiryLink = (item: PublicItem) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `Hello! I'm interested in "${item.description}" (${item.price ? formatCurrency(item.price) : "price available on enquiry"
      }) from your catalogue. Is it available?`
    )}`;

  return (
    <div className="min-h-screen bg-background text-foreground catalogue-bg">
      {/* ── PRINT-ONLY STUNNING CATALOGUE HEADER ──────────────────────────── */}
      <div className="hidden print:block px-6 pt-4 print:mb-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <img
              src="/Puido_Smart_Solutions.svg"
              alt="Puido Smart Solutions"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                PRODUCT CATALOGUE
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded">
              {location.toUpperCase()} BRANCH
            </span>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Date: {currentDateFormatted}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 rounded mt-2 border border-slate-200">
          <span>Total Products: <strong>{filtered.length}</strong></span>
          <span>Currency: <strong>NGN (₦)</strong></span>
          <span>Public Catalogue</span>
        </div>
      </div>

      {/* ── SCREEN HEADER (Hidden when printing) ─────────────────────────── */}
      <header className="border-b border-border/40 bg-background/85 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/Puido_Smart_Solutions.svg"
              alt="Puido Smart Solutions"
              className="h-9 md:h-11 w-auto object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm md:text-xl font-bold tracking-tight truncate bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Product Catalogue
              </h1>
              <p className="hidden md:block text-xs text-muted-foreground">
                Browse our available inventory — {location} Branch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop WhatsApp CTA */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.03]"
              aria-label="Enquire on WhatsApp"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Enquire
            </a>

            {/* View toggle */}
            <div className="flex rounded-xl border border-border/60 bg-card/65 backdrop-blur-xs overflow-hidden p-0.5">
              <button
                id="pub-view-grid-btn"
                title="Grid view"
                onClick={() => setView("grid")}
                className={`px-3 py-1 rounded-lg transition-all duration-200 ${view === "grid"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                id="pub-view-list-btn"
                title="List view"
                onClick={() => setView("list")}
                className={`px-3 py-1 rounded-lg transition-all duration-200 ${view === "list"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
                  }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 pb-28 md:pb-10">
        {/* ── HERO BANNER (Hidden when printing) ──────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card/85 to-card/50 p-5 md:p-7 shadow-sm backdrop-blur-md print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Glow decorations */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-secondary/80 blur-3xl opacity-10 pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
            <div className="h-11 w-11 md:h-14 md:w-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner flex-shrink-0">
              <img
                src="/Puido_Smart_Solutions.svg"
                alt="Puido Smart Solutions"
                className="h-7 md:h-8 w-auto object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
                Discover Our Catalogue
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 font-medium truncate">
                Quality products from{" "}
                <span className="text-primary font-semibold">{location}</span> — updated daily
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-2 relative z-10 w-full sm:w-auto">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02] flex-1 sm:flex-none"
              aria-label="Ask for price on WhatsApp"
            >
              <MessageCircle className="h-4 w-4" /> Ask for Price
            </a>
            <a
              href={`tel:${BUSINESS_PHONE}`}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border/80 bg-card/50 text-foreground text-sm font-semibold hover:bg-muted transition-all duration-300 hover:scale-[1.02] flex-1 sm:flex-none"
              aria-label={`Call us at ${BUSINESS_PHONE}`}
            >
              <Phone className="h-4 w-4 text-primary" /> Call Us
            </a>
          </div>
        </section>

        {/* Stats (Hidden when printing) */}
        {stats && !loading && (
          <div className="grid grid-cols-3 gap-2 md:gap-4 print:hidden">
            <div className="relative overflow-hidden flex items-center gap-3 rounded-2xl border border-border/40 bg-card/65 p-3.5 md:p-4 shadow-xs backdrop-blur-xs transition-all duration-300 hover:shadow-md hover:border-primary/25 group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary-light" />
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Package className="h-4 md:h-5 w-4 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[11px] text-muted-foreground leading-none font-semibold uppercase tracking-wider">Products</p>
                <p className="text-sm md:text-lg font-extrabold mt-1.5 truncate text-foreground">{stats.total}</p>
              </div>
            </div>
            <div className="relative overflow-hidden flex items-center gap-3 rounded-2xl border border-border/40 bg-card/65 p-3.5 md:p-4 shadow-xs backdrop-blur-xs transition-all duration-300 hover:shadow-md hover:border-emerald-500/25 group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-400" />
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <Camera className="h-4 md:h-5 w-4 md:w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[11px] text-muted-foreground leading-none font-semibold uppercase tracking-wider">With Photos</p>
                <p className="text-sm md:text-lg font-extrabold mt-1.5 truncate text-foreground">{stats.withImages}</p>
              </div>
            </div>
            <div className="relative overflow-hidden flex items-center gap-3 rounded-2xl border border-border/40 bg-card/65 p-3.5 md:p-4 shadow-xs backdrop-blur-xs transition-all duration-300 hover:shadow-md hover:border-violet-500/25 group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-violet-400" />
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <TrendingUp className="h-4 md:h-5 w-4 md:w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[11px] text-muted-foreground leading-none font-semibold uppercase tracking-wider">Max Price</p>
                <p className="text-xs md:text-sm font-extrabold mt-1.5 truncate text-primary dark:text-violet-400">
                  {formatCurrency(stats.maxPrice)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter bar (Hidden when printing) */}
        <div className="space-y-2 print:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="pub-catalogue-search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-card/65 backdrop-blur-xs border-border/60 focus-visible:ring-primary/20 rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile filter button → opens bottom sheet */}
            <Button
              id="pub-open-mobile-filters-btn"
              variant="outline"
              size="icon"
              onClick={() => setMobileFiltersOpen(true)}
              className="h-10 w-10 rounded-xl border-border/60 bg-card/65 backdrop-blur-xs relative flex-shrink-0 sm:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Desktop filter button → toggles inline panel */}
            <Button
              id="pub-toggle-filters-btn"
              variant="outline"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`hidden sm:inline-flex h-10 px-4 rounded-xl border-border/60 bg-card/65 backdrop-blur-xs transition-all duration-300 hover:scale-[1.02] flex items-center gap-2 ${filtersOpen ? "border-primary text-primary bg-primary/5" : ""
                }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-xs font-semibold">Filters</span>
              {activeFilterCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </Button>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 px-0.5">
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors min-h-[26px]"
                >
                  &ldquo;{search}&rdquo; <X className="h-3 w-3" />
                </button>
              )}
              {minPrice && (
                <button
                  onClick={() => setMinPrice("")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors min-h-[26px]"
                >
                  Min ₦{minPrice} <X className="h-3 w-3" />
                </button>
              )}
              {maxPrice && (
                <button
                  onClick={() => setMaxPrice("")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors min-h-[26px]"
                >
                  Max ₦{maxPrice} <X className="h-3 w-3" />
                </button>
              )}
              {sort !== "name_asc" && (
                <button
                  onClick={() => setSort("name_asc")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors min-h-[26px]"
                >
                  {SORT_OPTIONS.find((o) => o.value === sort)?.short} <X className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={clearFilters}
                className="text-[11px] text-primary underline underline-offset-2 hover:text-primary/80 ml-1 min-h-[26px]"
              >
                Reset all
              </button>
            </div>
          )}

          {/* Inline collapsible filters — desktop only */}
          {filtersOpen && (
            <div className="hidden sm:block rounded-2xl border border-border/40 bg-card/80 p-4 space-y-3.5 shadow-md backdrop-blur-md animate-[fadeIn_0.2s_ease-out] relative">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-0.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sort Order
                  </label>
                  <Select
                    value={sort}
                    onValueChange={(v) => setSort(v as SortKey)}
                  >
                    <SelectTrigger id="pub-sort-select" className="h-9.5 text-sm rounded-xl bg-background/50 border-border/60">
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
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Min Price (₦)
                  </label>
                  <Input
                    id="pub-min-price"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-9.5 text-sm rounded-xl bg-background/50 border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Max Price (₦)
                  </label>
                  <Input
                    id="pub-max-price"
                    type="number"
                    min={0}
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9.5 text-sm rounded-xl bg-background/50 border-border/60"
                  />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="flex justify-end pt-1 border-t border-border/40 mt-1">
                  <Button
                    id="pub-clear-filters-btn"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground h-8 hover:text-foreground font-semibold hover:bg-transparent"
                  >
                    <X className="h-3.5 w-3.5 mr-1 text-destructive" />
                    Reset all filters
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
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 print:hidden">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} view="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 print:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} view="list" />
              ))}
            </div>
          )
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3.5 print:hidden">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Package className="h-7 w-7 text-destructive opacity-60" />
            </div>
            <div>
              <p className="font-semibold">Could not load catalogue</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setRetryCount((c) => c + 1)}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 print:hidden">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-semibold">No products found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {activeFilterCount > 0
                  ? "Try adjusting your search or filters."
                  : "No products are available right now."}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Screen view */}
            {view === "grid" ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 print:hidden">
                {paginated.map((item) => (
                  <GridCard
                    key={`${item.location}-${item.id}`}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 print:hidden">
                {paginated.map((item) => (
                  <ListRow
                    key={`${item.location}-${item.id}`}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}

            {/* Print-only view (all items, 4-column grid) */}
            <div className="hidden print:grid print:grid-cols-4 print:gap-2.5">
              {filtered.map((item) => (
                <PrintCard
                  key={`print-${item.location}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          </>
        )}

        {/* Show more (Hidden when printing) */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-2 print:hidden">
            <Button
              id="pub-show-more-btn"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="w-full sm:w-auto px-6 font-medium"
            >
              Show more ({filtered.length - paginated.length} remaining)
            </Button>
          </div>
        )}
      </main>

      {/* Product Quick View Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-[92vw] sm:max-w-2xl md:max-w-3xl p-0 overflow-hidden rounded-3xl border border-border/40 bg-card/95 backdrop-blur-md shadow-2xl animate-[scaleIn_0.3s_ease-out]">
            <div className="grid grid-cols-1 md:grid-cols-2 w-full max-h-[85vh] md:max-h-[70vh] overflow-y-auto md:overflow-hidden">
              {/* Left: Image */}
              <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-muted border-b md:border-b-0 md:border-r border-border/40">
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.description}
                    className="h-full w-full object-cover md:absolute md:inset-0"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-3 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-12 md:absolute md:inset-0">
                    <ImageOff className="h-16 w-16 opacity-20 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground/60">
                      No image available
                    </span>
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="flex flex-col justify-between p-5 md:p-7 space-y-4 md:overflow-y-auto">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {selectedItem.location} Branch
                  </span>
                  <DialogTitle className="text-lg md:text-xl font-extrabold text-foreground leading-snug">
                    {selectedItem.description}
                  </DialogTitle>

                  {/* Price card */}
                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/10 shadow-3xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70 block">
                      Price
                    </span>
                    <strong className="text-xl md:text-2xl text-primary font-black tracking-tight mt-1 block">
                      {formatCurrency(selectedItem.price || 0)}
                    </strong>
                  </div>

                  {/* Features */}
                  {selectedItem.features && selectedItem.features.length > 0 && (
                    <div className="pt-1">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                        Key Product Features
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-foreground/80 leading-relaxed"
                          >
                            <span className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="flex flex-col gap-2.5 pt-4 border-t border-border/40 mt-auto">
                  <a
                    href={enquiryLink(selectedItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-md hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02]"
                    aria-label="Enquire about this product on WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
                  </a>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 rounded-xl hover:bg-primary/5 border-border/80 transition-all font-semibold"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${selectedItem.description} - ${formatCurrency(
                            selectedItem.price || 0
                          )}`
                        );
                        toast.success("Product details copied to clipboard");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all"
                      onClick={() => setSelectedItem(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── MOBILE STICKY ACTION BAR (Hidden when printing) ─────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden print:hidden border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2 px-3 py-2.5 pb-safe-bottom">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-transform"
            aria-label="Ask for price on WhatsApp"
          >
            <MessageCircle className="h-4 w-4" /> Ask for Price
          </a>
          <Button
            id="pub-mobile-filter-fab"
            variant="outline"
            onClick={() => setMobileFiltersOpen(true)}
            className="h-11 w-11 rounded-xl flex-shrink-0 relative border-border/60 bg-card"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── MOBILE FILTER BOTTOM SHEET (Hidden when printing) ───────────── */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 pb-safe-bottom sm:hidden border-t border-border/40">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          <SheetHeader className="px-4 pb-2 pt-3">
            <SheetTitle className="text-base text-center">Filters & Sort</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 pt-2 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Sort segmented control */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sort by
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${sort === opt.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border/60 hover:border-primary/30"
                      }`}
                  >
                    {opt.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price Range (₦)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="pub-mobile-min-price"
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-11 text-sm rounded-xl bg-background/50 border-border/60"
                />
                <Input
                  id="pub-mobile-max-price"
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-11 text-sm rounded-xl bg-background/50 border-border/60"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <Button
                id="pub-mobile-clear-filters"
                variant="outline"
                onClick={() => clearFilters()}
                className="flex-1 h-11 rounded-xl font-semibold"
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
              <Button
                id="pub-mobile-apply-filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 h-11 rounded-xl font-semibold"
              >
                Show {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}