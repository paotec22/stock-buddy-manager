
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddInventoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOCATIONS = ["Ikeja", "Cement", "Uyo"];

// Form validation schema using Zod
const formSchema = z.object({
  itemDescription: z.string()
    .min(2, "Item description must be at least 2 characters")
    .max(100, "Item description must be less than 100 characters"),
  price: z.string()
    .refine(val => !isNaN(parseFloat(val)), "Price must be a number")
    .refine(val => parseFloat(val) >= 0, "Price cannot be negative"),
  quantity: z.string()
    .refine(val => !isNaN(parseInt(val)), "Quantity must be a number")
    .refine(val => parseInt(val) >= 0, "Quantity cannot be negative")
    .refine(val => Number.isInteger(parseFloat(val)), "Quantity must be a whole number"),
  location: z.string().refine(val => LOCATIONS.includes(val), "Please select a valid location"),
});

type FormData = z.infer<typeof formSchema>;

export function AddInventoryForm({ open, onOpenChange }: AddInventoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemDescription: "",
      price: "",
      quantity: "",
      location: "Ikeja",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const price = parseFloat(data.price);
      const quantity = parseInt(data.quantity);

      const { error } = await supabase.rpc('upsert_inventory_item', {
        p_item_description: data.itemDescription,
        p_price: price,
        p_quantity: quantity,
        p_location: data.location
      });

      if (error) throw error;

      if (imageFile) {
        const { data: row, error: lookupError } = await supabase
          .from('inventory list')
          .select('id')
          .eq('Item Description', data.itemDescription)
          .eq('location', data.location)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (row?.id) {
          const { uploadInventoryImage } = await import('@/lib/inventoryImages');
          const path = await uploadInventoryImage(imageFile, row.id);
          await supabase
            .from('inventory list')
            .update({ image_url: path } as never)
            .eq('id', row.id)
            .eq('location', data.location);
        }
      }

      toast.success("Item added to inventory");
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add inventory item");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₦)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="Enter price" 
                      {...field} 
                    />
                  </FormControl>
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
                    <Input 
                      type="number" 
                      min="0" 
                      step="1" 
                      placeholder="Enter quantity" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
