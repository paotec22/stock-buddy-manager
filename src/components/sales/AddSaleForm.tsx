import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { validateSaleSubmission, recordSale } from "./useSaleFormValidation";
import { useAuth } from "@/components/AuthProvider";
import { LocationSelect } from "./form/LocationSelect";
import { ItemSelect } from "./form/ItemSelect";
import { FormData, InventoryItem } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LOCATIONS = ["Cement", "Ikeja"];

interface AddSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  itemId: string;
  quantity: string;
  salePrice: string;
  location: string;
}

const LOCATIONS = ["Ikeja", "Cement"].filter(location => location !== "Main Store");

export function AddSaleForm({ open, onOpenChange, onSuccess }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);

  const form = useForm<FormData>({
    defaultValues: {
      itemId: "",
      quantity: "",
      salePrice: "",
      location: LOCATIONS[0],
    },
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', selectedLocation],
    queryFn: async () => {
      console.log('Fetching inventory for location:', selectedLocation);
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .eq('location', selectedLocation);
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleItemSelect = (itemId: string) => {
    console.log('Selected item ID:', itemId);
    const selectedItem = inventoryItems?.find(item => item.id.toString() === itemId.toString());
    if (selectedItem) {
      form.setValue('salePrice', selectedItem.Price.toString());
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Please login to record sales");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItem = inventoryItems.find(
        (item) => item.id.toString() === data.itemId
      );

      const { parsedQuantity } = await validateSaleSubmission({
        itemId: data.itemId,
        quantity: data.quantity,
        selectedItem,
        userId: session.user.id,
      });

      await recordSale(
        session.user.id,
        data.itemId,
        parsedQuantity,
        parseFloat(data.salePrice),
        selectedItem
      );

      toast.success("Sale recorded successfully");
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error recording sale:', error);
      toast.error(error.message || "Failed to record sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Sale</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationSelect
                form={form}
                locations={LOCATIONS}
                onLocationChange={setSelectedLocation}
              />
              
              <ItemSelect
                form={form}
                items={inventoryItems}
                onItemSelect={handleItemSelect}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Sale"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};