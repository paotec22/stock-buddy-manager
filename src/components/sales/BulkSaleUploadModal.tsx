import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";

interface BulkSaleUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpload: () => void;
}

export function BulkSaleUploadModal({ open, onOpenChange, onDataUpload }: BulkSaleUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        complete: async (results) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              toast.error("Please login to record sales");
              return;
            }

            const sales = results.data.map((row: any) => ({
              item_id: row.item_id,
              quantity: parseInt(row.quantity),
              sale_price: parseFloat(row.sale_price),
              total_amount: parseInt(row.quantity) * parseFloat(row.sale_price),
              user_id: user.id,
              sale_date: new Date().toISOString(),
            }));

            const { error: saleError } = await supabase
              .from('sales')
              .insert(sales);

            if (saleError) throw saleError;

            // Update inventory quantities
            for (const sale of sales) {
              const { error: updateError } = await supabase
                .from('inventory')
                .update({ 
                  quantity: supabase.raw('quantity - ?', [sale.quantity])
                })
                .eq('id', sale.item_id);

              if (updateError) throw updateError;
            }

            toast.success("Sales recorded successfully");
            onDataUpload();
            onOpenChange(false);
          } catch (error) {
            console.error('Error recording sales:', error);
            toast.error("Failed to record sales");
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error("Failed to parse CSV file");
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Sales CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90"
          />
          <div className="text-sm text-muted-foreground">
            <p>CSV should include columns:</p>
            <ul className="list-disc list-inside">
              <li>item_id</li>
              <li>quantity</li>
              <li>sale_price</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}