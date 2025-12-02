import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, WifiOff } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";

interface InventoryHeaderProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  onAddItem: () => void;
  onBulkUpload: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isOffline?: boolean;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];

export function InventoryHeader({
  selectedLocation,
  onLocationChange,
  onAddItem,
  onBulkUpload,
  searchTerm,
  onSearchChange,
  isOffline = false,
}: InventoryHeaderProps) {
  return (
    <div className="bg-card shadow-sm border rounded-xl p-5 sm:p-6 glass-effect slide-up">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {isOffline && (
            <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </Badge>
          )}
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[200px] bg-white/60 dark:bg-black/20 border-gray-200 dark:border-gray-700 rounded-lg">
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
          
          <div className="w-full sm:w-[250px]">
            <SearchInput 
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search inventory..."
              className="bg-white/60 dark:bg-black/20"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={onAddItem} className="hover-scale bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-300">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <Button variant="outline" onClick={onBulkUpload} className="hover-scale bg-white/60 dark:bg-black/20 border-gray-200 dark:border-gray-700">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
