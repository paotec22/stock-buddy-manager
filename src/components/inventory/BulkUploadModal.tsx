import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUploadModal({ open, onOpenChange }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast.error("Please select a valid CSV file");
      event.target.value = "";
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    console.log("Uploading file:", file);
    toast.success("Inventory items uploaded successfully");
    setFile(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = "Name,SKU,Quantity,Minimum Quantity,Price\n";
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Inventory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="mr-2" />
            Download Template
          </Button>
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
          <Button 
            onClick={handleUpload} 
            className="w-full"
            disabled={!file}
          >
            Upload Inventory
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}