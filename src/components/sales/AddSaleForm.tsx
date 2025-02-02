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
import { useAuth } from "@/components/AuthProvider";
import { FormData } from "./types";

const LOCATIONS = ["Ikeja", "Cement"].filter(location => location !== "Main Store");

interface AddSaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSaleForm({ open, onOpenChange, onSuccess }: AddSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const { session } = useAuth();

  const form = useForm<FormData>({
    defaultValues: {
      itemId: "",
      quantity: "",
      salePrice: "",
      location: LOCATIONS[0],
    },
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory', form.watch('location')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .eq('location', form.watch('location'));
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .ilike('"Item Description"', `%${term}%`);
      if (error) {
        console.error('Error fetching items:', error);
        toast.error("Error fetching items");
      } else {
        setSearchResults(data);
      }
    } else {
      setSearchResults([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!session?.user?.id) {
      toast.error("Please login to record sales");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItem = searchResults.find(item => item.id === data.itemId);
      await validateSaleSubmission({
        itemId: data.itemId,
        quantity: data.quantity,
        selectedItem,
        userId: session.user.id
      });
      
      await recordSale(
        session.user.id,
        data.itemId,
        parseInt(data.quantity),
        parseFloat(data.salePrice),
        selectedItem
      );
      
      toast.success("Sale recorded successfully");
      if (onSuccess) onSuccess();
      form.reset();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error(error instanceof Error ? error.message : "Error recording sale");
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
            <FormItem>
              <FormLabel>Search Item</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for items..."
                />
              </FormControl>
            </FormItem>
            {searchResults.length > 0 && (
              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {searchResults.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item["Item Description"]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                    <Input type="number" {...field} />
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
                        <SelectValue placeholder="Select a location" />
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
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Recording Sale..." : "Record Sale"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}