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
    <div className="bg-card border border-border rounded-lg p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col space-y-3.5 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {isOffline && (
            <Badge variant="secondary" className="gap-1.5 bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="outline" className="gap-1.5 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
              <CloudOff className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
          )}
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[180px] bg-background border-input rounded-md h-9 text-sm">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
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
              className="bg-background h-9 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={onAddItem} 
            size="sm" 
            className="flex-1 md:flex-initial min-h-[40px] md:min-h-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 font-medium"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add Item</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBulkUpload} 
            className="flex-1 md:flex-initial min-h-[40px] md:min-h-0 bg-background border-input hover:bg-muted font-medium"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            <span>Upload</span>
          </Button>
          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport} 
              className="min-h-[40px] md:min-h-0 bg-background border-input hover:bg-muted font-medium px-2.5 sm:px-3"
              title="Export Inventory"
            >
              <Download className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
