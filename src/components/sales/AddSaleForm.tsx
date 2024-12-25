import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AddSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  itemId: string;
  quantity: string;
  salePrice: string;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export function AddSaleForm({ open, onOpenChange }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const form = useForm<FormData>({
    defaultValues: {
      itemId: "",
      quantity: "",
      salePrice: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to record sales");
        return;
      }

      const selectedItem = inventoryItems?.find(item => item.id === data.itemId);
      if (!selectedItem) {
        toast.error("Invalid item selected");
        return;
      }

      const quantity = parseInt(data.quantity);
      if (quantity > selectedItem.quantity) {
        toast.error("Not enough items in inventory");
        return;
      }

      const sale = {
        item_id: data.itemId,
        quantity: quantity,
        sale_price: parseFloat(data.salePrice),
        total_amount: quantity * parseFloat(data.salePrice),
        user_id: user.id,
        sale_date: new Date().toISOString(),
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert([sale]);

      if (saleError) {
        console.error('Error recording sale:', saleError);
        toast.error("Failed to record sale");
        return;
      }

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: selectedItem.quantity - quantity })
        .eq('id', data.itemId);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        toast.error("Failed to update inventory");
        return;
      }

      toast.success("Sale recorded successfully");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to record sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record New Sale</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (${item.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter quantity" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input type="number" step="0.01" placeholder="Enter sale price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Sale"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}