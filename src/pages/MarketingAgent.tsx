import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { getProductCategory, PRODUCT_CATEGORIES, CategoryId } from "@/utils/catalogueCategories";
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Search,
  Package,
  Layers,
  Wrench,
  Loader2,
  Send,
  CheckSquare,
  Globe,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { CompanyLogo } from "@/components/CompanyLogo";

const PLATFORMS = [
  { id: "WhatsApp", label: "WhatsApp Broadcast / Status", icon: MessageCircle, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  { id: "Instagram", label: "Instagram & Facebook Caption", icon: Share2, color: "text-pink-600 bg-pink-500/10 border-pink-500/20" },
  { id: "Twitter", label: "Twitter / X Post", icon: Send, color: "text-sky-600 bg-sky-500/10 border-sky-500/20" },
  { id: "LinkedIn", label: "LinkedIn B2B Pitch", icon: Globe, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  { id: "TikTok", label: "TikTok / Reel Script Hook", icon: Flame, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
];

const TONES = [
  { id: "High-Urgency Sales & Professional", label: "🔥 High-Urgency Flash Sale" },
  { id: "Professional Wholesale & B2B", label: "🏢 Professional B2B / Contractor Pitch" },
  { id: "Luxury Showcase & Premium", label: "💎 Luxury & Premium Architectural Showcase" },
  { id: "Casual & Friendly Customer-Centric", label: "👋 Friendly & Conversational" },
];

export default function MarketingAgent() {
  const location = "Ikeja";

  // Fetch inventory items
  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ["marketing-inventory", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select('id, "Item Description", Price, Quantity, location, image_url, features')
        .eq("location", location)
        .order("Item Description", { ascending: true });
      if (error) throw error;
      return (data as InventoryItem[]) || [];
    },
  });

  const items = useMemo(() => inventoryData || [], [inventoryData]);

  // Agent configuration state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["WhatsApp", "Instagram", "Twitter"]);
  const [selectedTone, setSelectedTone] = useState(TONES[0].id);
  const [customPromoPrompt, setCustomPromoPrompt] = useState("");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, string> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter items in picker
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedCategory !== "all") {
        const cat = getProductCategory(it);
        if (cat.id !== selectedCategory) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const descMatch = it["Item Description"]?.toLowerCase().includes(q);
        const skuMatch = String(it.id).includes(q);
        if (!descMatch && !skuMatch) return false;
      }
      return true;
    });
  }, [items, search, selectedCategory]);

  const toggleItemSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredItems.map((i) => i.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerateCampaign = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one inventory item to market.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one target social media platform.");
      return;
    }

    setGenerating(true);
    setGeneratedPosts(null);

    const targetItems = items
      .filter((i) => selectedIds.has(i.id))
      .map((i) => ({
        description: i["Item Description"],
        price: i.Price,
        quantity: i.Quantity,
        location: i.location,
        features: i.features,
      }));

    try {
      const res = await fetch("/api/marketing/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: targetItems,
          platforms: selectedPlatforms,
          tone: selectedTone,
          customPrompt: customPromoPrompt,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate marketing posts");

      setGeneratedPosts(json.posts);
      toast.success("AI Marketing campaign successfully generated!");
    } catch (err: any) {
      console.error("Marketing generation error:", err);
      toast.error(err.message || "Failed to generate marketing campaign");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyText = async (platform: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(platform);
      toast.success(`${platform} post copied to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  const handleWhatsAppShare = (text: string) => {
    const url = `https://wa.me/2348131927116?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-3 sm:px-4 md:px-8 pt-4">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-xs backdrop-blur-md flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
                AI Social Marketing Agent
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Powered by Gemini
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Pick specific items from your inventory and let AI craft high-converting promotional campaigns for WhatsApp, Instagram, Twitter, and more.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs font-semibold py-1.5 px-3 rounded-xl border-border/70 bg-muted/30">
            {selectedIds.size} Item{selectedIds.size === 1 ? "" : "s"} Selected
          </Badge>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inventory Picker & Config (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Pick Items */}
          <Card className="border-border/70 bg-card/95 backdrop-blur-xs rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> Step 1: Select Inventory Items
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  className="h-8 text-xs rounded-xl"
                >
                  {filteredItems.every((i) => selectedIds.has(i.id)) && filteredItems.length > 0
                    ? "Deselect All Filtered"
                    : `Select All Filtered (${filteredItems.length})`}
                </Button>
              </CardTitle>
              <CardDescription className="text-xs">
                Search and select the products you want to feature in today&apos;s campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search & Category filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-xl bg-background/80"
                  />
                </div>
              </div>

              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 transition-colors ${
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
                  }`}
                >
                  All ({items.length})
                </button>
                {PRODUCT_CATEGORIES.map((cat) => {
                  const count = items.filter((i) => getProductCategory(i).id === cat.id).length;
                  if (count === 0) return null;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg border font-medium shrink-0 transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                          : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50"
                      }`}
                    >
                      {cat.shortName} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Inventory List Scrollable Checklist */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-border/70 divide-y divide-border/40 bg-card/40">
                {loadingInventory ? (
                  <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                    Loading inventory showroom...
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No matching inventory products found.
                  </div>
                ) : (
                  filteredItems.map((it) => {
                    const isChecked = selectedIds.has(it.id);
                    return (
                      <div
                        key={it.id}
                        onClick={() => toggleItemSelection(it.id)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                          isChecked ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded accent-primary text-primary pointer-events-none shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-foreground block truncate">
                            {it["Item Description"]}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            SKU #{it.id} · Stock: {it.Quantity ?? 0}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-primary text-xs shrink-0">
                          {formatCurrency(it.Price || 0)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Campaign Settings */}
          <Card className="border-border/70 bg-card/95 backdrop-blur-xs rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Step 2: Configure Campaign &amp; Tone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platforms */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Target Social Media Channels</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2.5 ${
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30 text-foreground"
                            : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${p.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Marketing Tone &amp; Angle</label>
                <select
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className="h-9 w-full text-xs rounded-xl bg-background/80 border border-border/70 px-3 font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {TONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Custom Promo Instructions / Offers (Optional)
                </label>
                <Input
                  placeholder="e.g. Include 10% weekend discount and free Lagos delivery..."
                  value={customPromoPrompt}
                  onChange={(e) => setCustomPromoPrompt(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-background/80"
                />
              </div>

              <Button
                onClick={handleGenerateCampaign}
                disabled={generating || selectedIds.size === 0}
                className="w-full h-11 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI Marketing Agent is writing your campaign...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Marketing Campaign ({selectedIds.size} items)</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Generated Campaign Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/70 bg-card/95 backdrop-blur-xs rounded-2xl shadow-xs h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" /> Generated Campaign Output
                </span>
                {generatedPosts && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                    Ready to Publish
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Copy posts or launch WhatsApp broadcasts directly with your selected items.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto">
              {!generatedPosts && !generating ? (
                <div className="py-24 text-center space-y-3">
                  <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">No Campaign Generated Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Select your inventory items on the left, choose target platforms, and click generate to let AI create your marketing copy.
                  </p>
                </div>
              ) : generating ? (
                <div className="py-28 text-center space-y-3">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Crafting high-converting copy...</p>
                  <p className="text-[11px] text-muted-foreground">Analyzing item features, pricing, and social media trends.</p>
                </div>
              ) : (
                Object.entries(generatedPosts || {}).map(([platform, text]) => (
                  <div
                    key={platform}
                    className="rounded-2xl border border-border/70 bg-background p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {platform}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyText(platform, text)}
                          className="h-7 text-[11px] rounded-lg px-2 gap-1"
                        >
                          {copiedKey === platform ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedKey === platform ? "Copied" : "Copy"}</span>
                        </Button>
                        {platform === "WhatsApp" && (
                          <Button
                            size="sm"
                            onClick={() => handleWhatsAppShare(text)}
                            className="h-7 text-[11px] rounded-lg px-2 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>Send</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 border border-border/50 p-3 text-xs font-sans whitespace-pre-wrap text-foreground/95 leading-relaxed select-all">
                      {text}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
