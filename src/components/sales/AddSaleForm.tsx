import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { validateSaleSubmission, recordSale } from "./useSaleFormValidation";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const formSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  quantity: z.string().min(1, "Quantity is required"),
  salePrice: z.string().min(1, "Sale price is required"),
  location: z.string().min(1, "Location is required"),
});

const LOCATIONS = ["Ikeja", "Cement"];

export function AddSaleForm({ open, onOpenChange, onSuccess }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
<<<<<<< HEAD
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
=======
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: "",
      quantity: "",
      salePrice: "",
      location: "Ikeja",
    },
  });

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .ilike('Item Description', `%${term}%`);
      
      if (error) {
        console.error('Error searching items:', error);
        toast.error("Error fetching items");
      } else {
        console.log('Search results:', data);
        setSearchResults(data || []);
      }
    } else {
      setSearchResults([]);
>>>>>>> 8451e19b720dc6bc8184ec18029f890aa0e3b3a1
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form submitted with data:', data);
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
<<<<<<< HEAD
      onSuccess?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to record sale");
=======
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error("Error recording sale");
>>>>>>> 8451e19b720dc6bc8184ec18029f890aa0e3b3a1
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
<<<<<<< HEAD
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
=======
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Item</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Search for items..."
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </FormControl>
                  {searchResults.length > 0 && (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {searchResults.map((item: any) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item["Item Description"]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
>>>>>>> 8451e19b720dc6bc8184ec18029f890aa0e3b3a1
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
<<<<<<< HEAD
                  <FormLabel>Sale Price (₦)</FormLabel>
=======
                  <FormLabel>Sale Price</FormLabel>
>>>>>>> 8451e19b720dc6bc8184ec18029f890aa0e3b3a1
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Enter sale price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
<<<<<<< HEAD
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Sale"}
=======
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              {isSubmitting ? "Recording Sale..." : "Record Sale"}
>>>>>>> 8451e19b720dc6bc8184ec18029f890aa0e3b3a1
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}