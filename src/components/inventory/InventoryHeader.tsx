import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, Users } from "lucide-react";
import { useState } from "react";
import { UserAssignmentModal } from "./UserAssignmentModal";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="w-full sm:w-auto">
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
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
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Button 
            onClick={onAddItem}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {!isMobile && "Add Item"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onBulkUpload}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            {!isMobile && "Bulk Upload"}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowAssignments(true)}
            className="col-span-2 sm:col-span-1 w-full sm:w-auto"
          >
            <Users className="mr-2 h-4 w-4" />
            {!isMobile && "Manage Users"}
          </Button>
        </div>
      </div>
      <UserAssignmentModal 
        open={showAssignments} 
        onOpenChange={setShowAssignments} 
      />
    </div>
  );
}