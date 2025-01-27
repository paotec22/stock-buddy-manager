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
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('Form submitted with data:', data);
    setIsSubmitting(true);
    try {
      await validateSaleSubmission(data);
      await recordSale(data);
      toast.success("Sale recorded successfully");
      form.reset();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error("Error recording sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sale</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}