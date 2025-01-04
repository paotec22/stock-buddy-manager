import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Users } from "lucide-react";
import { useState } from "react";
import { UserAssignmentModal } from "./UserAssignmentModal";

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
  onBulkUpload,
}: InventoryHeaderProps) {
  const [showAssignments, setShowAssignments] = useState(false);

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
      <div className="flex items-center space-x-4">
        <Select value={selectedLocation} onValueChange={onLocationChange}>
          <SelectTrigger className="w-[200px]">
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
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAddItem}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
        <Button variant="outline" onClick={onBulkUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button variant="outline" onClick={() => setShowAssignments(true)}>
          <Users className="mr-2 h-4 w-4" />
          Manage Users
        </Button>
      </div>
      <UserAssignmentModal 
        open={showAssignments} 
        onOpenChange={setShowAssignments} 
      />
    </div>
  );
}