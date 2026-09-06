import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, WifiOff, CloudOff, Download } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";

interface InventoryHeaderProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  onAddItem: () => void;
  onBulkUpload: () => void;
  onExport?: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isOffline?: boolean;
  pendingCount?: number;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];

export function InventoryHeader({
  selectedLocation,
  onLocationChange,
  onAddItem,
  onBulkUpload,
  onExport,
  searchTerm,
  onSearchChange,
  isOffline = false,
  pendingCount = 0,
}: InventoryHeaderProps) {
  return (
    <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-4.5 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
      <div className="flex flex-col space-y-3.5 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
          {isOffline && (
            <Badge variant="secondary" className="gap-1.5 bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25 text-xs font-medium">
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="gap-1.5 bg-amber-500/10 text-amber-800 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25 text-xs font-medium">
              <CloudOff className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
          )}
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[170px] bg-background border-border/80 rounded-lg h-9 text-xs font-medium">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location} className="text-xs">
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="w-full sm:w-[260px]">
            <SearchInput 
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search inventory description..."
              className="bg-background h-9 text-xs rounded-lg border-border/80"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onAddItem} 
            size="sm" 
            className="flex-1 md:flex-initial min-h-[38px] md:min-h-0 bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 font-semibold text-xs rounded-lg"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span>Add Item</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBulkUpload} 
            className="flex-1 md:flex-initial min-h-[38px] md:min-h-0 bg-background border-border/80 hover:bg-muted font-medium text-xs rounded-lg"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            <span>Upload</span>
          </Button>
          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport} 
              className="min-h-[38px] md:min-h-0 bg-background border-border/80 hover:bg-muted font-medium text-xs px-2.5 sm:px-3 rounded-lg"
              title="Export Inventory"
            >
              <Download className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
