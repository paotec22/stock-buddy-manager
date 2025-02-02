import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types";

interface ItemSelectProps {
  form: UseFormReturn<FormData>;
  items: any[];
  onItemSelect: (value: string) => void;
}

export const ItemSelect = ({ form, items, onItemSelect }: ItemSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="itemId"
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>Item</FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                onItemSelect(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item["Item Description"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  );
};