import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Papa from "papaparse";
import { salesArraySchema } from "@/lib/validationSchemas";

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

            // Validate CSV data
            const validatedData = salesArraySchema.parse(results.data);

            // Verify all item IDs exist and check inventory
            const itemIds = validatedData.map(row => row.item_id);
            const { data: items, error: itemsError } = await supabase
              .from('inventory list')
              .select('id, Quantity')
              .in('id', itemIds);

            if (itemsError) throw itemsError;
            
            if (!items || items.length !== itemIds.length) {
              throw new Error('Some item IDs do not exist in inventory');
            }

            // Check sufficient inventory for each sale
            const inventoryMap = new Map(items.map(i => [i.id, Number(i.Quantity)]));
            for (const sale of validatedData) {
              const available = inventoryMap.get(sale.item_id) || 0;
              if (sale.quantity > available) {
                throw new Error(`Insufficient inventory for item ${sale.item_id}. Available: ${available}, Requested: ${sale.quantity}`);
              }
            }

            // Prepare sales data
            const salesData = validatedData.map((row) => ({
              item_id: row.item_id,
              quantity: row.quantity,
              sale_price: row.sale_price,
              total_amount: row.quantity * row.sale_price,
              actual_purchase_price: null,
              user_id: user.id,
              sale_date: new Date().toISOString(),
            }));

            // Insert sales records
            const { error: salesError } = await supabase
              .from('sales')
              .insert(salesData);

            if (salesError) throw salesError;

            // Update inventory quantities
            for (const sale of salesData) {
              const { error: updateError } = await supabase.rpc('decrement_quantity', {
                item_id: sale.item_id,
                decrement_by: sale.quantity
              });

              if (updateError) throw updateError;
            }

            toast.success(`Successfully uploaded ${salesData.length} sales`);
            onDataUpload();
            onOpenChange(false);
          } catch (error: any) {
            if (error.errors) {
              // Zod validation error
              toast.error(`Validation failed: ${error.errors[0]?.message || 'Invalid CSV data'}`);
            } else {
              toast.error(`Failed to upload sales: ${error.message}`);
            }
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