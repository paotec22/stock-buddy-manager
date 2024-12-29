import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryHeaderProps {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  onAddItem: () => void;
  onBulkUpload: () => void;
}

const LOCATIONS = ["Ikeja", "Cement"];

export function InventoryHeader({
  selectedLocation,
  onLocationChange,
  onAddItem,
  onBulkUpload
}: InventoryHeaderProps) {
  return (
    <div className="space-y-4 md:space-y-0 md:flex md:justify-between md:items-center mb-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>
      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
        <Select value={selectedLocation} onValueChange={onLocationChange}>
          <SelectTrigger className="w-full md:w-[200px]">
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
        <div className="flex space-x-2">
          <Button className="flex-1 md:flex-none" onClick={onAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none" onClick={onBulkUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>
    </div>
  );
}