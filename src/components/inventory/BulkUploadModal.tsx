import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpload: (data: any) => void;
}

interface InventoryItem {
  "Item Description": string;
  Price: number;
  Quantity: number;
  Total: number;
  location: string;
}

export function BulkUploadModal({ open, onOpenChange, onDataUpload }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<InventoryItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("Main Store");
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory list')
        .select('location')
        .distinct();

      if (error) throw error;
      setLocations(data.map(item => item.location));
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      const data = await parseCSV(selectedFile);
      setPreviewData(data);
    } else {
      toast.error("Please select a valid CSV file");
      event.target.value = "";
    }
  };

  const parseCSV = (file: File): Promise<InventoryItem[]> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const items: InventoryItem[] = lines
          .slice(1)
          .filter(line => line.trim() !== '')
          .map(line => {
            const values = line.split(',');
            const price = parseFloat(values[1]?.trim() || '0');
            const quantity = parseInt(values[2]?.trim() || '0');
            return {
              "Item Description": values[0]?.trim() || '',
              Price: price,
              Quantity: quantity,
              Total: price * quantity,
              location: selectedLocation
            };
          });

        resolve(items);
      };
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      toast.error("Please select a file first");
      return;
    }

    try {
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
          <div className="flex items-center gap-4">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={downloadTemplate}>
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
            <div className="max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item["Item Description"]}</TableCell>
                      <TableCell>${item.Price.toFixed(2)}</TableCell>
                      <TableCell>{item.Quantity}</TableCell>
                      <TableCell>${item.Total.toFixed(2)}</TableCell>
                      <TableCell>{item.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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