import { useState, useMemo } from "react";
import { useAccessoriesData } from "@/hooks/useAccessoriesData";
import { InventorySubNav } from "@/components/inventory/InventorySubNav";
import { AccessoriesHeader } from "@/components/accessories/AccessoriesHeader";
import { AccessoriesSummaryCards } from "@/components/accessories/AccessoriesSummaryCards";
import { AccessoriesTable } from "@/components/accessories/AccessoriesTable";
import { AddEditAccessoryModal } from "@/components/accessories/AddEditAccessoryModal";
import { exportAccessoriesToCSV } from "@/utils/accessoriesExport";
import { AccessoryItem, NewAccessoryItem } from "@/types/accessories";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Accessories() {
  const [selectedLocation, setSelectedLocation] = useState<string>("Ikeja");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [priceFilter, setPriceFilter] = useState<"all" | "unpriced" | "priced">("all");
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessoryItem | null>(null);

  const {
    items,
    allAccessories,
    isLoading,
    refetch,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleAdjustQuantity,
  } = useAccessoriesData(selectedLocation);

  // Filter items by location, search term, category, and priceFilter
  const filteredItems = useMemo(() => {
    let result = selectedLocation === "All Locations" ? allAccessories : items;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.part_number && item.part_number.toLowerCase().includes(q)) ||
          (item.compatible_with && item.compatible_with.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "All Categories") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Price filter (Core Requirement: spare parts may not have a specific price)
    if (priceFilter === "unpriced" || activeStatFilter === "unpriced") {
      result = result.filter(
        (item) => item.price === null || item.price === undefined || Number(item.price) <= 0
      );
    } else if (priceFilter === "priced") {
      result = result.filter(
        (item) => item.price !== null && item.price !== undefined && Number(item.price) > 0
      );
    }

    // Low stock filter from summary card click
    if (activeStatFilter === "low_stock") {
      result = result.filter((item) => Number(item.quantity) < 5);
    }

    return result;
  }, [items, allAccessories, selectedLocation, searchTerm, selectedCategory, priceFilter, activeStatFilter]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AccessoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (itemData: NewAccessoryItem) => {
    if (editingItem) {
      await handleUpdate(editingItem.id, itemData);
    } else {
      await handleAdd(itemData);
    }
  };

  const handleExport = () => {
    if (filteredItems.length === 0) {
      toast.error("No spare parts available to export");
      return;
    }
    exportAccessoriesToCSV(filteredItems, selectedLocation);
    toast.success("Accessories inventory exported to CSV");
  };

  return (
    <RoleProtectedRoute
      allowedRoles={["admin", "uploader", "inventory_manager", "user"]}
      pageName="Accessories (Spare Parts)"
    >
      <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Sub-page Navigation Tabs */}
        <InventorySubNav activeTab="accessories" />

        {/* Page Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Wrench className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Accessories & Spare Parts
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Inventory for replacement components, mounting brackets, and hardware. Spare parts can be tracked with or without a fixed price.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-9 text-xs gap-1.5"
              title="Refresh inventory"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="h-9 text-xs font-semibold gap-1.5 bg-primary shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Spare Part</span>
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <AccessoriesSummaryCards
          items={selectedLocation === "All Locations" ? allAccessories : items}
          selectedLocation={selectedLocation}
          activeFilter={activeStatFilter}
          onFilterUnpriced={() => {
            if (activeStatFilter === "unpriced") {
              setActiveStatFilter(null);
              setPriceFilter("all");
            } else {
              setActiveStatFilter("unpriced");
              setPriceFilter("unpriced");
            }
          }}
          onFilterLowStock={() => {
            setActiveStatFilter(activeStatFilter === "low_stock" ? null : "low_stock");
          }}
        />

        {/* Search, Location, and Filter Controls */}
        <AccessoriesHeader
          selectedLocation={selectedLocation}
          onLocationChange={(loc) => {
            setSelectedLocation(loc);
            setActiveStatFilter(null);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          priceFilter={priceFilter}
          onPriceFilterChange={(pf) => {
            setPriceFilter(pf);
            setActiveStatFilter(null);
          }}
          onAddItem={handleOpenAdd}
          onExport={handleExport}
        />

        {/* Active Filter Indicators */}
        {(activeStatFilter || priceFilter !== "all" || selectedCategory !== "All Categories" || searchTerm) && (
          <div className="flex items-center justify-between bg-muted/40 px-3 py-2 rounded-lg text-xs text-muted-foreground">
            <span>
              Showing <strong>{filteredItems.length}</strong> matching spare parts
              {priceFilter === "unpriced" && " (unpriced items only)"}
              {priceFilter === "priced" && " (priced items only)"}
              {activeStatFilter === "low_stock" && " (low stock only)"}
            </span>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setPriceFilter("all");
                setActiveStatFilter(null);
              }}
              className="text-primary hover:underline font-medium"
            >
              Reset all filters
            </button>
          </div>
        )}

        {/* Table & Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-xl border border-border/70">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm font-medium">Loading spare parts inventory...</p>
          </div>
        ) : (
          <AccessoriesTable
            items={filteredItems}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onAdjustQuantity={handleAdjustQuantity}
          />
        )}

        {/* Add/Edit Modal */}
        <AddEditAccessoryModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSave={handleSaveModal}
          editingItem={editingItem}
          defaultLocation={selectedLocation}
        />

        {/* Mobile Floating Action Button */}
        <div className="sm:hidden fixed bottom-6 right-6 z-40">
          <Button
            size="icon"
            onClick={handleOpenAdd}
            className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Add Spare Part"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}
