
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemDescriptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: any) => void;
}

export const ItemDescriptionAutocomplete = ({ 
  value, 
  onChange, 
  onSelect 
}: ItemDescriptionAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory list')
        .select('*')
        .ilike('Item Description', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error('Error fetching items:', error);
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchItems(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleSelect = (item: any) => {
    onChange(item["Item Description"]);
    onSelect?.(item);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 px-3 py-2 text-left font-normal"
        >
          <Input
            placeholder="Item description"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            onFocus={() => setOpen(true)}
          />
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search items..." 
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            {loading && (
              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
            )}
            {!loading && items.length === 0 && value.length >= 2 && (
              <CommandEmpty>No items found.</CommandEmpty>
            )}
            {!loading && items.length > 0 && (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item["Item Description"]}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item["Item Description"] ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{item["Item Description"]}</span>
                      <span className="text-sm text-muted-foreground">
                        Price: ₦{item.Price?.toLocaleString()} | Stock: {item.Quantity}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
