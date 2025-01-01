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
import { validateSaleSubmission, recordSale } from "./useSaleFormValidation";

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

const LOCATIONS = ["Ikeja", "Cement"];

export function AddSaleForm({ open, onOpenChange, onSuccess }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory', selectedLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .eq('location', selectedLocation);
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    defaultValues: {
      itemId: "",
      quantity: "",
      salePrice: "",
      location: LOCATIONS[0],
    },
  });

  const handleItemSelect = (itemId: string) => {
    const selectedItem = inventoryItems?.find(item => item.id.toString() === itemId.toString());
    if (selectedItem) {
      form.setValue("salePrice", selectedItem.Price.toString());
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const selectedItem = inventoryItems?.find(
        item => item.id.toString() === data.itemId.toString()
      );

      const { parsedQuantity } = await validateSaleSubmission({
        itemId: data.itemId,
        quantity: data.quantity,
        selectedItem,
        userId: user?.id
      });

      await recordSale(
        user!.id,
        data.itemId,
        parsedQuantity,
        parseFloat(data.salePrice),
        selectedItem
      );

      toast.success("Sale recorded successfully");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to record sale");
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    value={selectedLocation}
                    onValueChange={(value) => {
                      setSelectedLocation(value);
                      field.onChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
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
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleItemSelect(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inventoryItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item["Item Description"]} (₦{item.Price?.toLocaleString()})
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
                  <FormLabel>Sale Price (₦)</FormLabel>
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