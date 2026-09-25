import React from "react";
import {
  CategoryId,
  PRODUCT_CATEGORIES,
  ProductCategory,
} from "@/utils/catalogueCategories";
import {
  ChevronRight,
  Layers,
  ArrowRight,
  Sparkles,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatalogueCategoryGridProps {
  categoryCounts: Record<CategoryId | "all", number>;
  onSelectCategory: (categoryId: CategoryId) => void;
  onViewAllProducts?: () => void;
  totalProducts?: number;
  locationName?: string;
  previewImagesByCat?: Record<CategoryId, string[]>;
  className?: string;
}

export function CatalogueCategoryGrid({
  categoryCounts,
  onSelectCategory,
  onViewAllProducts,
  totalProducts = 0,
  locationName = "Ikeja",
  previewImagesByCat = {} as Record<CategoryId, string[]>,
  className = "",
}: CatalogueCategoryGridProps) {
  // Filter out any categories that have zero products if total > 0,
  // or show all so user can see full range. We show all categories that have items first.
  const activeCategories = PRODUCT_CATEGORIES.filter((cat) => {
    const count = categoryCounts[cat.id] ?? 0;
    return count > 0 || cat.id !== "general_products";
  });

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* ── Mobile Category Navigation Hero Card ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-card to-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25">
              <Sparkles className="h-3 w-3" />
              <span>Smart Solutions Directory</span>
              <span className="opacity-60">•</span>
              <span>{locationName}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-foreground">
              Select a Category to Browse
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Tap any category below to view dedicated products, motorized tracks, panels,
              and smart hardware.
            </p>
          </div>

          {onViewAllProducts && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewAllProducts}
              className="h-10 sm:h-11 px-4 rounded-xl border-border/80 font-bold text-xs sm:text-sm bg-card hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
            >
              <Layers className="h-4 w-4" />
              <span>Browse All Products ({totalProducts})</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-60" />
            </Button>
          )}
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Category Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {activeCategories.map((cat: ProductCategory) => {
          const count = categoryCounts[cat.id] ?? 0;
          const Icon = cat.icon || Layers;
          const previews = previewImagesByCat[cat.id] || [];

          return (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectCategory(cat.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCategory(cat.id);
                }
              }}
              className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer bg-card/95 hover:bg-card active:scale-[0.985] text-left select-none shadow-xs hover:shadow-md ${cat.accentBorder} hover:border-primary/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40`}
            >
              <div className="space-y-3">
                {/* Top Row: Icon + Product Count Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-105 ${cat.badgeClass}`}
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                        count > 0
                          ? cat.badgeClass
                          : "bg-muted text-muted-foreground border-border/70"
                      }`}
                    >
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                    <div className="h-8 w-8 rounded-xl bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors text-muted-foreground">
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* Middle: Title & Tagline */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {cat.tagline || cat.description}
                  </p>
                </div>

                {/* Bottom Keyword Chips / Sample Tags */}
                {cat.keywords && cat.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cat.keywords.slice(0, 4).map((kw) => (
                      <span
                        key={kw}
                        className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Optional sample thumbnail strip */}
                {previews.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {previews.slice(0, 3).map((url, idx) => (
                      <div
                        key={idx}
                        className="h-8 w-8 rounded-lg overflow-hidden border border-border/60 bg-muted shrink-0"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    {count > 3 && (
                      <span className="text-[10px] font-medium text-muted-foreground pl-1">
                        +{count - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar / Touch indicator */}
              <div className="pt-3.5 mt-2 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <PackageOpen className="h-3.5 w-3.5" />
                  <span>View Products</span>
                </span>
                <span className="text-[11px] opacity-70 group-hover:opacity-100 flex items-center gap-1">
                  Browse category <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
