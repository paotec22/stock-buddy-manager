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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .ilike('name', `%${term}%`);
      if (error) {
        toast.error("Error fetching items");
      } else {
        setSearchResults(data);
      }
    } else {
      setSearchResults([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await validateSaleSubmission(data);
      await recordSale(data);
      toast.success("Sale recorded successfully");
      if (onSuccess) onSuccess();
    } catch (error) {
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
        <Form onSubmit={handleSubmit(onSubmit)}>
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
            <FormItem>
              <FormLabel>Select Item</FormLabel>
              <FormControl>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchResults.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
          <FormItem>
            <FormLabel>Quantity</FormLabel>
            <FormControl>
              <Input type="text" {...register("quantity", { required: true })} />
            </FormControl>
            {errors.quantity && <FormMessage>Quantity is required</FormMessage>}
          </FormItem>
          <FormItem>
            <FormLabel>Sale Price</FormLabel>
            <FormControl>
              <Input type="text" {...register("salePrice", { required: true })} />
            </FormControl>
            {errors.salePrice && <FormMessage>Sale Price is required</FormMessage>}
          </FormItem>
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}