import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { InventoryPreviewTable } from "./InventoryPreviewTable";
import { NewInventoryItem, parseCSVData } from "@/utils/inventoryUtils";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpload: (data: any) => void;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];

export function BulkUploadModal({ open, onOpenChange, onDataUpload }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<NewInventoryItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("Ikeja");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string | null;
        
        if (!text) {
          toast.error("Failed to read file contents");
          return;
        }

        try {
          const items = parseCSVData(text, selectedLocation);
          
          // Validate items
          const invalidItems = items.filter(
            item => item["Item Description"] === '' || 
                   item.Price < 0 || 
                   item.Quantity < 0 ||
                   !Number.isInteger(item.Quantity)
          );
          
          if (invalidItems.length > 0) {
            toast.error("CSV contains invalid data. Please check that all items have descriptions, positive prices, and positive whole number quantities.");
            setPreviewData([]);
            event.target.value = "";
            return;
          }
          
          setPreviewData(items);
        } catch (error) {
          toast.error("Failed to parse CSV file. Please ensure it's in the correct format.");
          console.error("CSV parse error:", error);
          setPreviewData([]);
        }
      };
      reader.readAsText(selectedFile);
    } else {
      toast.error("Please select a valid CSV file");
      event.target.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      toast.error("Please select a file first");
      return;
    }

    try {
      const { data: existingItems } = await supabase
        .from('inventory list')
        .select('"Item Description"')
        .eq('location', selectedLocation);

      const existingItemNames = new Set(existingItems?.map(item => item['Item Description']));
      const duplicateItems = previewData.filter(item => 
        existingItemNames.has(item['Item Description'])
      );

      if (duplicateItems.length > 0) {
        const itemNames = duplicateItems.map(item => item['Item Description']).join(', ');
        toast.error(`These items already exist in ${selectedLocation}: ${itemNames}`);
        return;
      }

      const { error } = await supabase
        .from('inventory list')
        .insert(previewData);

      if (error) throw error;

      toast.success("Inventory items uploaded successfully");
      onDataUpload(previewData);
      setFile(null);
      setPreviewData([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading inventory:', error);
      toast.error("Failed to upload inventory items");
    }
  };

  const downloadTemplate = () => {
    const template = "Item Description,Price,Quantity\n";
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Inventory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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
            <Button variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto">
              <Download className="mr-2" />
              Download Template
            </Button>
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with inventory items
            </p>
          </div>
          
          {previewData.length > 0 && (
            <div className="overflow-auto max-h-[400px] rounded-md border">
              <InventoryPreviewTable items={previewData} />
            </div>
          )}
          
          <Button 
            onClick={handleUpload} 
            className="w-full"
            disabled={!file || previewData.length === 0}
          >
            Upload Inventory
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
