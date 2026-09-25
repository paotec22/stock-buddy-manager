import React from "react";
import {
  CategoryId,
  PRODUCT_CATEGORIES,
  ProductCategory,
} from "@/utils/catalogueCategories";
import { ArrowLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatalogueActiveCategoryBarProps {
  selectedCategory: CategoryId;
  onBackToCategories: () => void;
  onSelectCategory: (catId: CategoryId) => void;
  categoryCounts: Record<CategoryId | "all", number>;
  totalCategoryItems: number;
  className?: string;
}

export function CatalogueActiveCategoryBar({
  selectedCategory,
  onBackToCategories,
  onSelectCategory,
  categoryCounts,
  totalCategoryItems,
  className = "",
}: CatalogueActiveCategoryBarProps) {
  if (selectedCategory === "all") return null;

  const currentCategory = PRODUCT_CATEGORIES.find((c) => c.id === selectedCategory);
  if (!currentCategory) return null;

  const Icon = currentCategory.icon || Layers;

  return (
    <div className={`space-y-2.5 print:hidden ${className}`}>
      {/* ── Active Category Sticky/Top Banner ── */}
      <div
        className={`rounded-2xl border ${currentCategory.accentBorder} bg-card/95 backdrop-blur-md p-3.5 sm:p-4 shadow-xs transition-all`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Back button + Category Details */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Prominent Back Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBackToCategories}
              className="h-10 px-3 rounded-xl border-border/80 bg-background/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs active:scale-[0.98]"
              title="Return to all categories"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>All Categories</span>
            </Button>

            {/* Divider */}
            <div className="h-6 w-px bg-border/60 shrink-0 hidden xs:block" />

            {/* Active Category Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 border ${currentCategory.badgeClass}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight truncate">
                    {currentCategory.name}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${currentCategory.badgeClass}`}
                  >
                    {totalCategoryItems} {totalCategoryItems === 1 ? "product" : "products"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate hidden xs:block">
                  {currentCategory.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Switch Pill indicator */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[11px] text-muted-foreground hidden md:inline">
              Switch category:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[260px] sm:max-w-none">
              {PRODUCT_CATEGORIES.filter((c) => c.id !== selectedCategory).map((otherCat) => {
                const count = categoryCounts[otherCat.id] || 0;
                if (count === 0) return null;
                const OtherIcon = otherCat.icon;
                return (
                  <button
                    key={otherCat.id}
                    type="button"
                    onClick={() => onSelectCategory(otherCat.id)}
                    title={`Switch to ${otherCat.name} (${count})`}
                    className="h-8 px-2 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <OtherIcon className="h-3 w-3" />
                    <span className="max-w-[70px] truncate">{otherCat.shortName}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
