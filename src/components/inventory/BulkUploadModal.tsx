import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import * as Papa from 'papaparse';
import { toast } from "sonner";

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpload: () => void;
}

export function BulkUploadModal({ open, onOpenChange, onDataUpload }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const csvContent = event.target?.result as string;
        
        Papa.parse(csvContent, {
          header: true,
          complete: async (results) => {
            if (results.errors.length > 0) {
              console.error("CSV Parsing Errors:", results.errors);
              toast.error("Error parsing CSV file. Check the file format.");
              setUploading(false);
              return;
            }

            const jsonData = results.data;

            try {
              // Upload the data to Supabase
              console.log('Data to be uploaded:', jsonData);
              
              // Assuming you have a function to handle the upload to Supabase
              // and that it returns a promise that resolves when the upload is complete.
              // Replace `uploadDataToSupabase` with your actual upload function.
              // await uploadDataToSupabase(jsonData);
              
              // Log the jsonData to console
              console.log("jsonData:", jsonData)

              toast.success("Data uploaded successfully!");
              onDataUpload();
              onOpenChange(false);
            } catch (uploadError) {
              console.error("Upload Error:", uploadError);
              toast.error("Failed to upload data. Please try again.");
            } finally {
              setUploading(false);
            }
          },
        });
      } catch (e) {
        console.error("File Read Error:", e);
        toast.error("Failed to read the file. Please try again.");
        setUploading(false);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read the file. Please try again.");
      setUploading(false);
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogTrigger asChild>
        <Button variant="outline">Bulk Upload</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple items to your inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Upload CSV
            </Label>
            <Input type="file" id="email" className="col-span-3" onChange={handleFileChange} />
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="submit" disabled={uploading} onClick={handleFileUpload}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently upload the data to your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFileUpload} disabled={uploading}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
