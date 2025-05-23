
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { Check } from "lucide-react";
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
      setOpen(false);
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
      setOpen(data && data.length > 0);
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
    <div className="relative">
      <Input
        placeholder="Item description"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (value.length >= 2 && items.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          // Delay closing to allow for item selection
          setTimeout(() => setOpen(false), 200);
        }}
        className="w-full"
      />
      
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading && (
            <div className="p-2 text-sm text-muted-foreground">Loading...</div>
          )}
          {!loading && items.length === 0 && value.length >= 2 && (
            <div className="p-2 text-sm text-muted-foreground">No items found.</div>
          )}
          {!loading && items.length > 0 && (
            <div>
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item["Item Description"]}</span>
                    <span className="text-sm text-muted-foreground">
                      Price: ₦{item.Price?.toLocaleString()} | Stock: {item.Quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
