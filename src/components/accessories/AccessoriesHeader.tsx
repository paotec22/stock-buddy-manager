import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, Filter, Wrench } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { ACCESSORY_CATEGORIES } from "@/types/accessories";

interface AccessoriesHeaderProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  priceFilter: "all" | "unpriced" | "priced";
  onPriceFilterChange: (filter: "all" | "unpriced" | "priced") => void;
  onAddItem: () => void;
  onExport: () => void;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo", "All Locations"];

export function AccessoriesHeader({
  selectedLocation,
  onLocationChange,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  priceFilter,
  onPriceFilterChange,
  onAddItem,
  onExport,
}: AccessoriesHeaderProps) {
  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Top Row: Location, Search, Category, Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Location & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center flex-1">
          {/* Location Select */}
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-full sm:w-[170px] bg-background border-input rounded-lg h-9 text-sm">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="w-full sm:w-[280px]">
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search part name, SKU, compatibility..."
              className="bg-background h-9 text-sm rounded-lg"
            />
          </div>

          {/* Category Select */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-[210px] bg-background border-input rounded-lg h-9 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {ACCESSORY_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Button
            onClick={onAddItem}
            size="sm"
            className="flex-1 lg:flex-initial min-h-[40px] lg:min-h-0 bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add Spare Part</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="min-h-[40px] lg:min-h-0 bg-background border-input hover:bg-muted font-medium px-3"
            title="Export Accessories to CSV"
          >
            <Download className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Bottom Filter Pill Bar: Price filters specifically highlighting unpriced feature */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Price Filter:
          </span>
          <button
            type="button"
            onClick={() => onPriceFilterChange("all")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              priceFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Spares
          </button>
          <button
            type="button"
            onClick={() => onPriceFilterChange("unpriced")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              priceFilter === "unpriced"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Unpriced Spares Only
          </button>
          <button
            type="button"
            onClick={() => onPriceFilterChange("priced")}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              priceFilter === "priced"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Priced Spares Only
          </button>
        </div>

        <span className="text-[11px] text-muted-foreground italic">
          Spare parts inventory tracks physical units even when sales price is variable or not set
        </span>
      </div>
    </div>
  );
}
