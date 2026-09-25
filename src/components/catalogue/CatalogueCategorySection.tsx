import React, { useState } from "react";
import { ProductCategory } from "@/utils/catalogueCategories";
import { InventoryItem } from "@/utils/inventoryUtils";
import { ViewMode } from "./CatalogueTypes";
import { GridCard, CompactCard, ListRow } from "./CatalogueCard";
import { ChevronDown, ChevronUp, Layers, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CatalogueCategorySectionProps {
  category: ProductCategory;
  items: InventoryItem[];
  view: ViewMode;
  signedUrls: Record<string, string>;
  onSelectItem: (item: InventoryItem) => void;
  onSelectCategoryFilter?: (catId: string) => void;
  defaultExpanded?: boolean;
}

export function CatalogueCategorySection({
  category,
  items,
  view,
  signedUrls,
  onSelectItem,
  onSelectCategoryFilter,
  defaultExpanded = true,
}: CatalogueCategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const Icon = category.icon || Layers;

  if (items.length === 0) return null;

  return (
    <section
      id={`cat-section-${category.id}`}
      className="scroll-mt-24 space-y-3.5 print:break-inside-avoid print:space-y-2"
    >
      {/* ── Category Header Banner ── */}
      <div
        className={`rounded-2xl border ${category.accentBorder} bg-card/90 backdrop-blur-xs p-3.5 sm:p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 border ${category.badgeClass}`}
          >
            <Icon className="h-5 w-5 sm:h-5 sm:w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {category.name}
              </h2>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${category.badgeClass}`}
              >
                {items.length} {items.length === 1 ? "product" : "products"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 sm:line-clamp-none">
              {category.tagline}
            </p>
          </div>
        </div>

        {/* Category Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {onSelectCategoryFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectCategoryFilter(category.id)}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg font-medium"
              title={`View only ${category.shortName}`}
            >
              <span className="hidden xs:inline">Focus</span>
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-8 px-2.5 text-xs rounded-lg border-border/70 text-muted-foreground hover:text-foreground font-medium"
            title={isExpanded ? "Collapse section" : "Expand section"}
          >
            {isExpanded ? (
              <>
                <span className="text-[11px] hidden sm:inline mr-1">Collapse</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span className="text-[11px] hidden sm:inline mr-1">Expand</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Category Product Items ── */}
      {isExpanded ? (
        <div>
          {view === "grid" && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((item) => (
                <GridCard
                  key={`${item.location}-${item.id}`}
                  item={item}
                  url={item.image_url ? signedUrls[item.image_url] ?? null : null}
                  onClick={() => onSelectItem(item)}
                />
              ))}
            </div>
          )}

          {view === "compact" && (
            <div className="grid gap-2.5 sm:gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {items.map((item) => (
                <CompactCard
                  key={`${item.location}-${item.id}`}
                  item={item}
                  url={item.image_url ? signedUrls[item.image_url] ?? null : null}
                  onClick={() => onSelectItem(item)}
                />
              ))}
            </div>
          )}

          {view === "list" && (
            <div className="space-y-2.5">
              {items.map((item) => (
                <ListRow
                  key={`${item.location}-${item.id}`}
                  item={item}
                  url={item.image_url ? signedUrls[item.image_url] ?? null : null}
                  onClick={() => onSelectItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => setIsExpanded(true)}
          className="rounded-xl border border-dashed border-border/70 bg-card/40 hover:bg-card/70 p-3 text-center cursor-pointer transition-colors"
        >
          <span className="text-xs text-muted-foreground font-medium">
            {items.length} {category.shortName} hidden. Click to show products.
          </span>
        </div>
      )}
    </section>
  );
}
