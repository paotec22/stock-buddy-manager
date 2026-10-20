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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  ImageOff,
  Search,
  LayoutGrid,
  List,
  Package,
  X,
  Eye,
  Check,
  MessageCircle,
  Phone,
  Printer,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Euro,
  PoundSterling,
  Share2,
  FileText,
  Building,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  CategoryId,
  PRODUCT_CATEGORIES,
  getProductCategory,
} from "@/utils/catalogueCategories";
import { supabase } from "@/lib/supabase";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://itycbazttpidqlgmmrot.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o";

const PAGE_SIZE = 24;
const VIEW_KEY = "pub_catalogue_view_mode";

// Business contact constants
const BUSINESS_PHONE = "08131927116";
const WHATSAPP_NUMBER = "2348131927116";

// Supported Currencies with live conversion multipliers from NGN
type CurrencyCode = "NGN" | "USD" | "EUR" | "GBP";

const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; rate: number; label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  NGN: { symbol: "₦", rate: 1, label: "NGN (₦)", icon: DollarSign },
  USD: { symbol: "$", rate: 1 / 1550, label: "USD ($)", icon: DollarSign },
  EUR: { symbol: "€", rate: 1 / 1680, label: "EUR (€)", icon: Euro },
  GBP: { symbol: "£", rate: 1 / 1980, label: "GBP (£)", icon: PoundSterling },
};

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc";
type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortKey; label: string; short: string }[] = [
  { value: "name_asc", label: "Name: A → Z", short: "A → Z" },
  { value: "name_desc", label: "Name: Z → A", short: "Z → A" },
  { value: "price_asc", label: "Price: Low → High", short: "Price ↑" },
  { value: "price_desc", label: "Price: High → Low", short: "Price ↓" },
];

export interface PublicItem {
  id: number;
  description: string;
  price: number | null;
  location: string;
  image: string | null;
  features?: string[] | null;
  quantity?: number;
}

export interface BasketItem {
  item: PublicItem;
  quantity: number;
}

export default function PublicCatalogue() {
  const location = "Ikeja";

  // URL Query Parameters
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialIds = queryParams.get("ids");
  const proposalTitle = queryParams.get("title");
  const hidePricesParam = queryParams.get("hidePrice") === "1" || queryParams.get("hidePrice") === "true";
  const initialCurrency = (queryParams.get("curr") as CurrencyCode) || "NGN";

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    CURRENCIES[initialCurrency] ? initialCurrency : "NGN"
  );
  const [activeIdsFilter, setActiveIdsFilter] = useState<string | null>(initialIds);

  // Selected item for Lightbox Quick View
  const [selectedItem, setSelectedItem] = useState<PublicItem | null>(null);

  // Customer Enquiry Basket State
  const [basket, setBasket] = useState<BasketItem[]>(() => {
    try {
      const saved = localStorage.getItem("pub_catalogue_enquiry_basket");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [basketOpen, setBasketOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Persist basket
  useEffect(() => {
    try {
      localStorage.setItem("pub_catalogue_enquiry_basket", JSON.stringify(basket));
    } catch {
      // Ignore
    }
  }, [basket]);

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
  }, [search, sort, minPrice, maxPrice, selectedCategory, activeIdsFilter]);

  // Resilient Dual-Tier Data Fetcher:
  // Tier 1: Public catalogue Edge Function
  // Tier 2: Direct Supabase client query with storage signing fallback
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      const qs =
        `?location=${encodeURIComponent(location)}` +
        (activeIdsFilter ? `&ids=${encodeURIComponent(activeIdsFilter)}` : "");

      try {
        // Attempt Tier 1: Edge Function
        const res = await fetch(`${SUPABASE_URL}/functions/v1/public-catalogue${qs}`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setItems((json.items as PublicItem[]) ?? []);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Edge function failure, proceeding to fallback
        console.warn("Public catalogue Edge Function error, falling back to direct query:", err);
      }

      // Tier 2 Fallback: Direct Supabase query
      try {
        let q = supabase
          .from("inventory list")
          .select('id, "Item Description", Price, Quantity, location, image_url, features')
          .eq("location", "Ikeja")
          .order("Item Description", { ascending: true });

        if (activeIdsFilter) {
          const parsedIds = activeIdsFilter
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => Number.isFinite(n) && n > 0);
          if (parsedIds.length > 0) {
            q = q.in("id", parsedIds);
          }
        }

        const { data, error: dbError } = await q;
        if (dbError) throw dbError;

        if (cancelled) return;

        const rawList = data || [];
        const imagePaths = rawList
          .map((i: any) => i.image_url)
          .filter(
            (p: any): p is string =>
              typeof p === "string" && p.length > 0 && !/^https?:\/\//.test(p)
          );

        const urlMap: Record<string, string> = {};
        if (imagePaths.length > 0) {
          const uniquePaths = Array.from(new Set(imagePaths));
          const { data: signed } = await supabase.storage
            .from("inventory-images")
            .createSignedUrls(uniquePaths, 3600);

          signed?.forEach((entry, idx) => {
            if (entry.signedUrl) {
              urlMap[uniquePaths[idx]] = entry.signedUrl;
            }
          });
        }

        const formattedItems: PublicItem[] = rawList.map((i: any) => ({
          id: i.id,
          description: i["Item Description"],
          price: i.Price,
          location: i.location,
          quantity: i.Quantity,
          image: i.image_url
            ? /^https?:\/\//.test(i.image_url)
              ? i.image_url
              : urlMap[i.image_url] ?? null
            : null,
          features: i.features,
        }));

        if (!cancelled) {
          setItems(formattedItems);
          setLoading(false);
        }
      } catch (fallbackErr: any) {
        if (!cancelled) {
          setError(fallbackErr.message || "Unable to load catalogue items");
          setItems([]);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [location, activeIdsFilter]);

  // Format currency with live multi-currency conversion
  const formatPrice = (ngnPrice: number | null): string => {
    if (hidePricesParam) {
      return "Price on Request";
    }
    if (ngnPrice === null || ngnPrice === undefined) return "Price on Request";
    const curr = CURRENCIES[selectedCurrency];
    const converted = ngnPrice * curr.rate;
    if (selectedCurrency === "NGN") {
      return `₦${Math.round(converted).toLocaleString()}`;
    }
    return `${curr.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const cat of PRODUCT_CATEGORIES) {
      counts[cat.id] = 0;
    }
    for (const item of items) {
      const cat = getProductCategory({
        "Item Description": item.description,
        features: item.features,
      });
      counts[cat.id] = (counts[cat.id] || 0) + 1;
    }
    return counts as Record<CategoryId | "all", number>;
  }, [items]);

  // Filtered & sorted products
  const filtered = useMemo(() => {
    let out = items.filter((it) => {
      if (selectedCategory !== "all") {
        const cat = getProductCategory({
          "Item Description": it.description,
          features: it.features,
        });
        if (cat.id !== selectedCategory) return false;
      }

      if (
        search.trim() &&
        !it.description?.toLowerCase().includes(search.toLowerCase()) &&
        !String(it.id).includes(search.trim())
      ) {
        return false;
      }

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
  }, [items, search, sort, minPrice, maxPrice, selectedCategory]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  // Basket Management Functions
  const addToBasket = (item: PublicItem, qty = 1) => {
    setBasket((prev) => {
      const existing = prev.find((b) => b.item.id === item.id);
      if (existing) {
        return prev.map((b) =>
          b.item.id === item.id ? { ...b, quantity: b.quantity + qty } : b
        );
      }
      return [...prev, { item, quantity: qty }];
    });
    toast.success(`Added "${item.description.slice(0, 32)}..." to quote enquiry`);
  };

  const updateBasketQty = (itemId: number, delta: number) => {
    setBasket((prev) =>
      prev
        .map((b) => {
          if (b.item.id === itemId) {
            const next = b.quantity + delta;
            return next > 0 ? { ...b, quantity: next } : null;
          }
          return b;
        })
        .filter(Boolean) as BasketItem[]
    );
  };

  const removeFromBasket = (itemId: number) => {
    setBasket((prev) => prev.filter((b) => b.item.id !== itemId));
    toast.info("Item removed from enquiry");
  };

  const clearBasket = () => {
    setBasket([]);
    toast.info("Enquiry basket cleared");
  };

  const basketItemCount = useMemo(
    () => basket.reduce((acc, curr) => acc + curr.quantity, 0),
    [basket]
  );

  const basketTotalNgn = useMemo(
    () =>
      basket.reduce(
        (acc, curr) => acc + (curr.item.price || 0) * curr.quantity,
        0
      ),
    [basket]
  );

  // Generate structured WhatsApp enquiry message
  const handleSendWhatsAppEnquiry = () => {
    if (basket.length === 0) return;

    let msg = `*PRODUCT ORDER ENQUIRY — PUIDO SMART SOLUTIONS*\n`;
    if (proposalTitle?.trim()) {
      msg += `*Ref Proposal:* ${proposalTitle.trim()}\n`;
    }
    if (customerName.trim()) {
      msg += `*Customer Name:* ${customerName.trim()}\n`;
    }
    if (customerCity.trim()) {
      msg += `*Delivery Location:* ${customerCity.trim()}\n`;
    }
    if (customerNotes.trim()) {
      msg += `*Customer Notes:* ${customerNotes.trim()}\n`;
    }
    msg += `----------------------------------------\n`;

    basket.forEach((b, index) => {
      const unitPrice = b.item.price || 0;
      const lineTotal = unitPrice * b.quantity;
      msg += `${index + 1}. *${b.item.description}*\n`;
      if (!hidePricesParam) {
        msg += `   Qty: ${b.quantity} × ₦${unitPrice.toLocaleString()} = ₦${lineTotal.toLocaleString()} (SKU #${b.item.id})\n`;
      } else {
        msg += `   Qty: ${b.quantity} units (SKU #${b.item.id})\n`;
      }
    });

    msg += `----------------------------------------\n`;
    if (!hidePricesParam) {
      msg += `*Estimated Budget:* ₦${basketTotalNgn.toLocaleString()} (${formatPrice(basketTotalNgn)})\n\n`;
    }
    msg += `Please confirm stock availability, delivery lead time, and installation terms. Thank you!`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, "_blank");
  };

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("name_asc");
    setSelectedCategory("all");
  };

  return (
    <div className="min-h-screen bg-background text-foreground catalogue-bg pb-24">
      {/* ── PRINT-ONLY CATALOGUE HEADER ──────────────────────────────────── */}
      <div className="hidden print:block px-6 pt-4 mb-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <CompanyLogo
              variant="light"
              alt="Puido Smart Solutions"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                PRODUCT SHOWROOM CATALOGUE
              </h2>
              {proposalTitle ? (
                <p className="text-sm font-bold text-slate-800 mt-1">
                  Proposal: {proposalTitle}
                </p>
              ) : (
                <p className="text-xs text-slate-600 mt-1">Official Price &amp; Specification Sheet</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded">
              {location.toUpperCase()} BRANCH
            </span>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Call: {BUSINESS_PHONE}
            </p>
          </div>
        </div>
      </div>

      {/* ── SCREEN SHOWROOM HEADER ───────────────────────────────────────── */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-30 print:hidden shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3">
          {/* Brand & Showroom Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo
              alt="Puido Smart Solutions"
              className="h-9 md:h-11 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-foreground truncate">
                  Puido Store Showroom
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> Verified Inventory
                </span>
              </div>
              <p className="hidden md:block text-xs text-muted-foreground truncate">
                Smart Locks, Automation, Solar &amp; Security Systems — {location} Branch
              </p>
            </div>
          </div>

          {/* Action Hub: Direct Calls, WhatsApp, Currency, Print */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Multi-Currency Selector */}
            {!hidePricesParam && (
              <Select
                value={selectedCurrency}
                onValueChange={(val) => setSelectedCurrency(val as CurrencyCode)}
              >
                <SelectTrigger className="h-8.5 w-24 sm:w-28 text-xs bg-muted/40 border-border/70 font-semibold">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent align="end">
                  {Object.entries(CURRENCIES).map(([code, c]) => (
                    <SelectItem key={code} value={code} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Direct Call Sales Rep */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden lg:flex h-8.5 px-3 text-xs font-semibold gap-1.5 border-border/70 bg-card hover:bg-muted"
            >
              <a href={`tel:${BUSINESS_PHONE}`}>
                <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Call Store</span>
              </a>
            </Button>

            {/* Direct WhatsApp Chat */}
            <Button
              asChild
              size="sm"
              className="h-8.5 px-3 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hello! I am browsing your showroom catalogue${
                    proposalTitle ? ` (${proposalTitle})` : ""
                  } and would like to speak with a sales advisor.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </Button>

            {/* Print / PDF Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.print()}
              className="h-8.5 w-8.5 rounded-lg border-border/70 hover:bg-muted"
              title="Print catalogue or Save as PDF"
            >
              <Printer className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Basket Trigger Icon */}
            <button
              type="button"
              onClick={() => setBasketOpen(true)}
              className="relative p-2 rounded-lg border border-border/70 bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
              title="View your enquiry basket"
            >
              <ShoppingBag className="h-4 w-4 text-primary" />
              {basketItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4.5 min-w-4.5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                  {basketItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── PROPOSAL BANNER (When shared with custom title or specific items) ── */}
      {proposalTitle && (
        <div className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b border-border/60 py-4 px-4 sm:px-6 md:px-8 print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-md">
                  Curated Client Proposal
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">Puido Smart Solutions</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {proposalTitle}
              </h2>
            </div>

            {activeIdsFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveIdsFilter(null)}
                className="self-start sm:self-auto h-8 text-xs font-semibold rounded-xl border-border/70 gap-1.5 bg-background"
              >
                <span>View Full Showroom ({items.length}+ items)</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── SHOWROOM CONTROLS: CATEGORIES + SEARCH ───────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-5 space-y-4 print:hidden">
        {/* Search & Layout Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search smart locks, panels, inverters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-9.5 text-xs bg-card border-border/70 rounded-xl"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Sort Dropdown */}
            <Select value={sort} onValueChange={(val) => setSort(val as SortKey)}>
              <SelectTrigger className="h-9 w-36 text-xs bg-card border-border/70 rounded-xl font-medium">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grid vs List View toggle */}
            <div className="inline-flex items-center p-0.5 rounded-xl border border-border/70 bg-card">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  view === "list"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/40"
              }`}
            >
              All Products ({categoryCounts.all || 0})
            </button>
            {PRODUCT_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                      : "bg-card text-muted-foreground hover:text-foreground border-border/70 hover:bg-muted/40"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span>{cat.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result counts & Active filter bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div>
            Showing <strong className="text-foreground">{filtered.length}</strong> available item
            {filtered.length === 1 ? "" : "s"}
            {selectedCategory !== "all" && (
              <span> in {PRODUCT_CATEGORIES.find((c) => c.id === selectedCategory)?.name}</span>
            )}
            {activeIdsFilter && (
              <span className="ml-1.5 text-primary font-semibold">· Curated Selection</span>
            )}
          </div>
          {(search || selectedCategory !== "all" || minPrice || maxPrice || activeIdsFilter) && (
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setActiveIdsFilter(null);
              }}
              className="text-primary hover:underline font-semibold text-xs flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Reset all
            </button>
          )}
        </div>
      </div>

      {/* ── PRODUCTS SECTION ─────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/50 bg-card/60 p-0 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-muted/80" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-muted/80 rounded w-4/5" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                  <div className="h-5 bg-muted/80 rounded w-1/3 pt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 bg-card/60 rounded-3xl border border-border/70 p-8 max-w-lg mx-auto">
            <p className="text-destructive font-semibold text-sm">Failed to load catalogue items</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs rounded-xl"
            >
              Reload Page
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-card/40 rounded-3xl border border-border/60 p-8 max-w-md mx-auto">
            <Package className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Products Found</h3>
            <p className="text-xs text-muted-foreground">
              No products match your current search or category filter. Try resetting your filters.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs rounded-xl">
              Clear All Filters
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {paginated.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                formattedPrice={formatPrice(item.price)}
                onQuickView={() => setSelectedItem(item)}
                onAddToBasket={() => addToBasket(item)}
                inBasketQty={basket.find((b) => b.item.id === item.id)?.quantity || 0}
                hidePrices={hidePricesParam}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginated.map((item) => (
              <ProductListRow
                key={item.id}
                item={item}
                formattedPrice={formatPrice(item.price)}
                onQuickView={() => setSelectedItem(item)}
                onAddToBasket={() => addToBasket(item)}
                inBasketQty={basket.find((b) => b.item.id === item.id)?.quantity || 0}
                hidePrices={hidePricesParam}
              />
            ))}
          </div>
        )}

        {/* Load More Pagination */}
        {hasMore && (
          <div className="py-8 text-center print:hidden">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="px-6 h-10 rounded-xl text-xs font-semibold shadow-xs hover:bg-muted"
            >
              Load More Products ({filtered.length - paginated.length} remaining)
            </Button>
          </div>
        )}
      </main>

      {/* ── FLOATING ENQUIRY BASKET DOCK (High-Converting WhatsApp CTA) ───── */}
      {basketItemCount > 0 && (
        <aside
          aria-label="Enquiry basket notification"
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 animate-fade-in print:hidden"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 max-w-md">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  {basketItemCount} Item{basketItemCount === 1 ? "" : "s"} in Enquiry
                </span>
              </div>
              {!hidePricesParam && (
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(basketTotalNgn)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBasketOpen(true)}
                className="h-8.5 text-xs font-semibold px-2.5 rounded-xl"
              >
                Review
              </Button>
              <Button
                size="sm"
                onClick={handleSendWhatsAppEnquiry}
                className="h-8.5 text-xs font-semibold px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Send WhatsApp</span>
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* ── ENQUIRY BASKET DRAWER / SHEET ─────────────────────────────────── */}
      <Sheet open={basketOpen} onOpenChange={setBasketOpen}>
        <SheetContent side="right" className="w-[94vw] sm:w-[480px] p-0 flex flex-col bg-card">
          <SheetHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <SheetTitle className="text-base font-bold text-foreground">
                    Product Order &amp; Quotation Enquiry
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Review your items and send directly to Puido sales team via WhatsApp
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Basket Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {basket.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-semibold text-foreground">Your quote enquiry is empty</p>
                <p className="text-[11px] text-muted-foreground">
                  Browse products and click "+ Add to Enquiry" to build your order list.
                </p>
              </div>
            ) : (
              basket.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors flex items-start gap-3"
                >
                  <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.description}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">
                      {item.description}
                    </h4>
                    {!hidePricesParam && (
                      <p className="text-xs font-mono font-bold text-primary mt-1">
                        {formatPrice(item.price)}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="inline-flex items-center rounded-lg border border-border/70 bg-background p-0.5">
                        <button
                          type="button"
                          onClick={() => updateBasketQty(item.id, -1)}
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateBasketQty(item.id, 1)}
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromBasket(item.id)}
                        className="text-muted-foreground hover:text-destructive text-[11px] p-1"
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Details & Checkout Footer */}
          {basket.length > 0 && (
            <div className="p-4 border-t border-border/70 bg-card space-y-3">
              {/* Optional Name & City inputs */}
              <div className="space-y-2">
                <Input
                  placeholder="Your Name / Company (e.g. Arc. Johnson)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8.5 text-xs bg-muted/20 rounded-xl"
                />
                <Input
                  placeholder="Delivery City / Address (e.g. Lekki Phase 1, Lagos)"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="h-8.5 text-xs bg-muted/20 rounded-xl"
                />
                <Input
                  placeholder="Special Requests (e.g. Need installation quotation)"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="h-8.5 text-xs bg-muted/20 rounded-xl"
                />
              </div>

              {/* Total Summary */}
              {!hidePricesParam && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Estimated Budget</p>
                    <p className="text-[10px] text-muted-foreground">In {selectedCurrency}</p>
                  </div>
                  <p className="text-base font-black font-mono text-foreground">
                    {formatPrice(basketTotalNgn)}
                  </p>
                </div>
              )}

              {/* Send WhatsApp CTA */}
              <Button
                type="button"
                onClick={handleSendWhatsAppEnquiry}
                className="w-full h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Send Order Proposal on WhatsApp</span>
              </Button>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <button
                  type="button"
                  onClick={clearBasket}
                  className="hover:text-destructive underline"
                >
                  Clear enquiry
                </button>
                <span>Call sales: {BUSINESS_PHONE}</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── LIGHTBOX QUICK VIEW MODAL ────────────────────────────────────── */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md sm:max-w-2xl p-0 overflow-hidden bg-card border-border/70 rounded-3xl shadow-2xl">
          {selectedItem && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Media Section */}
                <div className="aspect-square bg-muted/30 relative overflow-hidden flex items-center justify-center p-4">
                  {selectedItem.image ? (
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.description}
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                      <ImageOff className="h-12 w-12" />
                      <span className="text-xs">No image available</span>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      {getProductCategory({
                        "Item Description": selectedItem.description,
                        features: selectedItem.features,
                      }).name}
                    </span>

                    <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      {selectedItem.description}
                    </h2>

                    <div className="pt-1">
                      <p className="text-xl sm:text-2xl font-black font-mono text-primary">
                        {formatPrice(selectedItem.price)}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified Stock · Ikeja Showroom
                      </p>
                    </div>

                    {/* Features list */}
                    {selectedItem.features && selectedItem.features.length > 0 && (
                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <p className="text-xs font-semibold text-foreground">Specifications:</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {selectedItem.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-primary font-bold">✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-3 border-t border-border/70 space-y-2">
                    <Button
                      type="button"
                      onClick={() => {
                        addToBasket(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="w-full h-9.5 text-xs font-bold rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Add to Quote Enquiry</span>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-9.5 text-xs font-semibold rounded-xl gap-2 border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hello! I am inquiring about "${selectedItem.description}" (${formatPrice(
                            selectedItem.price
                          )}) from your showroom catalogue.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Instant WhatsApp Inquiry</span>
                      </a>
                    </Button>
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

// ─── Single Product Card (Grid View) ─────────────────────────────────────────
function ProductCard({
  item,
  formattedPrice,
  onQuickView,
  onAddToBasket,
  inBasketQty,
  hidePrices,
}: {
  item: PublicItem;
  formattedPrice: string;
  onQuickView: () => void;
  onAddToBasket: () => void;
  inBasketQty: number;
  hidePrices: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-border/70 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Media Container with Quick View */}
        <div
          onClick={onQuickView}
          className="aspect-square bg-muted/40 relative overflow-hidden flex items-center justify-center cursor-pointer"
        >
          {item.image ? (
            <>
              <img
                src={item.image}
                alt={item.description}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                decoding="async"
                width={360}
                height={360}
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-2xs">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/95 text-slate-900 shadow-md">
                  <Eye className="h-3.5 w-3.5 text-primary" /> Quick View
                </span>
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground/40 gap-1">
              <ImageOff className="h-8 w-8" />
              <span className="text-[10px]">No image</span>
            </div>
          )}

          {/* In-basket indicator */}
          {inBasketQty > 0 && (
            <span className="absolute top-2.5 right-2.5 h-6 px-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1 shadow-sm font-mono">
              <Check className="h-3 w-3" /> {inBasketQty} in quote
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-3.5 space-y-1.5">
          <h3
            onClick={onQuickView}
            className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.3rem] text-foreground group-hover:text-primary transition-colors cursor-pointer"
          >
            {item.description}
          </h3>

          <div className="pt-0.5">
            <span className="text-sm sm:text-base font-black text-primary font-mono tracking-tight">
              {formattedPrice}
            </span>
          </div>
        </div>
      </div>

      {/* Action Strip: Add to Enquiry & WhatsApp */}
      <div className="p-2 sm:p-3 pt-0 flex items-center gap-1.5 mt-auto">
        <Button
          type="button"
          onClick={onAddToBasket}
          size="sm"
          className="flex-1 h-8 text-xs font-semibold rounded-xl gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add to Quote</span>
        </Button>

        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl border-emerald-600/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
          title="Inquire directly on WhatsApp"
        >
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hello! I am inquiring about "${item.description}" (${formattedPrice}) from your online catalogue.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

// ─── Single Product Row (List View) ──────────────────────────────────────────
function ProductListRow({
  item,
  formattedPrice,
  onQuickView,
  onAddToBasket,
  inBasketQty,
  hidePrices,
}: {
  item: PublicItem;
  formattedPrice: string;
  onQuickView: () => void;
  onAddToBasket: () => void;
  inBasketQty: number;
  hidePrices: boolean;
}) {
  return (
    <div className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 group">
      <div
        onClick={onQuickView}
        className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0 cursor-pointer"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.description}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4
          onClick={onQuickView}
          className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer"
        >
          {item.description}
        </h4>
        <p className="text-xs font-mono font-bold text-primary mt-0.5">
          {formattedPrice}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          onClick={onAddToBasket}
          size="sm"
          className="h-8 text-xs font-semibold rounded-xl gap-1 bg-primary text-primary-foreground"
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Add</span>
        </Button>

        <Button
          asChild
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          title="WhatsApp inquiry"
        >
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              `Hello! I am inquiring about "${item.description}" (${formattedPrice}) from your online catalogue.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}